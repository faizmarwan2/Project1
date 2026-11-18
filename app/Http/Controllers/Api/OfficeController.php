<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Office;
use App\Services\GeoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    private function parsePayload(Request $request, ?Office $cur = null): array
    {
        $name = $request->has('name') ? (string)$request->input('name') : ($cur ? $cur->name : null);
        $address = $request->has('address') ? (string)$request->input('address') : ($cur ? $cur->address : null);
        $latitude = $request->has('latitude') ? (float)$request->input('latitude') : ($cur ? (float)$cur->latitude : null);
        $longitude = $request->has('longitude') ? (float)$request->input('longitude') : ($cur ? (float)$cur->longitude : null);
        $radius_m = $request->has('radius_m') ? (int)$request->input('radius_m') : ($cur ? (int)$cur->radius_m : 100);
        $is_active = $request->has('is_active') ? ($request->boolean('is_active') ? 1 : 0) : ($cur ? (int)$cur->is_active : 1);

        if (!$name || !GeoService::validCoord($latitude, $longitude)) {
            throw new ApiException(400, 'name, latitude, longitude wajib & valid', 'VALIDATION');
        }

        if ($radius_m < 10 || $radius_m > 5000) {
            throw new ApiException(400, 'radius_m harus 10-5000 meter', 'VALIDATION');
        }

        return [
            'name' => $name,
            'address' => $address,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'radius_m' => $radius_m,
            'is_active' => $is_active,
        ];
    }

    public function index(): JsonResponse
    {
        $offices = Office::where('is_active', 1)->orderBy('name')->get();
        return response()->json(['data' => $offices]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->parsePayload($request);
        $office = Office::create($data);
        return response()->json($office, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $office = Office::find($id);
        if (!$office) {
            throw new ApiException(404, 'Office tidak ditemukan', 'NOT_FOUND');
        }

        $data = $this->parsePayload($request, $office);
        $office->update($data);

        return response()->json($office->fresh());
    }
}
