<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    private static function slug(string $s): string
    {
        $clean = iconv('UTF-8', 'ASCII//TRANSLIT', $s);
        $clean = preg_replace('/[^a-zA-Z0-9]+/', '.', strtolower($clean));
        return trim($clean, '.');
    }

    private static function generateEmail(string $name): string
    {
        $domain = env('EMAIL_DOMAIN', 'ethes.tech');
        $parts = array_filter(explode('.', self::slug($name)));
        $base = implode('.', array_slice($parts, 0, 2)) ?: 'karyawan';
        $email = "{$base}@{$domain}";
        $i = 1;

        while (User::where('email', $email)->exists()) {
            $i++;
            $email = "{$base}{$i}@{$domain}";
        }

        return $email;
    }

    private static function generateCode(): string
    {
        // `AUTO_INCREMENT` pada tabel kosong bernilai 1, jadi id terakhir yang
        // pernah dipakai adalah nilainya dikurangi satu.
        $seqRow = DB::selectOne(
            "SELECT AUTO_INCREMENT AS n FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees'"
        );
        $seq = $seqRow ? max(0, (int)$seqRow->n - 1) : 0;

        $r = DB::selectOne("SELECT MAX(CAST(SUBSTRING(employee_code, 3) AS UNSIGNED)) AS n FROM employees WHERE employee_code REGEXP '^ky[0-9]+$'");
        $n = $r ? (int)$r->n : 0;

        $nextNum = max($seq, $n) + 1;
        return 'ky' . str_pad((string)$nextNum, 2, '0', STR_PAD_LEFT);
    }

    private function getEmployeeView(int $id): ?array
    {
        $emp = Employee::with('user')->find($id);
        if (!$emp) {
            return null;
        }

        return [
            'id' => $emp->id,
            'employee_code' => $emp->employee_code,
            'name' => $emp->name,
            'status' => $emp->status,
            'created_at' => $emp->created_at,
            'user_id' => $emp->user ? $emp->user->id : null,
            'email' => $emp->user ? $emp->user->email : null,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $search = trim((string)$request->query('search', ''));
        $status = $request->query('status');
        $page = max(1, (int)$request->query('page', 1));
        $limit = min(200, max(1, (int)$request->query('limit', 20)));

        if ($status !== null && !in_array($status, ['ACTIVE', 'INACTIVE'], true)) {
            throw new ApiException(400, 'status tidak valid', 'VALIDATION');
        }

        $query = Employee::query()->leftJoin('users', 'users.employee_id', '=', 'employees.id');

        if ($status) {
            $query->where('employees.status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('employees.name', 'like', "%{$search}%")
                  ->orWhere('employees.employee_code', 'like', "%{$search}%")
                  ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $items = $query->select([
                'employees.id',
                'employees.employee_code',
                'employees.name',
                'employees.status',
                'users.email',
            ])
            ->orderBy('employees.id')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $items,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => (int)ceil($total / $limit),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $view = $this->getEmployeeView($id);
        if (!$view) {
            throw new ApiException(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');
        }

        return response()->json($view);
    }

    public function store(Request $request): JsonResponse
    {
        $name = trim((string)$request->input('name', ''));
        if ($name === '') {
            throw new ApiException(400, 'Nama wajib diisi', 'VALIDATION');
        }

        $code = trim((string)($request->input('employee_code') ?: self::generateCode()));
        $email = trim(strtolower((string)($request->input('email') ?: self::generateEmail($name))));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException(400, 'Format email tidak valid', 'VALIDATION');
        }

        $rawPass = $request->input('password');
        if ($rawPass !== null && strlen((string)$rawPass) < 8) {
            throw new ApiException(400, 'Password minimal 8 karakter', 'VALIDATION');
        }
        $password = $rawPass ? (string)$rawPass : rtrim(strtr(base64_encode(random_bytes(9)), '+/', '-_'), '=');

        if (Employee::where('employee_code', $code)->exists()) {
            throw new ApiException(409, 'Kode karyawan sudah dipakai', 'DUPLICATE_CODE');
        }

        if (User::where('email', $email)->exists()) {
            throw new ApiException(409, 'Email sudah dipakai', 'DUPLICATE_EMAIL');
        }

        DB::beginTransaction();
        try {
            $employee = Employee::create([
                'employee_code' => $code,
                'name' => $name,
                'status' => 'ACTIVE',
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            User::create([
                'employee_id' => $employee->id,
                'name' => null,
                'account_code' => null,
                'email' => $email,
                'password_hash' => Hash::make($password),
                'role' => 'EMPLOYEE',
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $view = $this->getEmployeeView($employee->id);
        $view['initial_password'] = $password;

        return response()->json($view, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $cur = $this->getEmployeeView($id);
        if (!$cur) {
            throw new ApiException(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');
        }

        $name = $request->has('name') ? trim((string)$request->input('name')) : $cur['name'];
        $code = $request->has('employee_code') ? trim((string)$request->input('employee_code')) : $cur['employee_code'];
        $status = $request->has('status') ? (string)$request->input('status') : $cur['status'];
        $email = $request->has('email') ? trim(strtolower((string)$request->input('email'))) : $cur['email'];

        if ($name === '') {
            throw new ApiException(400, 'Nama tidak boleh kosong', 'VALIDATION');
        }

        if (!in_array($status, ['ACTIVE', 'INACTIVE'], true)) {
            throw new ApiException(400, 'status tidak valid', 'VALIDATION');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException(400, 'Format email tidak valid', 'VALIDATION');
        }

        if ($request->has('password') && strlen((string)$request->input('password')) < 8) {
            throw new ApiException(400, 'Password minimal 8 karakter', 'VALIDATION');
        }

        if (Employee::where('employee_code', $code)->where('id', '!=', $id)->exists()) {
            throw new ApiException(409, 'Kode karyawan sudah dipakai', 'DUPLICATE_CODE');
        }

        if (User::where('email', $email)->where('id', '!=', $cur['user_id'])->exists()) {
            throw new ApiException(409, 'Email sudah dipakai', 'DUPLICATE_EMAIL');
        }

        DB::beginTransaction();
        try {
            Employee::where('id', $id)->update([
                'name' => $name,
                'employee_code' => $code,
                'status' => $status,
            ]);

            $userData = ['email' => $email];
            if ($request->filled('password')) {
                $userData['password_hash'] = Hash::make((string)$request->input('password'));
            }

            if ($cur['user_id']) {
                User::where('id', $cur['user_id'])->update($userData);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        return response()->json($this->getEmployeeView($id));
    }

    public function destroy(int $id): JsonResponse
    {
        $cur = $this->getEmployeeView($id);
        if (!$cur) {
            throw new ApiException(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');
        }

        $attendances = Attendance::where('employee_id', $id)->get();
        $photos = [];
        foreach ($attendances as $att) {
            if ($att->in_photo) $photos[] = $att->in_photo;
            if ($att->out_photo) $photos[] = $att->out_photo;
        }

        // Delete employee (cascades in DB)
        User::where('employee_id', $id)->delete();
        Attendance::where('employee_id', $id)->delete();
        Employee::where('id', $id)->delete();

        $photoDir = base_path('uploads/attendance');
        $photoCleanupFailed = false;

        foreach (array_unique($photos) as $file) {
            $filePath = $photoDir . DIRECTORY_SEPARATOR . basename($file);
            if (File::exists($filePath)) {
                try {
                    File::delete($filePath);
                } catch (\Throwable $e) {
                    $photoCleanupFailed = true;
                }
            }
        }

        $res = ['ok' => true];
        if ($photoCleanupFailed) {
            $res['warning'] = 'Karyawan sudah dihapus, tetapi sebagian foto absensi gagal dihapus.';
        }

        return response()->json($res);
    }

    public function resetPassword(int $id): JsonResponse
    {
        $cur = $this->getEmployeeView($id);
        if (!$cur) {
            throw new ApiException(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');
        }

        $password = rtrim(strtr(base64_encode(random_bytes(9)), '+/', '-_'), '=');
        if ($cur['user_id']) {
            User::where('id', $cur['user_id'])->update([
                'password_hash' => Hash::make($password),
            ]);
        }

        return response()->json([
            'id' => $cur['id'],
            'email' => $cur['email'],
            'new_password' => $password,
        ]);
    }
}
