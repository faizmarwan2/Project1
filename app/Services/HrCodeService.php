<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class HrCodeService
{
    public static function nextHrCode(): string
    {
        // SQLite: update hr_code_sequence returning seq
        $row = DB::selectOne("UPDATE hr_code_sequence SET seq = seq + 1 WHERE id = 1 RETURNING seq");
        if (!$row) {
            DB::insert("INSERT OR REPLACE INTO hr_code_sequence (id, seq) VALUES (1, 1)");
            $seq = 1;
        } else {
            $seq = $row->seq;
        }

        return 'HR' . str_pad((string)$seq, 2, '0', STR_PAD_LEFT);
    }
}
