<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class ApiException extends Exception
{
    protected int $status;
    protected string $errorCode;
    protected array $extra;

    public function __construct(int $status, string $message, string $errorCode = 'INTERNAL', array $extra = [])
    {
        parent::__construct($message, $status);
        $this->status = $status;
        $this->errorCode = $errorCode;
        $this->extra = $extra;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getExtra(): array
    {
        return $this->extra;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'error' => array_merge([
                'code' => $this->errorCode,
                'message' => $this->getMessage(),
            ], $this->extra)
        ], $this->status);
    }
}
