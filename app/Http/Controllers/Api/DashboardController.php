<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\TimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function attendance(Request $request): JsonResponse
    {
        $date = (string)$request->query('date', TimeService::workDate());
        if (!TimeService::isDate($date)) {
            throw new ApiException(400, 'Format tanggal harus YYYY-MM-DD', 'VALIDATION');
        }

        $totalActive = Employee::where('status', 'ACTIVE')->count();

        $stats = Attendance::where('work_date', $date)
            ->selectRaw("
                COUNT(*) as sudah_in,
                COALESCE(SUM(CASE WHEN status = 'TEPAT_WAKTU' THEN 1 ELSE 0 END), 0) as tepat_waktu,
                COALESCE(SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END), 0) as terlambat,
                COALESCE(SUM(CASE WHEN check_out_at IS NULL THEN 1 ELSE 0 END), 0) as belum_out,
                COALESCE(SUM(CASE WHEN check_out_at IS NOT NULL THEN 1 ELSE 0 END), 0) as sudah_out
            ")
            ->first();

        $sudahIn = (int)($stats->sudah_in ?? 0);
        $tepatWaktu = (int)($stats->tepat_waktu ?? 0);
        $terlambat = (int)($stats->terlambat ?? 0);
        $belumOut = (int)($stats->belum_out ?? 0);
        $sudahOut = (int)($stats->sudah_out ?? 0);

        $summary = [
            'sudah_in' => $sudahIn,
            'tepat_waktu' => $tepatWaktu,
            'terlambat' => $terlambat,
            'belum_out' => $belumOut,
            'sudah_out' => $sudahOut,
            'belum_in' => max(0, $totalActive - $sudahIn),
        ];

        $late = Attendance::with('employee')
            ->where('work_date', $date)
            ->where('status', 'TERLAMBAT')
            ->orderBy('check_in_at')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'employee_code' => $a->employee ? $a->employee->employee_code : null,
                'name' => $a->employee ? $a->employee->name : null,
                'check_in_at' => $a->check_in_at,
                'check_out_at' => $a->check_out_at,
                'status' => $a->status,
            ]);

        $notCheckedOut = Attendance::with('employee')
            ->where('work_date', $date)
            ->whereNull('check_out_at')
            ->orderBy('check_in_at')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'employee_code' => $a->employee ? $a->employee->employee_code : null,
                'name' => $a->employee ? $a->employee->name : null,
                'check_in_at' => $a->check_in_at,
                'check_out_at' => $a->check_out_at,
                'status' => $a->status,
            ]);

        $notCheckedIn = Employee::where('status', 'ACTIVE')
            ->whereDoesntHave('attendances', function ($q) use ($date) {
                $q->where('work_date', $date);
            })
            ->orderBy('name')
            ->get(['id', 'employee_code', 'name']);

        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = TimeService::addDays($date, -$i);
            $dayStat = Attendance::where('work_date', $d)
                ->selectRaw("
                    COUNT(*) as sudah_in,
                    COALESCE(SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END), 0) as terlambat
                ")
                ->first();

            $trend[] = [
                'date' => $d,
                'sudah_in' => (int)($dayStat->sudah_in ?? 0),
                'terlambat' => (int)($dayStat->terlambat ?? 0),
            ];
        }

        return response()->json([
            'date' => $date,
            'total_active_employees' => $totalActive,
            'summary' => $summary,
            'late' => $late,
            'not_checked_out' => $notCheckedOut,
            'not_checked_in' => $notCheckedIn,
            'trend' => $trend,
        ]);
    }
}
