<?php

namespace App\Http\Controllers\Api;

use App\Models\Facture;
use App\Models\FactureLine;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FactureController extends Controller
{
    public function index(Request $request)
    {
        $query = Facture::query()->with(['commande', 'supplier', 'pharmacy', 'lines']);

        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            $query->where('pharmacy_id', $pharmacyId ?? 0);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->latest()->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'commande_id' => ['required', 'integer', 'exists:commandes,id', 'unique:factures,commande_id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'pharmacy_id' => ['nullable', 'integer', 'exists:pharmacies,id'],
            'invoice_number' => ['nullable', 'string', 'max:255', 'unique:factures,invoice_number'],
            'status' => ['nullable', 'in:draft,issued,paid,cancelled'],
            'issued_at' => ['nullable', 'date'],
            'total_ht' => ['nullable', 'numeric', 'min:0'],
            'total_ttc' => ['nullable', 'numeric', 'min:0'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'lines.*.medication_name' => ['required', 'string', 'max:255'],
            'lines.*.qte' => ['required', 'integer', 'min:1'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.total' => ['nullable', 'numeric', 'min:0'],
        ]);

        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacy = $request->user()->pharmacy;
            if (! $pharmacy) {
                return response()->json(['message' => 'Pharmacy profile is required.'], 422);
            }
            $validated['pharmacy_id'] = $pharmacy->id;
        }

        $facture = DB::transaction(function () use ($validated) {
            $computedTotal = 0;
            foreach ($validated['lines'] as $line) {
                $computedTotal += ($line['total'] ?? ($line['qte'] * $line['unit_price']));
            }

            $facture = Facture::create([
                'commande_id' => $validated['commande_id'],
                'supplier_id' => $validated['supplier_id'] ?? null,
                'pharmacy_id' => $validated['pharmacy_id'],
                'invoice_number' => $validated['invoice_number'] ?? ('FAC-'.Str::upper(Str::random(10))),
                'status' => $validated['status'] ?? 'issued',
                'issued_at' => $validated['issued_at'] ?? now(),
                'total_ht' => $validated['total_ht'] ?? $computedTotal,
                'total_ttc' => $validated['total_ttc'] ?? $computedTotal,
            ]);

            foreach ($validated['lines'] as $line) {
                FactureLine::create([
                    'facture_id' => $facture->id,
                    'product_id' => $line['product_id'] ?? null,
                    'medication_name' => $line['medication_name'],
                    'qte' => $line['qte'],
                    'unit_price' => $line['unit_price'],
                    'total' => $line['total'] ?? ($line['qte'] * $line['unit_price']),
                ]);
            }

            return $facture;
        });

        return response()->json($facture->load(['commande', 'supplier', 'pharmacy', 'lines']), 201);
    }

    public function show(Request $request, Facture $facture)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($facture->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return response()->json($facture->load(['commande', 'supplier', 'pharmacy', 'lines']));
    }

    public function update(Request $request, Facture $facture)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($facture->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'status' => ['sometimes', 'in:draft,issued,paid,cancelled'],
            'issued_at' => ['nullable', 'date'],
            'total_ht' => ['nullable', 'numeric', 'min:0'],
            'total_ttc' => ['nullable', 'numeric', 'min:0'],
            'lines' => ['nullable', 'array', 'min:1'],
            'lines.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'lines.*.medication_name' => ['required_with:lines', 'string', 'max:255'],
            'lines.*.qte' => ['required_with:lines', 'integer', 'min:1'],
            'lines.*.unit_price' => ['required_with:lines', 'numeric', 'min:0'],
            'lines.*.total' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($facture, $validated) {
            $facture->update([
                'supplier_id' => array_key_exists('supplier_id', $validated) ? $validated['supplier_id'] : $facture->supplier_id,
                'status' => $validated['status'] ?? $facture->status,
                'issued_at' => array_key_exists('issued_at', $validated) ? $validated['issued_at'] : $facture->issued_at,
                'total_ht' => $validated['total_ht'] ?? $facture->total_ht,
                'total_ttc' => $validated['total_ttc'] ?? $facture->total_ttc,
            ]);

            if (! empty($validated['lines'])) {
                $facture->lines()->delete();

                $computedTotal = 0;
                foreach ($validated['lines'] as $line) {
                    $lineTotal = $line['total'] ?? ($line['qte'] * $line['unit_price']);
                    $computedTotal += $lineTotal;

                    FactureLine::create([
                        'facture_id' => $facture->id,
                        'product_id' => $line['product_id'] ?? null,
                        'medication_name' => $line['medication_name'],
                        'qte' => $line['qte'],
                        'unit_price' => $line['unit_price'],
                        'total' => $lineTotal,
                    ]);
                }

                if (! array_key_exists('total_ht', $validated) && ! array_key_exists('total_ttc', $validated)) {
                    $facture->update([
                        'total_ht' => $computedTotal,
                        'total_ttc' => $computedTotal,
                    ]);
                }
            }
        });

        return response()->json($facture->fresh()->load(['commande', 'supplier', 'pharmacy', 'lines']));
    }

    public function destroy(Request $request, Facture $facture)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($facture->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $facture->delete();

        return response()->json([], 204);
    }
}
