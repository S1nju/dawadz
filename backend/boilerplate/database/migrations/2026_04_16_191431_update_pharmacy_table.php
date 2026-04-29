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
        //
           Schema::table('pharmacies', function (Blueprint $table) {           
                $table->dropColumn('latitude');
                $table->dropColumn('longitude');
                $table->magellanPoint('location', 4326)->nullable();
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropColumn('location');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
        });
    }
};
