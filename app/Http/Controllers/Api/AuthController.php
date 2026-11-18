<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected JwtService $jwt;

    public function __construct(JwtService $jwt)
    {
        $this->jwt = $jwt;
    }

    public function login(Request $request): JsonResponse
    {
        $email = $request->input('email');
        $password = $request->input('password');

        if (!$email || !$password) {
            throw new ApiException(400, 'Email dan password wajib diisi', 'VALIDATION');
        }

        $user = User::with('employee')
            ->where('email', strtolower(trim($email)))
            ->first();

        if (!$user || !Hash::check((string)$password, $user->password_hash)) {
            throw new ApiException(401, 'Email atau password salah', 'INVALID_CREDENTIALS');
        }

        if ($user->role === 'EMPLOYEE' && (!$user->employee || $user->employee->status !== 'ACTIVE')) {
            throw new ApiException(403, 'Akun karyawan nonaktif', 'ACCOUNT_INACTIVE');
        }

        $token = $this->jwt->sign([
            'sub' => $user->id,
            'role' => $user->role,
        ]);

        return response()->json([
            'token' => $token,
            'role' => $user->role,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'employee_id' => $user->employee_id,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $emp = null;

        if ($user->employee_id && $user->employee) {
            $emp = [
                'id' => $user->employee->id,
                'employee_code' => $user->employee->employee_code,
                'name' => $user->employee->name,
                'status' => $user->employee->status,
            ];
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'account_code' => $user->account_code,
            'employee' => $emp,
        ]);
    }
}
