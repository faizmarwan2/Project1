<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\HrCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
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
        $base = implode('.', array_slice($parts, 0, 2)) ?: 'admin';
        $email = "{$base}@{$domain}";
        $i = 1;

        while (User::where('email', $email)->exists()) {
            $i++;
            $email = "{$base}{$i}@{$domain}";
        }

        return $email;
    }

    public function index(Request $request): JsonResponse
    {
        $search = trim((string)$request->query('search', ''));
        $page = max(1, (int)$request->query('page', 1));
        $limit = min(200, max(1, (int)$request->query('limit', 20)));

        $query = User::where('role', 'HR');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('account_code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $items = $query->orderBy('id')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get(['account_code', 'name', 'email'])
            ->map(function ($u) {
                return [
                    'account_code' => $u->account_code,
                    'name' => $u->name ?: $u->email,
                    'email' => $u->email,
                ];
            });

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

    public function store(Request $request): JsonResponse
    {
        $name = trim((string)$request->input('name', ''));
        if ($name === '') {
            throw new ApiException(400, 'Nama wajib diisi', 'VALIDATION');
        }

        $email = trim(strtolower((string)$request->input('email', '')));
        if ($email === '') {
            $email = self::generateEmail($name);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException(400, 'Format email tidak valid', 'VALIDATION');
        }

        $rawPassword = $request->input('password');
        if ($rawPassword !== null && strlen((string)$rawPassword) < 8) {
            throw new ApiException(400, 'Password minimal 8 karakter', 'VALIDATION');
        }

        $password = $rawPassword ? (string)$rawPassword : rtrim(strtr(base64_encode(random_bytes(9)), '+/', '-_'), '=');

        if (User::where('email', $email)->exists()) {
            throw new ApiException(409, 'Email sudah dipakai', 'DUPLICATE_EMAIL');
        }

        $accountCode = null;
        DB::beginTransaction();
        try {
            $accountCode = HrCodeService::nextHrCode();
            User::create([
                'account_code' => $accountCode,
                'name' => $name,
                'email' => $email,
                'password_hash' => Hash::make($password),
                'role' => 'HR',
            ]);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        return response()->json([
            'account_code' => $accountCode,
            'name' => $name,
            'email' => $email,
            'role' => 'HR',
            'initial_password' => $password,
        ], 201);
    }
}
