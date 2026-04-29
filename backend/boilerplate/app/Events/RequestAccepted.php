<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestAccepted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $requestId;
    public $pharmacy;
    public $attachmentImage;

    public function __construct($requestId, $pharmacy, $attachmentImage = null)
    {
        $this->requestId = $requestId;
        $this->pharmacy = $pharmacy;
        $this->attachmentImage = $attachmentImage;

        \Log::info('[RequestAccepted] Event created', [
            'requestId' => $requestId,
            'pharmacyId' => $pharmacy->id,
            'pharmacyName' => $pharmacy->name,
        ]);
    }

    public function broadcastOn(): array
    {
        // Public channel based on the unique request ID
        $channelName = 'user-notifications.' . $this->requestId;
        \Log::info('[RequestAccepted] Broadcasting on channel', [
            'channel' => $channelName,
            'requestId' => $this->requestId,
        ]);
        return [new Channel($channelName)];
    }

    public function broadcastAs(): string
    {
        return 'request.accepted';
    }

    public function broadcastWith(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'pharmacy_name' => $this->pharmacy->name,
            'pharmacy' => $this->pharmacy,
            'attachment_image' => $this->attachmentImage,
            'accepted_at' => now()->toDateTimeString(),
        ];
    }
}

