<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendances';
    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'work_date',
        'check_in_at',
        'check_out_at',
        'status',
        'office_id',
        'in_lat',
        'in_lng',
        'in_distance_m',
        'in_photo',
        'out_lat',
        'out_lng',
        'out_distance_m',
        'out_photo',
    ];

    protected $casts = [
        'employee_id' => 'integer',
        'office_id' => 'integer',
        'in_lat' => 'float',
        'in_lng' => 'float',
        'in_distance_m' => 'float',
        'out_lat' => 'float',
        'out_lng' => 'float',
        'out_distance_m' => 'float',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function office()
    {
        return $this->belongsTo(Office::class, 'office_id');
    }

    public function serializeForApi(): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee_code' => $this->employee ? $this->employee->employee_code : null,
            'employee_name' => $this->employee ? $this->employee->name : null,
            'work_date' => $this->work_date,
            'status' => $this->status,
            'check_in_at' => $this->check_in_at,
            'check_out_at' => $this->check_out_at,
            'out_state' => $this->check_out_at ? 'SUDAH_OUT' : 'BELUM_OUT',
            'office_id' => $this->office_id,
            'check_in' => [
                'lat' => $this->in_lat,
                'lng' => $this->in_lng,
                'distance_m' => $this->in_distance_m,
                'photo_url' => $this->in_photo ? "/api/attendance/{$this->id}/photo/in" : null,
            ],
            'check_out' => $this->check_out_at ? [
                'lat' => $this->out_lat,
                'lng' => $this->out_lng,
                'distance_m' => $this->out_distance_m,
                'photo_url' => $this->out_photo ? "/api/attendance/{$this->id}/photo/out" : null,
            ] : null,
        ];
    }
}
