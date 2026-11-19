<?php

namespace Database\Seeders;

use App\Models\Office;
use Illuminate\Database\Seeder;

/**
 * Satu office demo agar aplikasi bisa dipakai langsung setelah `db:seed`.
 *
 * GANTI koordinat ini dengan lokasi kantor sebenarnya
 * (Google Maps -> klik kanan -> salin koordinat), lewat `PUT /api/offices/{id}`.
 */
class OfficeSeeder extends Seeder
{
    public function run(): void
    {
        if (Office::query()->exists()) {
            return;
        }

        Office::create([
            'name' => 'Kantor Pusat',
            'address' => 'Jl. Contoh No. 1',
            'latitude' => -7.4296,
            'longitude' => 111.0095,
            'radius_m' => 100,
            'is_active' => 1,
        ]);

        $this->command?->info('Office demo dibuat (Sragen) - ubah lewat PUT /api/offices/{id}');
    }
}
