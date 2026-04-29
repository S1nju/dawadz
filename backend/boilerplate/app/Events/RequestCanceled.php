<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestCanceled implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $payload;

    public function __construct(array $payload)
    {
        $this->payload = $payload;
    }

    public function broadcastOn(): array
    {
        $city = (string) ($this->payload['city'] ?? '');
        $slugifiedCity = strtolower(str_replace(' ', '-', $city));

        return [new Channel('pharmacy-requests.' . $slugifiedCity)];
    }

    public function broadcastAs(): string
    {
        return 'request.canceled';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
