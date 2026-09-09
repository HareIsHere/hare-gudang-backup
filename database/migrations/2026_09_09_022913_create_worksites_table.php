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
        Schema::create('worksites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('worksite_category_id')->nullable()->constrained('worksite_categories')->nullOnDelete();
            $table->string('group');
            $table->string('name');
            $table->text('address')->nullable();
            $table->text('description')->nullable();
            $table->string('stage')->default('Revision');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worksites');
    }
};
