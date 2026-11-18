<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('attendances')) {
            Schema::create('attendances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->string('work_date'); // YYYY-MM-DD
                $table->string('check_in_at')->nullable();
                $table->string('check_out_at')->nullable();
                $table->string('status'); // TEPAT_WAKTU or TERLAMBAT
                $table->foreignId('office_id')->nullable()->constrained('offices')->nullOnDelete();
                $table->double('in_lat')->nullable();
                $table->double('in_lng')->nullable();
                $table->double('in_distance_m')->nullable();
                $table->string('in_photo')->nullable();
                $table->double('out_lat')->nullable();
                $table->double('out_lng')->nullable();
                $table->double('out_distance_m')->nullable();
                $table->string('out_photo')->nullable();

                $table->unique(['employee_id', 'work_date']);
                $table->index('work_date');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
