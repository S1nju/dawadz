<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with(['roles', 'supplier', 'pharmacy']);

        if ($request->filled('q')) {
            $search = '%'.$request->string('q').'%';

            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('phone_number', 'like', $search);
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', function ($builder) use ($request) {
                $builder->where('name', $request->string('role'));
            });
        }

        if ($request->filled('roles')) {
            $roles = array_filter((array) $request->input('roles'));

            if ($roles !== []) {
                $query->whereHas('roles', function ($builder) use ($roles) {
                    $builder->whereIn('name', $roles);
                });
            }
        }

        return response()->json($query->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['nullable', 'string', Rule::exists('roles', 'name')],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'name')],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        $roles = $validated['roles'] ?? (isset($validated['role']) ? [$validated['role']] : ['user']);
        $user->syncRoles($roles);

        return response()->json($user->load(['roles', 'supplier', 'pharmacy']), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load(['roles', 'supplier', 'pharmacy']));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'nullable', 'string', Rule::exists('roles', 'name')],
            'roles' => ['sometimes', 'nullable', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'name')],
        ]);

        $payload = collect($validated)
            ->only(['name', 'email', 'phone_number'])
            ->all();

        if (array_key_exists('password', $validated) && $validated['password'] !== null) {
            $payload['password'] = Hash::make($validated['password']);
        }

        if ($payload !== []) {
            $user->update($payload);
        }

        if (array_key_exists('roles', $validated) || array_key_exists('role', $validated)) {
            $roles = $validated['roles'] ?? (isset($validated['role']) ? [$validated['role']] : []);

            if ($roles !== []) {
                $user->syncRoles($roles);
            }
        }

        return response()->json($user->fresh()->load(['roles', 'supplier', 'pharmacy']));
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([], 204);
    }
}
