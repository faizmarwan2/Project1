<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class HrCodeService
{
    /**
     * Kode HR berikutnya (HR01, HR02, ...).
     *
     * Penomoran memakai satu baris `hr_code_sequence` yang dinaikkan secara
     * atomik. `LAST_INSERT_ID(expr)` menyimpan nilai baru pada koneksi yang
     * sama sehingga dua permintaan bersamaan tidak mendapat kode yang sama.
     */
    public static function nextHrCode(): string
    {
        // Pastikan baris tunggal ada tanpa menimpa nilai yang sudah berjalan.
        DB::insert('INSERT IGNORE INTO hr_code_sequence (id, seq) VALUES (1, 0)');

        DB::update('UPDATE hr_code_sequence SET seq = LAST_INSERT_ID(seq + 1) WHERE id = 1');

        $row = DB::selectOne('SELECT LAST_INSERT_ID() AS seq');
        $seq = $row ? (int)$row->seq : 0;

        return 'HR' . str_pad((string)$seq, 2, '0', STR_PAD_LEFT);
    }
}
