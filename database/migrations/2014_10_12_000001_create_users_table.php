<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
                $table->string('name')->nullable();
                $table->string('account_code')->nullable()->unique();
                $table->string('email')->unique();
                $table->string('password_hash');
                $table->string('role'); // HR or EMPLOYEE
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
