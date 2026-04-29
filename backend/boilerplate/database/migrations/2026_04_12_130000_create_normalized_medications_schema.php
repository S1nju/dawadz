<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates 3NF-compliant medication schema with lookup tables.
     */
    public function up(): void
    {
        // Lookup tables for medication attributes (eliminates repeating groups)
        Schema::create('laboratories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('country')->nullable();
            $table->timestamps();
        });

        Schema::create('therapeutic_classes', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('pharmacological_classes', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('active_ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('dci')->unique(); // Dénomination Commune Internationale
            $table->string('dci_code')->unique();
            $table->timestamps();
        });

        Schema::create('pharmaceutical_forms', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // tablet, capsule, syrup, injection, etc.
            $table->timestamps();
        });

        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code', 3)->unique(); // ISO 3166-1 alpha-3
            $table->timestamps();
        });

        // Normalized medications table
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Commercial name or generic name
            $table->string('commercial_name')->nullable();
            $table->foreignId('laboratory_id')->constrained()->cascadeOnDelete();
            $table->foreignId('therapeutic_class_id')->nullable()->constrained('therapeutic_classes')->nullOnDelete();
            $table->foreignId('pharmacological_class_id')->nullable()->constrained('pharmacological_classes')->nullOnDelete();
            $table->foreignId('pharmaceutical_form_id')->constrained('pharmaceutical_forms')->cascadeOnDelete();
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            
            // Atomic attributes
            $table->string('dosage')->nullable(); // e.g., "500mg", "2%"
            $table->string('conditioning')->nullable(); // e.g., "Blister of 10", "Bottle 100ml"
            $table->enum('type', ['generic', 'brand', 'biosimilar', 'herbal'])->default('generic');
            $table->enum('list', ['list_i', 'list_ii', 'list_iii', 'free'])->default('free'); // Pharmacy list classification
            
            // Price and reimbursement info
            $table->decimal('reference_price', 12, 2)->nullable();
            $table->decimal('ppa_indicative', 12, 2)->nullable(); // Indicative purchase price
            $table->boolean('marketed')->default(true);
            $table->boolean('reimbursable')->default(false);
            
            // Administrative fields
            $table->string('registration_num')->nullable()->unique();
            $table->string('notice_link')->nullable();
            $table->string('img_link')->nullable();
            
            // Audit trail
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            // Indexes for faster queries
            $table->index('name');
            $table->index('commercial_name');
            $table->index('laboratory_id');
            $table->index('therapeutic_class_id');
        });

        // Junction table for many-to-many: medications can have multiple active ingredients
        // (e.g., combination drugs)
        Schema::create('medication_active_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medication_id')->constrained()->cascadeOnDelete();
            $table->foreignId('active_ingredient_id')->constrained('active_ingredients')->cascadeOnDelete();
            $table->string('strength')->nullable(); // Dosage strength of this specific ingredient
            $table->timestamps();
            
            $table->unique(['medication_id', 'active_ingredient_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medication_active_ingredients');
        Schema::dropIfExists('medications');
        Schema::dropIfExists('countries');
        Schema::dropIfExists('pharmaceutical_forms');
        Schema::dropIfExists('active_ingredients');
        Schema::dropIfExists('pharmacological_classes');
        Schema::dropIfExists('therapeutic_classes');
        Schema::dropIfExists('laboratories');
    }
};
