<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('offices')) {
            Schema::create('offices', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('address')->nullable();
                $table->double('latitude');
                $table->double('longitude');
                $table->integer('radius_m')->default(100);
                $table->integer('is_active')->default(1);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('offices');
    }
};
