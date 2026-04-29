<?php

namespace App\Http\Controllers\Api;

use App\Models\UserNotification;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserNotificationController extends Controller
{
    public function markAsRead(Request $request, UserNotification $notification)
    {
        if (! $request->user()->hasRole('admin') && $notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json($notification);
    }

    public function index(Request $request)
    {
        $query = UserNotification::query();

        
        $query->where('user_id', $request->user()->id);
    

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('read')) {
            if ($request->boolean('read')) {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        return response()->json($query->latest()->paginate((int) $request->input('per_page', 15)));
    }

    public function show(Request $request, UserNotification $notification)
    {
        if (! $request->user()->hasRole('admin') && $notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($notification);
    }

    public function destroy(Request $request, UserNotification $notification)
    {
        if (! $request->user()->hasRole('admin') && $notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $notification->delete();

        return response()->json([], 204);
    }
}
