<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('approval_requests')) {
            Schema::create('approval_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->enum('type', ['pharmacy', 'supplier']);
                $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
                $table->json('documents')->nullable();
                $table->json('images')->nullable();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('suppliers')) {
            Schema::create('suppliers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
                $table->string('company_name');
                $table->string('address');
                $table->timestamp('verified_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('pharmacies')) {
            Schema::create('pharmacies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('owner_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('name');
                $table->string('address');
                $table->decimal('latitude', 10, 7);
                $table->decimal('longitude', 10, 7);
                $table->string('registre_commerce_number')->unique();
                $table->time('time_open');
                $table->time('time_closes');
                $table->timestamp('verified_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('user_notifications')) {
            Schema::create('user_notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('type');
                $table->text('message');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
                $table->foreignId('medication_id')->constrained()->cascadeOnDelete();
                $table->unsignedInteger('qte')->default(0);
                $table->decimal('prix_achat', 12, 2);
                $table->decimal('prix_vente', 12, 2);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('inventories')) {
            Schema::create('inventories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
                $table->foreignId('medication_id')->constrained()->cascadeOnDelete();
                $table->unsignedInteger('qte')->default(0);
                $table->decimal('prix_achat', 12, 2);
                $table->decimal('prix_vente', 12, 2);
                $table->timestamps();

                $table->unique(['pharmacy_id', 'medication_id']);
            });
        }

        if (!Schema::hasTable('supplier_posts')) {
            Schema::create('supplier_posts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('image')->nullable();
                $table->unsignedInteger('qte_vente')->default(1);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('commandes')) {
            Schema::create('commandes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
                $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
                $table->string('external_supplier_name')->nullable();
                $table->enum('status', ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'])->default('pending');
                $table->timestamp('ordered_at')->nullable();
                $table->timestamp('confirmed_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('commande_lines')) {
            Schema::create('commande_lines', function (Blueprint $table) {
                $table->id();
                $table->foreignId('commande_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
                $table->string('medication_name');
                $table->unsignedInteger('qte');
                $table->decimal('unit_price', 12, 2);
                $table->decimal('total', 12, 2);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('factures')) {
            Schema::create('factures', function (Blueprint $table) {
                $table->id();
                $table->foreignId('commande_id')->unique()->constrained()->cascadeOnDelete();
                $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
                $table->string('invoice_number')->unique();
                $table->enum('status', ['draft', 'issued', 'paid', 'cancelled'])->default('issued');
                $table->decimal('total_ht', 12, 2)->default(0);
                $table->decimal('total_ttc', 12, 2)->default(0);
                $table->timestamp('issued_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('facture_lines')) {
            Schema::create('facture_lines', function (Blueprint $table) {
                $table->id();
                $table->foreignId('facture_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
                $table->string('medication_name');
                $table->unsignedInteger('qte');
                $table->decimal('unit_price', 12, 2);
                $table->decimal('total', 12, 2);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facture_lines');
        Schema::dropIfExists('factures');
        Schema::dropIfExists('commande_lines');
        Schema::dropIfExists('commandes');
        Schema::dropIfExists('supplier_posts');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('products');
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('pharmacies');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('approval_requests');
    }
};
