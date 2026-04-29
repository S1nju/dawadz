<?php

namespace App\Http\Controllers\Api;

use App\Models\Supplier;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query()->with('user');

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json($query->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id', 'unique:suppliers,user_id'],
            'company_name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'verified_at' => ['nullable', 'date'],
        ]);

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            $validated['user_id'] = $request->user()->id;
        }

        $validated['user_id'] ??= $request->user()->id;

        return response()->json(Supplier::create($validated)->load('user'), 201);
    }

    public function show(Request $request, Supplier $supplier)
    {
        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin') && $supplier->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($supplier->load('user'));
    }

    public function update(Request $request, Supplier $supplier)
    {
        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin') && $supplier->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => ['sometimes', 'integer', 'exists:users,id', 'unique:suppliers,user_id,'.$supplier->id],
            'company_name' => ['sometimes', 'string', 'max:255'],
            'address' => ['sometimes', 'string', 'max:255'],
            'verified_at' => ['nullable', 'date'],
        ]);

        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin')) {
            unset($validated['user_id']);
        }

        $supplier->update($validated);

        return response()->json($supplier->fresh()->load('user'));
    }

    public function destroy(Request $request, Supplier $supplier)
    {
        if ($request->user()->hasRole('supplier_admin') && ! $request->user()->hasRole('admin') && $supplier->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $supplier->delete();

        return response()->json([], 204);
    }
}
