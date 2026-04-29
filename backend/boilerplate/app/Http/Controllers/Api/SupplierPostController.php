<?php

namespace App\Http\Controllers\Api;

use App\Models\SupplierPost;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SupplierPostController extends Controller
{
    public function index(Request $request)
    {
        $query = SupplierPost::query()->with(['supplier.user', 'product.medication']);

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;

            $query->where('supplier_id', $supplierId ?? 0);
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', (int) $request->input('supplier_id'));
        }

        if ($request->filled('search')) {
            $search = '%'.$request->string('search').'%';
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', $search)
                    ->orWhere('description', 'like', $search)
                    ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                        $supplierQuery->where('company_name', 'like', $search)
                            ->orWhere('address', 'like', $search);
                    })
                    ->orWhereHas('product.medication', function ($medicationQuery) use ($search) {
                        $medicationQuery->where('name', 'like', $search)
                            ->orWhere('commercial_name', 'like', $search);
                    });
            });
        }

        if ($request->filled('company_name')) {
            $companyName = '%'.$request->string('company_name').'%';
            $query->whereHas('supplier', function ($supplierQuery) use ($companyName) {
                $supplierQuery->where('company_name', 'like', $companyName);
            });
        }

        if ($request->filled('city')) {
            $city = '%'.$request->string('city').'%';
            $query->whereHas('supplier', function ($supplierQuery) use ($city) {
                $supplierQuery->where('address', 'like', $city);
            });
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', (int) $request->input('product_id'));
        }

        return response()->json($query->latest()->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
            'qte_vente' => ['required', 'integer', 'min:1'],
        ]);

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $supplier = $request->user()->supplier;
            if (! $supplier) {
                return response()->json(['message' => 'Supplier profile is required.'], 422);
            }
            $validated['supplier_id'] = $supplier->id;
        }

        return response()->json(SupplierPost::create($validated)->load(['supplier', 'product']), 201);
    }

    public function show(SupplierPost $supplierPost)
    {
        $user = request()->user();

        if ($user->hasRole('supplier_admin') && ! $user->hasRole('admin')) {
            $supplierId = $user->supplier?->id;

            if (! $supplierId || $supplierPost->supplier_id !== $supplierId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return response()->json($supplierPost->load(['supplier.user', 'product.medication']));
    }

    public function update(Request $request, SupplierPost $supplierPost)
    {
        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;
            if ($supplierPost->supplier_id !== $supplierId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'supplier_id' => ['sometimes', 'integer', 'exists:suppliers,id'],
            'product_id' => ['sometimes', 'integer', 'exists:products,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
            'qte_vente' => ['sometimes', 'integer', 'min:1'],
        ]);

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            unset($validated['supplier_id']);
        }

        $supplierPost->update($validated);

        return response()->json($supplierPost->fresh()->load(['supplier', 'product']));
    }

    public function destroy(Request $request, SupplierPost $supplierPost)
    {
        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $supplierId = $request->user()->supplier?->id;
            if ($supplierPost->supplier_id !== $supplierId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $supplierPost->delete();

        return response()->json([], 204);
    }
}
