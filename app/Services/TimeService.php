<?php

namespace App\Services;

use DateTime;
use DateTimeZone;

class TimeService
{
    public const TIMEZONE = 'Asia/Jakarta';
    public const WORK_START = '08:00';
    public const LATE_TOLERANCE_MIN = 15;

    public static function tz(): DateTimeZone
    {
        return new DateTimeZone(self::TIMEZONE);
    }

    public static function now(): DateTime
    {
        return new DateTime('now', self::tz());
    }

    public static function workDate(?DateTime $d = null): string
    {
        $d = $d ?? self::now();
        $d->setTimezone(self::tz());
        return $d->format('Y-m-d');
    }

    public static function nowWib(?DateTime $d = null): string
    {
        $d = $d ?? self::now();
        $d->setTimezone(self::tz());
        return $d->format('Y-m-d\TH:i:sP');
    }

    public static function attendanceStatus(?DateTime $d = null): string
    {
        $d = $d ?? self::now();
        $d->setTimezone(self::tz());
        [$h, $m] = explode(':', self::WORK_START);
        $limit = ((int)$h * 60) + (int)$m + self::LATE_TOLERANCE_MIN;
        $curMinutes = ((int)$d->format('H') * 60) + (int)$d->format('i');

        return $curMinutes > $limit ? 'TERLAMBAT' : 'TEPAT_WAKTU';
    }

    public static function isDate(?string $s): bool
    {
        if (!$s || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) {
            return false;
        }
        $d = DateTime::createFromFormat('Y-m-d', $s);
        return $d && $d->format('Y-m-d') === $s;
    }

    public static function addDays(string $ymd, int $n): string
    {
        $d = new DateTime($ymd . ' 00:00:00', self::tz());
        $d->modify("{$n} days");
        return $d->format('Y-m-d');
    }

    public static function resolvePreset(string $preset): ?array
    {
        $today = self::workDate();
        [$y, $m] = explode('-', $today);
        $y = (int)$y;
        $m = (int)$m;
        $ms = str_pad((string)$m, 2, '0', STR_PAD_LEFT);

        switch ($preset) {
            case 'today':
                return ['from' => $today, 'to' => $today];
            case 'yesterday':
                $y1 = self::addDays($today, -1);
                return ['from' => $y1, 'to' => $y1];
            case 'last7':
                return ['from' => self::addDays($today, -6), 'to' => $today];
            case 'last30':
                return ['from' => self::addDays($today, -29), 'to' => $today];
            case 'this_week':
                $d = new DateTime($today . ' 00:00:00', self::tz());
                $dow = (int)$d->format('N'); // 1 = Monday, 7 = Sunday
                return ['from' => self::addDays($today, -($dow - 1)), 'to' => $today];
            case 'this_month':
                return ['from' => "{$y}-{$ms}-01", 'to' => $today];
            case 'last_month':
                $pm = $m === 1 ? 12 : $m - 1;
                $py = $m === 1 ? $y - 1 : $y;
                $pms = str_pad((string)$pm, 2, '0', STR_PAD_LEFT);
                return [
                    'from' => "{$py}-{$pms}-01",
                    'to' => self::addDays("{$y}-{$ms}-01", -1)
                ];
            default:
                return null;
        }
    }
}
