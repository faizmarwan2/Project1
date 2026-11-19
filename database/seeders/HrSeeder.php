<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\HrCodeService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Menyiapkan akun HR pertama.
 *
 * Aman dijalankan berulang: hanya membuat akun bila belum ada user ber-role HR.
 */
class HrSeeder extends Seeder
{
    public function run(): void
    {
        if (User::where('role', 'HR')->exists()) {
            return;
        }

        $email = strtolower((string) env('HR_EMAIL', 'se@ethes.tech'));
        $password = (string) env('HR_PASSWORD', 'Admin123!');

        User::create([
            'employee_id' => null,
            'name' => 'Super Admin',
            'account_code' => HrCodeService::nextHrCode(),
            'email' => $email,
            'password_hash' => Hash::make($password),
            'role' => 'HR',
        ]);

        // Sengaja tidak mencetak password (BUG-03 pada implementasi Node).
        $this->command?->info("Akun HR dibuat: {$email} (password dari HR_PASSWORD / .env)");
    }
}
