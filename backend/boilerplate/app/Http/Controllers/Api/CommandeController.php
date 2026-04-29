<?php

namespace App\Http\Controllers\Api;

use App\Models\Commande;
use App\Models\CommandeLine;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommandeController extends Controller
{
    private function isSupplierActor(Request $request): bool
    {
        return $request->user()->hasAnyRole(['supplier_admin', 'supplier']);
    }

    public function confirm(Request $request, Commande $commande)
    {
        if ($this->isSupplierActor($request) && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;
            if ($commande->supplier_id !== $supplierId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $commande->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        return response()->json($commande->fresh()->load(['pharmacy', 'supplier', 'lines']));
    }

    public function refuse(Request $request, Commande $commande)
    {
        if ($this->isSupplierActor($request) && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;
            if ($commande->supplier_id !== $supplierId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        if ($commande->status !== 'pending') {
            return response()->json(['message' => 'Only pending commandes can be refused.'], 422);
        }

        $commande->update([
            'status' => 'cancelled',
        ]);

        return response()->json($commande->fresh()->load(['pharmacy', 'supplier', 'lines']));
    }

    public function index(Request $request)
    {
        $query = Commande::query()->with(['pharmacy', 'supplier', 'lines']);

        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            $query->where('pharmacy_id', $pharmacyId ?? 0);
        }

        if ($this->isSupplierActor($request) && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;
            $query->where('supplier_id', $supplierId ?? 0);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->latest()->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pharmacy_id' => ['nullable', 'integer', 'exists:pharmacies,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'external_supplier_name' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:pending,confirmed,processing,delivered,cancelled'],
            'ordered_at' => ['nullable', 'date'],
            'confirmed_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'lines.*.medication_name' => ['required', 'string', 'max:255'],
            'lines.*.qte' => ['required', 'integer', 'min:1'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.total' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (empty($validated['supplier_id']) && empty($validated['external_supplier_name'])) {
            return response()->json(['message' => 'supplier_id or external_supplier_name is required.'], 422);
        }

        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacy = $request->user()->pharmacy;
            if (! $pharmacy) {
                return response()->json(['message' => 'Pharmacy profile is required.'], 422);
            }
            $validated['pharmacy_id'] = $pharmacy->id;
        }

        $commande = DB::transaction(function () use ($validated) {
            $commande = Commande::create([
                'pharmacy_id' => $validated['pharmacy_id'],
                'supplier_id' => $validated['supplier_id'] ?? null,
                'external_supplier_name' => $validated['external_supplier_name'] ?? null,
                'status' => $validated['status'] ?? 'pending',
                'ordered_at' => $validated['ordered_at'] ?? now(),
                'confirmed_at' => $validated['confirmed_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['lines'] as $line) {
                CommandeLine::create([
                    'commande_id' => $commande->id,
                    'product_id' => $line['product_id'] ?? null,
                    'medication_name' => $line['medication_name'],
                    'qte' => $line['qte'],
                    'unit_price' => $line['unit_price'],
                    'total' => $line['total'] ?? ($line['qte'] * $line['unit_price']),
                ]);
            }

            return $commande;
        });

        return response()->json($commande->load(['pharmacy', 'supplier', 'lines']), 201);
    }

    public function show(Request $request, Commande $commande)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($commande->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        if ($this->isSupplierActor($request) && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;
            if ($commande->supplier_id !== $supplierId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return response()->json($commande->load(['pharmacy', 'supplier', 'lines']));
    }

    public function update(Request $request, Commande $commande)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($commande->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'external_supplier_name' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:pending,confirmed,processing,delivered,cancelled'],
            'ordered_at' => ['nullable', 'date'],
            'confirmed_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'lines' => ['nullable', 'array', 'min:1'],
            'lines.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'lines.*.medication_name' => ['required_with:lines', 'string', 'max:255'],
            'lines.*.qte' => ['required_with:lines', 'integer', 'min:1'],
            'lines.*.unit_price' => ['required_with:lines', 'numeric', 'min:0'],
            'lines.*.total' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($commande, $validated) {
            $commande->update([
                'supplier_id' => $validated['supplier_id'] ?? $commande->supplier_id,
                'external_supplier_name' => array_key_exists('external_supplier_name', $validated)
                    ? $validated['external_supplier_name']
                    : $commande->external_supplier_name,
                'status' => $validated['status'] ?? $commande->status,
                'ordered_at' => $validated['ordered_at'] ?? $commande->ordered_at,
                'confirmed_at' => array_key_exists('confirmed_at', $validated)
                    ? $validated['confirmed_at']
                    : $commande->confirmed_at,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $commande->notes,
            ]);

            if (! empty($validated['lines'])) {
                $commande->lines()->delete();

                foreach ($validated['lines'] as $line) {
                    CommandeLine::create([
                        'commande_id' => $commande->id,
                        'product_id' => $line['product_id'] ?? null,
                        'medication_name' => $line['medication_name'],
                        'qte' => $line['qte'],
                        'unit_price' => $line['unit_price'],
                        'total' => $line['total'] ?? ($line['qte'] * $line['unit_price']),
                    ]);
                }
            }
        });

        return response()->json($commande->fresh()->load(['pharmacy', 'supplier', 'lines']));
    }

    public function destroy(Request $request, Commande $commande)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($commande->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $commande->delete();

        return response()->json([], 204);
    }
}
