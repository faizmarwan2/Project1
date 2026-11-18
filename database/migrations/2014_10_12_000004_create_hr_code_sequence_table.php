<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('hr_code_sequence')) {
            Schema::create('hr_code_sequence', function (Blueprint $table) {
                $table->id();
                $table->integer('seq')->default(0);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_code_sequence');
    }
};
