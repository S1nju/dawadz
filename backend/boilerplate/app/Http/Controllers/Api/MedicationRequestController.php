<?php

namespace App\Http\Controllers\Api;

use App\Events\MedicationRequested;
use App\Events\RequestAccepted;
use App\Events\RequestCanceled;
use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class MedicationRequestController extends Controller
{
    public function sendRequest(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'medication_name' => ['required', 'string'],
            'city' => ['required', 'string'],
            'attachment_image' => ['nullable', 'image', 'max:10240'],
        ]);

        $requestedCity = trim((string) $validated['city']);
        $normalizedRequestedCity = mb_strtolower($requestedCity);
        $attachmentImage = null;

        if ($request->hasFile('attachment_image')) {
            $attachmentPath = $request->file('attachment_image')->store('medication-requests', 'public');
            $attachmentImage = rtrim($request->getSchemeAndHttpHost(), '/') . '/api/files/' . ltrim($attachmentPath, '/');
        }

        $requestId = 'med_req_' . $user->id . '_' . uniqid();

        broadcast(new MedicationRequested(
            $user->name,
            $validated['medication_name'],
            $requestedCity,
            $requestId,
            $attachmentImage
        ));

        UserNotification::create([
            'user_id' => $user->id,
            'type' => 'medication_request_status',
            'message' => json_encode([
                'request_id' => $requestId,
                'status' => 'pending',
                'medication_name' => $validated['medication_name'],
                'city' => $requestedCity,
                'attachment_image' => $attachmentImage,
                'created_at' => now()->toDateTimeString(),
            ], JSON_UNESCAPED_UNICODE),
            'read_at' => null,
        ]);

        $pharmaciesInCity = Pharmacy::query()
            ->whereRaw('lower(trim(city)) = ?', [$normalizedRequestedCity])
            ->whereNotNull('owner_id')
            ->get();

        $pharmaciesInCity->each(function ($pharmacy) use ($requestId, $user, $validated, $requestedCity, $attachmentImage) {
            UserNotification::create([
                'user_id' => $pharmacy->owner_id,
                'type' => 'medication_request_incoming',
                'message' => json_encode([
                    'request_id' => $requestId,
                    'status' => 'pending',
                    'user_name' => $user->name,
                    'medication' => $validated['medication_name'],
                    'city' => $requestedCity,
                    'attachment_image' => $attachmentImage,
                    'created_at' => now()->toDateTimeString(),
                ], JSON_UNESCAPED_UNICODE),
                'read_at' => null,
            ]);
        });

        return response()->json([
            'message' => 'Request sent to all pharmacies in ' . $requestedCity,
            'request_id' => $requestId,
            'attachment_image' => $attachmentImage,
        ]);
    }

    public function acceptRequest(Request $request)
    {
        $requestId = (string) $request->input('request_id', '');
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $pharmacy = Pharmacy::where('owner_id', $user->id)->first();

        if (! $pharmacy) {
            return response()->json(['message' => 'Unauthorized: No pharmacy linked to this user.'], 403);
        }

        if ($requestId === '') {
            return response()->json(['message' => 'request_id is required.'], 422);
        }

        $incomingNotification = UserNotification::query()
            ->where('user_id', $user->id)
            ->where('type', 'medication_request_incoming')
            ->where('message', 'like', '%"request_id":"' . addslashes($requestId) . '"%')
            ->latest('id')
            ->first();

        $incomingPayload = null;
        if ($incomingNotification?->message) {
            $decoded = json_decode($incomingNotification->message, true);
            if (is_array($decoded)) {
                $incomingPayload = $decoded;
            }
        }

        $attachmentImage = $incomingPayload['attachment_image'] ?? null;

        broadcast(new RequestAccepted($requestId, $pharmacy, $attachmentImage));

        UserNotification::create([
            'user_id' => $user->id,
            'type' => 'medication_request_incoming',
            'message' => json_encode([
                'request_id' => $requestId,
                'status' => 'accepted',
                'user_name' => $incomingPayload['user_name'] ?? 'Unknown user',
                'medication' => $incomingPayload['medication'] ?? 'Unknown medication',
                'city' => $incomingPayload['city'] ?? $pharmacy->city,
                'attachment_image' => $attachmentImage,
                'pharmacy_name' => $pharmacy->name,
                'accepted_at' => now()->toDateTimeString(),
            ], JSON_UNESCAPED_UNICODE),
            'read_at' => now(),
        ]);

        if (preg_match('/^med_req_(\d+)_/', $requestId, $matches)) {
            $requesterId = (int) $matches[1];
            $requester = User::find($requesterId);

            if ($requester) {
                UserNotification::create([
                    'user_id' => $requester->id,
                    'type' => 'medication_request_status',
                    'message' => json_encode([
                        'request_id' => $requestId,
                        'status' => 'accepted',
                        'pharmacy_name' => $pharmacy->name,
                        'pharmacy' => [
                            'id' => $pharmacy->id,
                            'name' => $pharmacy->name,
                            'lat' => (float) $pharmacy->latitude,
                            'lng' => (float) $pharmacy->longitude,
                            'address' => $pharmacy->address,
                            'city' => $pharmacy->city,
                        ],
                        'attachment_image' => $attachmentImage,
                        'accepted_at' => now()->toDateTimeString(),
                    ], JSON_UNESCAPED_UNICODE),
                    'read_at' => null,
                ]);
            }
        }

        return response()->json([
            'message' => 'Acceptance broadcasted successfully!',
            'pharmacy_name' => $pharmacy->name,
        ]);
    }

    public function cancelRequest(Request $request)
    {
        $user = $request->user();
        $requestId = (string) $request->input('request_id', '');

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($requestId === '') {
            return response()->json(['message' => 'request_id is required.'], 422);
        }

        if (! preg_match('/^med_req_(\d+)_/', $requestId, $matches)) {
            return response()->json(['message' => 'Invalid request_id format.'], 422);
        }

        $requesterId = (int) $matches[1];
        if ((int) $user->id !== $requesterId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $statusNotifications = UserNotification::query()
            ->where('user_id', $user->id)
            ->where('type', 'medication_request_status')
            ->where('message', 'like', '%"request_id":"' . addslashes($requestId) . '"%')
            ->latest('id')
            ->get();

        $latestPayload = null;
        foreach ($statusNotifications as $notification) {
            $decoded = json_decode((string) $notification->message, true);
            if (is_array($decoded) && ($decoded['request_id'] ?? null) === $requestId) {
                $latestPayload = $decoded;
                break;
            }
        }

        if (! $latestPayload || ($latestPayload['status'] ?? null) !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be canceled.'], 409);
        }

        UserNotification::create([
            'user_id' => $user->id,
            'type' => 'medication_request_status',
            'message' => json_encode([
                'request_id' => $requestId,
                'status' => 'canceled',
                'medication_name' => $latestPayload['medication_name'] ?? 'Medication',
                'city' => $latestPayload['city'] ?? '',
                'attachment_image' => $latestPayload['attachment_image'] ?? null,
                'canceled_at' => now()->toDateTimeString(),
            ], JSON_UNESCAPED_UNICODE),
            'read_at' => now(),
        ]);

        $cancelCity = trim((string) ($latestPayload['city'] ?? ''));

        Pharmacy::query()
            ->whereRaw('lower(trim(city)) = ?', [mb_strtolower($cancelCity)])
            ->whereNotNull('owner_id')
            ->get()
            ->each(function ($pharmacy) use ($requestId, $latestPayload, $user) {
                UserNotification::create([
                    'user_id' => $pharmacy->owner_id,
                    'type' => 'medication_request_incoming',
                    'message' => json_encode([
                        'request_id' => $requestId,
                        'status' => 'canceled',
                        'user_name' => $user->name,
                        'medication' => $latestPayload['medication_name'] ?? 'Medication',
                        'city' => $latestPayload['city'] ?? '',
                        'attachment_image' => $latestPayload['attachment_image'] ?? null,
                        'canceled_at' => now()->toDateTimeString(),
                    ], JSON_UNESCAPED_UNICODE),
                    'read_at' => now(),
                ]);
            });

        broadcast(new RequestCanceled([
            'request_id' => $requestId,
            'status' => 'canceled',
            'user_name' => $user->name,
            'medication' => $latestPayload['medication_name'] ?? 'Medication',
            'city' => $latestPayload['city'] ?? '',
            'attachment_image' => $latestPayload['attachment_image'] ?? null,
            'canceled_at' => now()->toDateTimeString(),
        ]));

        return response()->json([
            'message' => 'Request canceled successfully.',
            'request_id' => $requestId,
        ]);
    }
}
