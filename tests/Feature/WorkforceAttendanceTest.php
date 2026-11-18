<?php

namespace Tests\Feature;

use Tests\TestCase;

class WorkforceAttendanceTest extends TestCase
{
    public function test_health_check(): void
    {
        $response = $this->getJson('/api/health');
        $response->assertStatus(200)
                 ->assertJson(['ok' => true]);
    }

    public function test_login_validation_and_invalid_credentials(): void
    {
        // Validation missing email/password
        $res1 = $this->postJson('/api/login', []);
        $res1->assertStatus(400)
             ->assertJsonPath('error.code', 'VALIDATION');

        // Invalid credentials
        $res2 = $this->postJson('/api/login', [
            'email' => 'se@ethes.tech',
            'password' => 'WrongPass!',
        ]);
        $res2->assertStatus(401)
             ->assertJsonPath('error.code', 'INVALID_CREDENTIALS');
    }

    public function test_hr_login_and_me(): void
    {
        $res = $this->postJson('/api/login', [
            'email' => 'se@ethes.tech',
            'password' => 'Admin123!',
        ]);

        $res->assertStatus(200)
            ->assertJsonStructure(['token', 'role', 'user'])
            ->assertJsonPath('role', 'HR');

        $token = $res->json('token');

        // Without token -> 401
        $this->getJson('/api/me')->assertStatus(401);

        // With token -> 200
        $meRes = $this->withHeader('Authorization', 'Bearer ' . $token)
                      ->getJson('/api/me');

        $meRes->assertStatus(200)
              ->assertJsonPath('email', 'se@ethes.tech')
              ->assertJsonPath('role', 'HR');
    }

    public function test_hr_offices_and_dashboard(): void
    {
        $login = $this->postJson('/api/login', [
            'email' => 'se@ethes.tech',
            'password' => 'Admin123!',
        ]);
        $token = $login->json('token');

        // Offices
        $offices = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->getJson('/api/offices');
        $offices->assertStatus(200)
                ->assertJsonStructure(['data']);

        // Dashboard
        $dashboard = $this->withHeader('Authorization', 'Bearer ' . $token)
                          ->getJson('/api/dashboard/attendance');
        $dashboard->assertStatus(200)
                  ->assertJsonStructure(['date', 'summary', 'trend', 'late', 'not_checked_out', 'not_checked_in']);
    }

    public function test_web_root_serves_html(): void
    {
        $res = $this->get('/');
        $res->assertStatus(200);
    }
}
