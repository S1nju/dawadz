<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MedicationRequested implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $requestData;

    public function __construct($userName, $medicationName, $city, $requestId, $attachmentImage = null)
    {
        $normalizedCity = trim((string) $city);

        $this->requestData = [
            'request_id' => $requestId,
            'user_name'  => $userName,
            'medication' => $medicationName,
            'city'       => $normalizedCity,
            'attachment_image' => $attachmentImage,
            'created_at' => now()->toDateTimeString(),
        ];
    }

    private function slugifyCity(string $city): string
    {
        $city = mb_strtolower(trim($city));
        $city = preg_replace('/\s+/', '-', $city) ?? $city;

        return trim($city, '-');
    }

    public function broadcastOn(): array
    {
        // Public channel: anyone can listen, no auth needed
        $slugifiedCity = $this->slugifyCity((string) $this->requestData['city']);
        \Log::info('[MedicationRequested] Broadcasting on channel', [
            'city' => $this->requestData['city'],
            'slugifiedCity' => $slugifiedCity,
            'channel' => 'pharmacy-requests.' . $slugifiedCity,
            'requestId' => $this->requestData['request_id'],
        ]);
        return [new Channel('pharmacy-requests.' . $slugifiedCity)];
    }

    public function broadcastAs(): string
    {
        return 'medication.requested';
    }

    public function broadcastWith(): array
    {
        return $this->requestData;
    }
}
