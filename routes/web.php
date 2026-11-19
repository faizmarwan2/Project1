<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', fn() => response()->json(['ok' => true]));
Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);

Route::get('/', function () {
    $indexPath = public_path('index.html');
    if (File::exists($indexPath)) {
        return Response::file($indexPath);
    }
    return view('welcome');
});
