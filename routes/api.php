<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\OfficeController;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', fn() => response()->json(['ok' => true]));

// Public Auth
Route::post('/login', [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('jwt.auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    // Offices (Read: HR & Employee, Write: HR)
    Route::get('/offices', [OfficeController::class, 'index']);
    Route::middleware('role:HR')->group(function () {
        Route::post('/offices', [OfficeController::class, 'store']);
        Route::put('/offices/{id}', [OfficeController::class, 'update']);
    });

    // Admins (HR only)
    Route::middleware('role:HR')->prefix('admins')->group(function () {
        Route::get('/', [AdminController::class, 'index']);
        Route::post('/', [AdminController::class, 'store']);
    });

    // Employees (HR only)
    Route::middleware('role:HR')->prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index']);
        Route::get('/{id}', [EmployeeController::class, 'show']);
        Route::post('/', [EmployeeController::class, 'store']);
        Route::put('/{id}', [EmployeeController::class, 'update']);
        Route::delete('/{id}', [EmployeeController::class, 'destroy']);
        Route::post('/{id}/reset-password', [EmployeeController::class, 'resetPassword']);
    });

    // Attendance
    Route::prefix('attendance')->group(function () {
        // Employee punch
        Route::middleware('role:EMPLOYEE')->group(function () {
            Route::get('/today', [AttendanceController::class, 'today']);
            Route::post('/check-in', [AttendanceController::class, 'checkIn']);
            Route::post('/check-out', [AttendanceController::class, 'checkOut']);
        });

        // History (Both HR & Employee)
        Route::get('/history', [AttendanceController::class, 'history']);

        // Photos (Both HR & Employee with owner check in controller)
        Route::get('/{id}/photo/{type}', [AttendanceController::class, 'photo'])->where('type', 'in|out');

        // List for HR
        Route::middleware('role:HR')->get('/', [AttendanceController::class, 'index']);
    });

    // Dashboard (HR only)
    Route::middleware('role:HR')->prefix('dashboard')->group(function () {
        Route::get('/attendance', [DashboardController::class, 'attendance']);
    });
});
