<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $levels = [];
    protected $dontReport = [
        ApiException::class,
    ];
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->renderable(function (ApiException $e, $request) {
            return $e->render();
        });

        $this->renderable(function (NotFoundHttpException $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return response()->json([
                    'error' => [
                        'code' => 'NOT_FOUND',
                        'message' => 'Endpoint tidak ditemukan'
                    ]
                ], 404);
            }
        });

        $this->renderable(function (ValidationException $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                $firstMsg = collect($e->errors())->flatten()->first() ?: 'Validasi gagal';
                return response()->json([
                    'error' => [
                        'code' => 'VALIDATION',
                        'message' => $firstMsg
                    ]
                ], 400);
            }
        });

        $this->renderable(function (Throwable $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                $status = $e instanceof HttpException ? $e->getStatusCode() : 500;
                $code = $status === 404 ? 'NOT_FOUND' : ($status === 403 ? 'FORBIDDEN' : ($status === 401 ? 'UNAUTHORIZED' : 'INTERNAL'));
                $message = $status === 500 ? 'Terjadi kesalahan server' : $e->getMessage();
                return response()->json([
                    'error' => [
                        'code' => $code,
                        'message' => $message
                    ]
                ], $status);
            }
        });
    }
}
