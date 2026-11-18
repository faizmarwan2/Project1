<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;

class JwtAuth
{
    protected JwtService $jwt;

    public function __construct(JwtService $jwt)
    {
        $this->jwt = $jwt;
    }

    public function handle(Request $request, Closure $next)
    {
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            throw new ApiException(401, 'Token autentikasi diperlukan', 'UNAUTHORIZED');
        }

        $token = trim($matches[1]);
        $payload = $this->jwt->verify($token);
        if (!$payload || !isset($payload['sub'])) {
            throw new ApiException(401, 'Token tidak valid atau kedaluwarsa', 'UNAUTHORIZED');
        }

        $user = User::with('employee')->find($payload['sub']);
        if (!$user) {
            throw new ApiException(401, 'Pengguna tidak ditemukan', 'UNAUTHORIZED');
        }

        $request->setUserResolver(fn() => $user);
        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}
