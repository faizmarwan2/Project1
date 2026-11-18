<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Office;
use App\Services\GeoService;
use App\Services\TimeService;
use DateTime;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttendanceController extends Controller
{
    private const STATUSES = ['TEPAT_WAKTU', 'TERLAMBAT', 'BELUM_OUT', 'SUDAH_OUT', 'BELUM_IN'];
    private const MAX_RANGE_DAYS = 366;

    private function getActiveEmployee(Request $request): Employee
    {
        $user = $request->user();
        if (!$user || !$user->employee_id) {
            throw new ApiException(403, 'Karyawan nonaktif', 'ACCOUNT_INACTIVE');
        }

        $emp = Employee::find($user->employee_id);
        if (!$emp || $emp->status !== 'ACTIVE') {
            throw new ApiException(403, 'Karyawan nonaktif', 'ACCOUNT_INACTIVE');
        }

        return $emp;
    }

    private function verifyGpsAndPhoto(Request $request): array
    {
        if (!$request->hasFile('photo')) {
            throw new ApiException(400, 'Foto kamera wajib dilampirkan (field "photo")', 'PHOTO_REQUIRED');
        }

        $file = $request->file('photo');
        if (!$file->isValid()) {
            throw new ApiException(400, 'File foto tidak valid', 'PHOTO_REQUIRED');
        }

        $lat = $request->input('lat') ?? $request->input('latitude');
        $lng = $request->input('lng') ?? $request->input('longitude');

        if (!GeoService::validCoord($lat, $lng)) {
            throw new ApiException(400, 'Koordinat GPS (lat, lng) wajib & valid', 'GPS_REQUIRED');
        }

        $lat = (float)$lat;
        $lng = (float)$lng;

        $offices = Office::where('is_active', 1)->get();
        if ($offices->isEmpty()) {
            throw new ApiException(409, 'Belum ada lokasi office aktif', 'NO_OFFICE');
        }

        $nearest = null;
        $minDist = null;

        foreach ($offices as $office) {
            $dist = GeoService::distanceM($lat, $lng, (float)$office->latitude, (float)$office->longitude);
            if ($minDist === null || $dist < $minDist) {
                $minDist = $dist;
                $nearest = $office;
            }
        }

        if ($minDist > $nearest->radius_m) {
            $distRound = (int)round($minDist);
            throw new ApiException(
                403,
                "Anda di luar radius office ({$distRound} m dari {$nearest->name}, maks {$nearest->radius_m} m)",
                'OUTSIDE_RADIUS',
                [
                    'office' => $nearest->name,
                    'distance_m' => $distRound,
                    'radius_m' => $nearest->radius_m,
                ]
            );
        }

        // Save uploaded photo
        $uploadDir = base_path('uploads/attendance');
        if (!File::isDirectory($uploadDir)) {
            File::makeDirectory($uploadDir, 0755, true);
        }

        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'att_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $filename;
        if (!@move_uploaded_file($file->getRealPath(), $targetPath)) {
            copy($file->getRealPath(), $targetPath);
        }

        return [
            'lat' => $lat,
            'lng' => $lng,
            'office' => $nearest,
            'distance' => round($minDist, 1),
            'photo' => $filename,
        ];
    }

    public function today(Request $request): JsonResponse
    {
        $emp = $this->getActiveEmployee($request);
        $today = TimeService::workDate();

        $att = Attendance::with('employee')
            ->where('employee_id', $emp->id)
            ->where('work_date', $today)
            ->first();

        $state = !$att ? 'BELUM_IN' : ($att->check_out_at ? 'SUDAH_OUT' : 'SUDAH_IN');

        return response()->json([
            'work_date' => $today,
            'state' => $state,
            'can_check_in' => !$att,
            'can_check_out' => ($att && !$att->check_out_at),
            'attendance' => $att ? $att->serializeForApi() : null,
            'rules' => [
                'work_start' => TimeService::WORK_START,
                'late_tolerance_min' => TimeService::LATE_TOLERANCE_MIN,
                'timezone' => TimeService::TIMEZONE,
            ],
            'offices' => Office::where('is_active', 1)
                ->get(['id', 'name', 'address', 'latitude', 'longitude', 'radius_m']),
        ]);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $emp = $this->getActiveEmployee($request);
        $today = TimeService::workDate();

        if (Attendance::where('employee_id', $emp->id)->where('work_date', $today)->exists()) {
            throw new ApiException(409, 'Anda sudah IN hari ini', 'ALREADY_CHECKED_IN');
        }

        $geo = $this->verifyGpsAndPhoto($request);

        try {
            $att = Attendance::create([
                'employee_id' => $emp->id,
                'work_date' => $today,
                'check_in_at' => TimeService::nowWib(),
                'status' => TimeService::attendanceStatus(),
                'office_id' => $geo['office']->id,
                'in_lat' => $geo['lat'],
                'in_lng' => $geo['lng'],
                'in_distance_m' => $geo['distance'],
                'in_photo' => $geo['photo'],
            ]);
        } catch (\Throwable $e) {
            // Remove uploaded photo if insert fails
            $photoPath = base_path('uploads/attendance/' . $geo['photo']);
            if (File::exists($photoPath)) {
                File::delete($photoPath);
            }
            if (stripos($e->getMessage(), 'unique') !== false) {
                throw new ApiException(409, 'Anda sudah IN hari ini', 'ALREADY_CHECKED_IN');
            }
            throw $e;
        }

        $att->load('employee');
        return response()->json($att->serializeForApi(), 201);
    }

    public function checkOut(Request $request): JsonResponse
    {
        $emp = $this->getActiveEmployee($request);
        $today = TimeService::workDate();

        $att = Attendance::where('employee_id', $emp->id)->where('work_date', $today)->first();
        if (!$att) {
            throw new ApiException(409, 'Belum IN hari ini, OUT ditolak', 'NOT_CHECKED_IN');
        }
        if ($att->check_out_at) {
            throw new ApiException(409, 'Anda sudah OUT hari ini', 'ALREADY_CHECKED_OUT');
        }

        $geo = $this->verifyGpsAndPhoto($request);

        $att->update([
            'check_out_at' => TimeService::nowWib(),
            'out_lat' => $geo['lat'],
            'out_lng' => $geo['lng'],
            'out_distance_m' => $geo['distance'],
            'out_photo' => $geo['photo'],
        ]);

        $att->load('employee');
        return response()->json($att->serializeForApi());
    }

    private function resolveDateRange(Request $request, string $defaultPreset = 'today'): array
    {
        if ($request->filled('date')) {
            $from = $to = (string)$request->input('date');
        } elseif ($request->filled('from') || $request->filled('to')) {
            $from = (string)($request->input('from') ?: $request->input('to'));
            $to = (string)($request->input('to') ?: $request->input('from'));
        } else {
            $preset = (string)$request->input('preset', $defaultPreset);
            $p = TimeService::resolvePreset($preset);
            if (!$p) {
                throw new ApiException(400, 'preset tidak valid (today, yesterday, this_week, last7, last30, this_month, last_month)', 'VALIDATION');
            }
            $from = $p['from'];
            $to = $p['to'];
        }

        if (!TimeService::isDate($from) || !TimeService::isDate($to)) {
            throw new ApiException(400, 'Format tanggal harus YYYY-MM-DD', 'VALIDATION');
        }

        if ($from > $to) {
            throw new ApiException(400, '"from" tidak boleh setelah "to"', 'VALIDATION');
        }

        $d1 = new DateTime($from);
        $d2 = new DateTime($to);
        $diffDays = (int)$d1->diff($d2)->days;
        if ($diffDays > self::MAX_RANGE_DAYS) {
            throw new ApiException(400, 'Rentang maksimal ' . self::MAX_RANGE_DAYS . ' hari', 'VALIDATION');
        }

        return ['from' => $from, 'to' => $to];
    }

    private function listQuery(Request $request, ?int $forcedEmployeeId, string $defaultPreset): array
    {
        $dates = $this->resolveDateRange($request, $defaultPreset);
        $from = $dates['from'];
        $to = $dates['to'];

        $page = max(1, (int)$request->query('page', 1));
        $limit = min(200, max(1, (int)$request->query('limit', 20)));
        $offset = ($page - 1) * $limit;

        $rawStatus = $request->query('status');
        $status = $rawStatus ? strtoupper((string)$rawStatus) : null;
        if ($status && !in_array($status, self::STATUSES, true)) {
            throw new ApiException(400, 'status harus salah satu: ' . implode(', ', self::STATUSES), 'VALIDATION');
        }

        $sort = strtolower((string)$request->query('sort', 'desc')) === 'asc' ? 'asc' : 'desc';
        $empId = $forcedEmployeeId ?? ($request->filled('employee_id') ? (int)$request->query('employee_id') : null);
        $search = trim((string)$request->query('search', ''));

        // BELUM_IN handler
        if ($status === 'BELUM_IN') {
            if ($from !== $to) {
                throw new ApiException(400, 'status BELUM_IN hanya untuk 1 tanggal (gunakan ?date=)', 'VALIDATION');
            }

            $query = Employee::where('status', 'ACTIVE')
                ->whereDoesntHave('attendances', function ($q) use ($from) {
                    $q->where('work_date', $from);
                });

            if ($empId) {
                $query->where('id', $empId);
            }

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('employee_code', 'like', "%{$search}%");
                });
            }

            $total = $query->count();
            $items = $query->orderBy('name')
                ->offset($offset)
                ->limit($limit)
                ->get()
                ->map(function ($e) use ($from) {
                    return [
                        'employee_id' => $e->id,
                        'employee_code' => $e->employee_code,
                        'employee_name' => $e->name,
                        'work_date' => $from,
                        'status' => 'BELUM_IN',
                        'check_in_at' => null,
                        'check_out_at' => null,
                    ];
                });

            return [
                'data' => $items,
                'meta' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'total_pages' => (int)ceil($total / $limit),
                    'from' => $from,
                    'to' => $to,
                ],
            ];
        }

        $query = Attendance::with('employee')
            ->whereBetween('work_date', [$from, $to]);

        if ($empId) {
            $query->where('employee_id', $empId);
        }

        if ($search !== '') {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if ($status === 'TEPAT_WAKTU' || $status === 'TERLAMBAT') {
            $query->where('status', $status);
        } elseif ($status === 'BELUM_OUT') {
            $query->whereNull('check_out_at');
        } elseif ($status === 'SUDAH_OUT') {
            $query->whereNotNull('check_out_at');
        }

        $total = $query->count();
        $items = $query->orderBy('work_date', $sort)
            ->orderBy('check_in_at', $sort)
            ->offset($offset)
            ->limit($limit)
            ->get()
            ->map(fn($att) => $att->serializeForApi());

        return [
            'data' => $items,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => (int)ceil($total / $limit),
                'from' => $from,
                'to' => $to,
            ],
        ];
    }

    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role === 'EMPLOYEE') {
            if ($request->filled('employee_id') && (int)$request->query('employee_id') !== $user->employee_id) {
                throw new ApiException(403, 'Tidak boleh melihat data karyawan lain', 'FORBIDDEN');
            }
            return response()->json($this->listQuery($request, $user->employee_id, 'this_month'));
        }

        return response()->json($this->listQuery($request, null, 'today'));
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->listQuery($request, null, 'today'));
    }

    public function photo(Request $request, int $id, string $type)
    {
        $att = Attendance::find($id);
        if (!$att) {
            throw new ApiException(404, 'Data tidak ditemukan', 'NOT_FOUND');
        }

        $user = $request->user();
        if ($user->role === 'EMPLOYEE' && $att->employee_id !== $user->employee_id) {
            throw new ApiException(403, 'Akses ditolak', 'FORBIDDEN');
        }

        $file = $type === 'in' ? $att->in_photo : ($type === 'out' ? $att->out_photo : null);
        if (!$file) {
            throw new ApiException(404, 'Foto tidak ada', 'NOT_FOUND');
        }

        $filePath = base_path('uploads/attendance/' . basename($file));
        if (!File::exists($filePath)) {
            throw new ApiException(404, 'File foto tidak ditemukan di storage', 'NOT_FOUND');
        }

        return response()->file($filePath);
    }
}
