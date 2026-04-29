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
        Schema::table('laboratories', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('country')->constrained('users')->nullOnDelete();
            $table->dropUnique('laboratories_name_unique');
            $table->unique(['created_by', 'name'], 'laboratories_created_by_name_unique');
        });

        Schema::table('therapeutic_classes', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('description')->constrained('users')->nullOnDelete();
            $table->dropUnique('therapeutic_classes_name_unique');
            $table->unique(['created_by', 'name'], 'therapeutic_classes_created_by_name_unique');
        });

        Schema::table('pharmacological_classes', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('description')->constrained('users')->nullOnDelete();
            $table->dropUnique('pharmacological_classes_name_unique');
            $table->unique(['created_by', 'name'], 'pharmacological_classes_created_by_name_unique');
        });

        Schema::table('active_ingredients', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('dci_code')->constrained('users')->nullOnDelete();
            $table->dropUnique('active_ingredients_dci_unique');
            $table->dropUnique('active_ingredients_dci_code_unique');
            $table->unique(['created_by', 'dci'], 'active_ingredients_created_by_dci_unique');
            $table->unique(['created_by', 'dci_code'], 'active_ingredients_created_by_dci_code_unique');
        });

        Schema::table('pharmaceutical_forms', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('name')->constrained('users')->nullOnDelete();
            $table->dropUnique('pharmaceutical_forms_name_unique');
            $table->unique(['created_by', 'name'], 'pharmaceutical_forms_created_by_name_unique');
        });

        Schema::table('countries', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('code')->constrained('users')->nullOnDelete();
            $table->dropUnique('countries_name_unique');
            $table->dropUnique('countries_code_unique');
            $table->unique(['created_by', 'name'], 'countries_created_by_name_unique');
            $table->unique(['created_by', 'code'], 'countries_created_by_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->dropUnique('countries_created_by_name_unique');
            $table->dropUnique('countries_created_by_code_unique');
            $table->dropConstrainedForeignId('created_by');
            $table->unique('name');
            $table->unique('code');
        });

        Schema::table('pharmaceutical_forms', function (Blueprint $table) {
            $table->dropUnique('pharmaceutical_forms_created_by_name_unique');
            $table->dropConstrainedForeignId('created_by');
            $table->unique('name');
        });

        Schema::table('active_ingredients', function (Blueprint $table) {
            $table->dropUnique('active_ingredients_created_by_dci_unique');
            $table->dropUnique('active_ingredients_created_by_dci_code_unique');
            $table->dropConstrainedForeignId('created_by');
            $table->unique('dci');
            $table->unique('dci_code');
        });

        Schema::table('pharmacological_classes', function (Blueprint $table) {
            $table->dropUnique('pharmacological_classes_created_by_name_unique');
            $table->dropConstrainedForeignId('created_by');
            $table->unique('name');
        });

        Schema::table('therapeutic_classes', function (Blueprint $table) {
            $table->dropUnique('therapeutic_classes_created_by_name_unique');
            $table->dropConstrainedForeignId('created_by');
            $table->unique('name');
        });

        Schema::table('laboratories', function (Blueprint $table) {
            $table->dropUnique('laboratories_created_by_name_unique');
            $table->dropConstrainedForeignId('created_by');
            $table->unique('name');
        });
    }
};
