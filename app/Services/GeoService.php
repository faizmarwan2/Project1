<?php

namespace App\Services;

class GeoService
{
    /**
     * Hitung jarak Haversine dalam meter
     */
    public static function distanceM(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R = 6371000;
        $rad = fn($x) => ($x * M_PI) / 180;

        $dLat = $rad($lat2 - $lat1);
        $dLon = $rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2 + cos($rad($lat1)) * cos($rad($lat2)) * (sin($dLon / 2) ** 2);
        return 2 * $R * asin(sqrt($a));
    }

    public static function validCoord($lat, $lng): bool
    {
        return is_numeric($lat) && is_numeric($lng) && abs((float)$lat) <= 90 && abs((float)$lng) <= 180;
    }
}
