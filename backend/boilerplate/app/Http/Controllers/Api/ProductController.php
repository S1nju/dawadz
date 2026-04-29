<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()->with(['supplier.user', 'medication']);

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $supplier = $request->user()->supplier;
            $query->where('supplier_id', $supplier?->id ?? 0);
        }

        if ($request->filled('medication_id')) {
            $query->where('medication_id', (int) $request->input('medication_id'));
        }

        return response()->json($query->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'medication_id' => ['required', 'integer', 'exists:medications,id'],
            'qte' => ['required', 'integer', 'min:0'],
            'prix_achat' => ['required', 'numeric', 'min:0'],
            'prix_vente' => ['required', 'numeric', 'min:0'],
        ]);

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $supplier = $request->user()->supplier;
            if (! $supplier) {
                return response()->json(['message' => 'Supplier profile is required.'], 422);
            }
            $validated['supplier_id'] = $supplier->id;
        }

        return response()->json(Product::create($validated)->load(['supplier', 'medication']), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['supplier.user', 'medication']));
    }

    public function update(Request $request, Product $product)
    {
        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;
            if ($product->supplier_id !== $supplierId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'supplier_id' => ['sometimes', 'integer', 'exists:suppliers,id'],
            'medication_id' => ['sometimes', 'integer', 'exists:medications,id'],
            'qte' => ['sometimes', 'integer', 'min:0'],
            'prix_achat' => ['sometimes', 'numeric', 'min:0'],
            'prix_vente' => ['sometimes', 'numeric', 'min:0'],
        ]);

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            unset($validated['supplier_id']);
        }

        $product->update($validated);

        return response()->json($product->fresh()->load(['supplier', 'medication']));
    }

    public function destroy(Request $request, Product $product)
    {
        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;
            if ($product->supplier_id !== $supplierId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $product->delete();

        return response()->json([], 204);
    }
}
