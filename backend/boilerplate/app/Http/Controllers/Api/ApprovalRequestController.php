<?php

namespace App\Http\Controllers\Api;

use App\Models\ApprovalRequest;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class ApprovalRequestController extends Controller
{
    private function storeUploadedFiles(Request $request, string $field, string $directory): array
    {
        if (! $request->hasFile($field)) {
            return [];
        }

        $stored = [];
        foreach ((array) $request->file($field) as $file) {
            if ($file) {
                $stored[] = $file->store($directory, 'public');
            }
        }

        return $stored;
    }

    public function updateStatus(Request $request, ApprovalRequest $approvalRequest)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:accepted,rejected,pending'],
            'review_notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $approvalRequest, $validated) {
            $approvalRequest->update([
                'status' => $validated['status'],
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            if ($validated['status'] !== 'accepted') {
                return;
            }

            $user = $approvalRequest->user;

            if ($approvalRequest->type === 'supplier') {
                Role::findOrCreate('supplier_admin');
                $user->syncRoles(['supplier_admin']);
            }

            if ($approvalRequest->type === 'pharmacy') {
                Role::findOrCreate('pharmacy_admin');
                $user->syncRoles(['pharmacy_admin']);
            }
        });

        return response()->json($approvalRequest->fresh()->load(['user', 'reviewer']));
    }

    public function index(Request $request)
    {
        $query = ApprovalRequest::query()->with(['user', 'reviewer']);

        if (! $request->user()->hasRole('admin')) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        return response()->json($query->latest()->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:pharmacy,supplier'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'mimes:pdf,doc,docx', 'max:10240'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $documents = $this->storeUploadedFiles($request, 'documents', 'approval-requests/documents');
        $images = $this->storeUploadedFiles($request, 'images', 'approval-requests/images');

        $approvalRequest = ApprovalRequest::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'status' => 'pending',
            'documents' => $documents ?: null,
            'images' => $images ?: null,
        ]);

        return response()->json($approvalRequest->load('user'), 201);
    }

    public function show(Request $request, ApprovalRequest $approvalRequest)
    {
        if (! $request->user()->hasRole('admin') && $approvalRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($approvalRequest->load(['user', 'reviewer']));
    }

    public function update(Request $request, ApprovalRequest $approvalRequest)
    {
        if ($approvalRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be updated.'], 422);
        }

        if (! $request->user()->hasRole('admin') && $approvalRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'mimes:pdf,doc,docx', 'max:10240'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $documents = $approvalRequest->documents ?? [];
        $images = $approvalRequest->images ?? [];

        if ($request->hasFile('documents')) {
            Storage::disk('public')->delete($documents);
            $documents = $this->storeUploadedFiles($request, 'documents', 'approval-requests/documents');
        }

        if ($request->hasFile('images')) {
            Storage::disk('public')->delete($images);
            $images = $this->storeUploadedFiles($request, 'images', 'approval-requests/images');
        }

        $approvalRequest->update([
            'documents' => $documents ?: null,
            'images' => $images ?: null,
        ]);

        return response()->json($approvalRequest->fresh()->load(['user', 'reviewer']));
    }

    public function destroy(ApprovalRequest $approvalRequest)
    {
        Storage::disk('public')->delete($approvalRequest->documents ?? []);
        Storage::disk('public')->delete($approvalRequest->images ?? []);

        $approvalRequest->delete();

        return response()->json([], 204);
    }
}
