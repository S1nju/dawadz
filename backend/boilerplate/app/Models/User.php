<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $appends = [
        'avatar_url',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone_number',
        'password',
        'avatar_path',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar_path) {
            return null;
        }

        $path = ltrim($this->avatar_path, '/');

        if (request()) {
            return rtrim(request()->getSchemeAndHttpHost(), '/').'/api/files/'.$path;
        }

        return '/api/files/'.$path;
    }

    public function approvalRequests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
    }

    public function reviewedApprovalRequests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class, 'reviewed_by');
    }

    public function supplier(): HasOne
    {
        return $this->hasOne(Supplier::class);
    }

    public function pharmacy(): HasOne
    {
        return $this->hasOne(Pharmacy::class, 'owner_id');
    }

    public function medications(): HasMany
    {
        return $this->hasMany(Medication::class, 'created_by');
    }

    public function notificationsList(): HasMany
    {
        return $this->hasMany(UserNotification::class);
    }
}
