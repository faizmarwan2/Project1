<?php

namespace App\Services;

class JwtService
{
    private string $secret;
    private int $ttl;

    public function __construct()
    {
        $this->secret = env('JWT_SECRET', 'ganti-dengan-secret-panjang-dan-acak');
        // default 12h = 43200 seconds
        $this->ttl = 43200;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public function sign(array $payload): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $this->ttl;

        $h = self::base64UrlEncode(json_encode($header));
        $p = self::base64UrlEncode(json_encode($payload));
        $sig = hash_hmac('sha256', "$h.$p", $this->secret, true);

        return "$h.$p." . self::base64UrlEncode($sig);
    }

    public function verify(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$h, $p, $s] = $parts;
        $expected = self::base64UrlEncode(hash_hmac('sha256', "$h.$p", $this->secret, true));
        if (!hash_equals($expected, $s)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($p), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }
}
