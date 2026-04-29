<?php
namespace App\Events;

use App\Models\Inventory;
use Illuminate\Broadcasting\Channel;
Use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $inventory;

    public function __construct(Inventory $inventory)
    {
        // Load relationships so the frontend knows which pharmacy/medication changed
        $this->inventory = $inventory->load(['pharmacy', 'medication']);
    }

    public function broadcastOn(): array
    {
        // Public channel named 'inventory'
        return [
              new PrivateChannel('inventory'),        ];
    }

    public function broadcastAs(): string
    {
        return 'inventory.updated';
    }
}
