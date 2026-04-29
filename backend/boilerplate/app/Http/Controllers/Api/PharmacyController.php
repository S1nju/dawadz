<?php

namespace App\Http\Controllers\Api;

use App\Models\Pharmacy;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Clickbar\Magellan\Data\Geometries\Point;
use Clickbar\Magellan\Database\PostgisFunctions\ST;

class PharmacyController extends Controller
{
    private const MIN_NEARBY_DISTANCE_KM = 5;

    private const CITY_COORDINATES = [
        'oran' => ['lat' => 35.6971, 'lng' => -0.6308],
        'rabat' => ['lat' => 34.0209, 'lng' => -6.8416],
        'casablanca' => ['lat' => 33.5731, 'lng' => -7.5898],
        'marrakech' => ['lat' => 31.6295, 'lng' => -7.9811],
    ];

    private function isScopedPharmacyOwner($user): bool
    {
        return $user->hasRole('pharmacy_admin') || $user->hasRole('pharmacy');
    }

    public function nearby(Request $request)
    {
        $validated = $request->validate([
            'city' => ['nullable', 'string', 'max:255', 'required_without_all:latitude,longitude'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_without:city', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_without:city', 'required_with:latitude'],
            'radius_km' => ['nullable', 'numeric', 'min:0.1'],
            'medication_id' => ['nullable', 'integer', 'exists:medications,id'],
            'medication_name' => ['nullable', 'string', 'max:255'],
        ]);

        if (! empty($validated['city'])) {
            $city = trim((string) $validated['city']);
            $normalizedCity = strtolower($city);

            $knownCityCoords = self::CITY_COORDINATES[$normalizedCity] ?? null;

            if ($knownCityCoords) {
                $lat = (float) $knownCityCoords['lat'];
                $lng = (float) $knownCityCoords['lng'];
            } else {
                $cityPharmacies = Pharmacy::query()->where('city', 'ilike', $city);
                $avgLat = $cityPharmacies->clone()->avg('latitude');
                $avgLng = $cityPharmacies->clone()->avg('longitude');

                if ($avgLat === null || $avgLng === null) {
                    return response()->json([
                        'message' => 'City not found in pharmacies data.',
                    ], 422);
                }

                $lat = (float) $avgLat;
                $lng = (float) $avgLng;
            }
        } else {
            $lat = (float) $validated['latitude'];
            $lng = (float) $validated['longitude'];
        }

        $radius = (float) ($validated['radius_km'] ?? 10);
        $currentLocation = Point::makeGeodetic($lat, $lng);
        $distanceExpr = ST::distanceSphere($currentLocation, 'location');

        $query = Pharmacy::query()
            ->select('pharmacies.*')
            ->addSelect(ST::y('location')->as('latitude'))
            ->addSelect(ST::x('location')->as('longitude'))
            ->addSelect($distanceExpr->as('distance_meters'))
            ->with(['inventories.medication']);
        if (! empty($validated['medication_id'])) {
            $query->whereHas('inventories', function ($builder) use ($validated) {
                $builder->where('medication_id', $validated['medication_id'])
                    ->where('qte', '>', 0);
            });
        }

        if (! empty($validated['medication_name'])) {
            $name = '%'.$validated['medication_name'].'%';
            $query->whereHas('inventories.medication', function ($builder) use ($name) {
                $builder->where('name', 'like', $name)
                    ->orWhere('commercial_name', 'like', $name);
            });
        }

        $query->where($distanceExpr, '<=', $radius * 1000)
            ->orderBy($distanceExpr);

        $paginator = $query->paginate((int) $request->input('per_page', 15));
        $paginator->getCollection()->transform(function ($pharmacy) {
            $distanceMeters = (float) ($pharmacy->distance_meters ?? 0);
            $pharmacy->distance_km = round($distanceMeters / 1000, 3);
            unset($pharmacy->distance_meters);

            return $pharmacy;
        });

        return response()->json($paginator);
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'city' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'radius_km' => ['nullable', 'numeric', 'min:0.1'],
        ]);

        $query = Pharmacy::query()
            ->select('pharmacies.*')
            ->addSelect(ST::y('location')->as('latitude'))
            ->addSelect(ST::x('location')->as('longitude'))
            ->with('owner');

        if (isset($validated['latitude'], $validated['longitude'])) {
            $lat = (float) $validated['latitude'];
            $lng = (float) $validated['longitude'];
            $radius = (float) ($validated['radius_km'] ?? 10);
            $currentLocation = Point::makeGeodetic($lat, $lng);
            $distanceExpr = ST::distanceSphere($currentLocation, 'location');

            $query->addSelect($distanceExpr->as('distance_meters'))
                ->where($distanceExpr, '<=', $radius * 1000)
                ->orderBy($distanceExpr);
        }

        if ($request->filled('q')) {
            $search = '%'.$request->string('q').'%';
            $query->where('name', 'like', $search)
                ->orWhere('address', 'like', $search)
                ->orWhere('city', 'like', $search)
                ->orWhere('registre_commerce_number', 'like', $search);
        }

        if (! empty($validated['city'])) {
            $query->where('city', 'ilike', $validated['city']);
        }

        $paginator = $query->paginate((int) $request->input('per_page', 15));

        if (isset($validated['latitude'], $validated['longitude'])) {
            $paginator->getCollection()->transform(function ($pharmacy) {
                $distanceMeters = (float) ($pharmacy->distance_meters ?? 0);
                $pharmacy->distance_km = round($distanceMeters / 1000, 3);
                unset($pharmacy->distance_meters);

                return $pharmacy;
            });
        }

        return response()->json($paginator);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'owner_id' => ['nullable', 'integer', 'exists:users,id', 'unique:pharmacies,owner_id'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'registre_commerce_number' => ['required', 'string', 'max:255', 'unique:pharmacies,registre_commerce_number'],
            'time_open' => ['required', 'date_format:H:i:s'],
            'time_closes' => ['required', 'date_format:H:i:s'],
            'verified_at' => ['nullable', 'date'],
        ]);

        $user = $request->user();

        

        if ($this->isScopedPharmacyOwner($user) && ! $user->hasRole('admin')) {
            if (Pharmacy::query()->where('owner_id', $user->id)->exists()) {
                return response()->json([
                    'message' => 'Pharmacy profile already exists for this account.',
                ], 409);
            }

            $validated['owner_id'] = $request->user()->id;
        }
        $point = Point::makeGeodetic($validated['latitude'], $validated['longitude']);
        $pharmaacyBody = [
            'name' => $validated['name'],
            'address' => $validated['address'],
            'city' => $validated['city'] ?? null,
            'location' => $point,
            'registre_commerce_number' => $validated['registre_commerce_number'],
            'time_open' => $validated['time_open'],
            'time_closes' => $validated['time_closes'],
            'verified_at' => $validated['verified_at'] ?? null,
        ];

        $validated['owner_id'] ??= $request->user()->id;
        return response()->json(Pharmacy::create($validated)->load('owner'), 201);
    }

    public function show(Pharmacy $pharmacy)
    {
        $user = request()->user();

        if ($user && $this->isScopedPharmacyOwner($user) && ! $user->hasRole('admin') && $pharmacy->owner_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($pharmacy->load(['owner', 'inventories.medication']));
    }

    public function update(Request $request, Pharmacy $pharmacy)
    {
        if ($this->isScopedPharmacyOwner($request->user()) && ! $request->user()->hasRole('admin') && $pharmacy->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'owner_id' => ['sometimes', 'integer', 'exists:users,id', 'unique:pharmacies,owner_id,'.$pharmacy->id],
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:255'],
            'latitude' => ['sometimes', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'numeric', 'between:-180,180'],
            'registre_commerce_number' => ['sometimes', 'string', 'max:255', 'unique:pharmacies,registre_commerce_number,'.$pharmacy->id],
            'time_open' => ['sometimes', 'date_format:H:i:s'],
            'time_closes' => ['sometimes', 'date_format:H:i:s'],
            'verified_at' => ['nullable', 'date'],
        ]);

        if ($this->isScopedPharmacyOwner($request->user()) && ! $request->user()->hasRole('admin')) {
            unset($validated['owner_id']);
        }
        $pharmaacyBody= [
            'name' => $validated['name'] ?? $pharmacy->name,
            'address' => $validated['address'] ?? $pharmacy->address,
            'city' => $validated['city'] ?? $pharmacy->city,
            'location' => isset($validated['latitude'], $validated['longitude']) ? Point::makeGeodetic($validated['latitude'], $validated['longitude']) : $pharmacy->location,
            'registre_commerce_number' => $validated['registre_commerce_number'] ?? $pharmacy->registre_commerce_number,
            'time_open' => $validated['time_open'] ?? $pharmacy->time_open,
            'time_closes' => $validated['time_closes'] ?? $pharmacy->time_closes,
            'verified_at' => array_key_exists('verified_at', $validated) ? ($validated['verified_at'] ?? null) : $pharmacy->verified_at,
        ];

        $pharmacy->update($pharmaacyBody);

        return response()->json($pharmacy->fresh()->load('owner'));
    }

    public function destroy(Request $request, Pharmacy $pharmacy)
    {
        if ($this->isScopedPharmacyOwner($request->user()) && ! $request->user()->hasRole('admin') && $pharmacy->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $pharmacy->delete();

        return response()->json([], 204);
    }
}
