<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed data awal aplikasi.
     *
     * Dijalankan oleh `php artisan db:seed`. HrSeeder wajib ada lebih dulu agar
     * akun HR pertama tersedia sebelum office demo dibuat.
     */
    public function run(): void
    {
        $this->call([
            HrSeeder::class,
            OfficeSeeder::class,
        ]);
    }
}
