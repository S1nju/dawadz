<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\{ActiveIngredient, Country, Inventory, Laboratory, Medication, PharmaceuticalForm, PharmacologicalClass, Pharmacy, Product, Supplier, SupplierPost, TherapeuticClass, User};


class MedicationCsvSeeder extends Seeder
{
    /**
     * Import medications from CSV and distribute stock across pharmacies/suppliers.
     */
    public function run(): void
    {
        $csvPath = base_path('data/MED.csv');

        if (! file_exists($csvPath)) {
            $this->command?->warn('MED.csv not found, skipping MedicationCsvSeeder.');

            return;
        }

        $creator = User::whereHas('roles', function ($q): void {
            $q->where('name', 'pharmacy_admin');
        })->first();

        if (! $creator) {
            $creator = User::updateOrCreate(
                ['email' => 'seed.pharmacy.admin@example.com'],
                [
                    'name' => 'Seed Pharmacy Admin',
                    'phone_number' => '+213770000999',
                    'password' => Hash::make('password'),
                ],
            );
            $creator->syncRoles(['pharmacy_admin']);
        }

        $pharmacies = Pharmacy::query()->get();
        $suppliers = Supplier::query()->get();

        if ($pharmacies->isEmpty() || $suppliers->isEmpty()) {
            $this->command?->warn('No pharmacies or suppliers available, skipping distribution in MedicationCsvSeeder.');

            return;
        }

        $handle = fopen($csvPath, 'r');

        if (! $handle) {
            $this->command?->warn('Unable to open MED.csv, skipping MedicationCsvSeeder.');

            return;
        }

        $header = fgetcsv($handle);

        if (! is_array($header)) {
            fclose($handle);
            $this->command?->warn('MED.csv header missing or invalid, skipping MedicationCsvSeeder.');

            return;
        }

        $medicationIds = [];
        $importedRows = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (! is_array($row)) {
                continue;
            }

            $record = $this->mapRecord($header, $row);

            if (! $record) {
                continue;
            }

            $name = $this->clean($record['name'] ?? '');
            if ($name === '') {
                continue;
            }

            $countryName = $this->normalizeCountryName($record['country'] ?? null);

            $country = Country::updateOrCreate(
                ['created_by' => $creator->id, 'name' => $countryName],
                ['code' => $this->resolveCountryCode($countryName, $creator->id)],
            );

            $labName = $this->clean($record['laboratory'] ?? 'Unknown Laboratory') ?: 'Unknown Laboratory';
            $laboratory = Laboratory::updateOrCreate(
                ['created_by' => $creator->id, 'name' => $labName],
                ['country' => $countryName],
            );

            $therapeuticName = $this->clean($record['theraputic_class'] ?? 'General') ?: 'General';
            $therapeutic = TherapeuticClass::updateOrCreate(
                ['created_by' => $creator->id, 'name' => $therapeuticName],
                ['description' => null],
            );

            $pharmacologicalName = $this->clean($record['pharmaco_class'] ?? 'General') ?: 'General';
            $pharmacological = PharmacologicalClass::updateOrCreate(
                ['created_by' => $creator->id, 'name' => $pharmacologicalName],
                ['description' => null],
            );

            $formName = $this->clean($record['form'] ?? 'Unknown Form') ?: 'Unknown Form';
            $form = PharmaceuticalForm::updateOrCreate(
                ['created_by' => $creator->id, 'name' => $formName],
                [],
            );

            $dci = $this->clean($record['dci'] ?? 'Unknown Ingredient') ?: 'Unknown Ingredient';
            $rawDciCode = $this->clean($record['dci_code'] ?? '');
            $dciCode = $rawDciCode !== '' ? $rawDciCode : 'DCI-'.substr(md5($dci), 0, 8);
            $ingredient = $this->resolveActiveIngredient($creator->id, $dci, $dciCode);

            $registration = $this->clean($record['registration_num'] ?? '');
            if ($registration === '') {
                $registration = 'CSV-'.substr(md5($name.'|'.($record['commercial_name'] ?? '').'|'.$dciCode.'|'.($record['dosage'] ?? '')), 0, 24);
            }

            $medication = Medication::updateOrCreate(
                ['registration_num' => $registration],
                [
                    'name' => $name,
                    'commercial_name' => $this->clean($record['commercial_name'] ?? null),
                    'laboratory_id' => $laboratory->id,
                    'therapeutic_class_id' => $therapeutic->id,
                    'pharmacological_class_id' => $pharmacological->id,
                    'pharmaceutical_form_id' => $form->id,
                    'country_id' => $country->id,
                    'dosage' => $this->clean($record['dosage'] ?? null),
                    'conditioning' => $this->clean($record['conditioning'] ?? null),
                    'type' => $this->mapType($record['type'] ?? null),
                    'list' => $this->mapList($record['list'] ?? null),
                    'marketed' => $this->toBool($record['marketed'] ?? true),
                    'reimbursable' => $this->toBool($record['reimbursable'] ?? false),
                    'notice_link' => $this->clean($record['notice_link'] ?? null),
                    'img_link' => $this->clean($record['img_link'] ?? null),
                    'created_by' => $creator->id,
                ],
            );

            $medication->activeIngredients()->syncWithoutDetaching([
                $ingredient->id => ['strength' => $this->clean($record['dosage'] ?? null)],
            ]);

            $medicationIds[] = $medication->id;
            $importedRows++;
        }

        fclose($handle);

        $medicationIds = array_values(array_unique($medicationIds));

        if ($medicationIds === []) {
            $this->command?->warn('No medication rows imported from MED.csv.');

            return;
        }

        $medicationMap = Medication::query()
            ->whereIn('id', $medicationIds)
            ->get(['id', 'name', 'commercial_name', 'img_link'])
            ->keyBy('id');

        $pharmacyCount = max(1, $pharmacies->count());
        foreach ($pharmacies->values() as $index => $pharmacy) {
            $selection = collect($medicationIds)
                ->filter(fn (int $id): bool => (($id + $index) % $pharmacyCount) === 0 || (($id + $index) % 5) === 0)
                ->take(90);

            foreach ($selection as $medicationId) {
                $buyPrice = mt_rand(80, 140) / 10;
                $sellPrice = $buyPrice + (mt_rand(10, 45) / 10);

                Inventory::updateOrCreate(
                    ['pharmacy_id' => $pharmacy->id, 'medication_id' => $medicationId],
                    [
                        'qte' => mt_rand(8, 120),
                        'prix_achat' => $buyPrice,
                        'prix_vente' => $sellPrice,
                    ],
                );
            }
        }

        $supplierCount = max(1, $suppliers->count());
        foreach ($suppliers->values() as $index => $supplier) {
            $selection = collect($medicationIds)
                ->filter(fn (int $id): bool => (($id + $index) % $supplierCount) === 0 || (($id + $index) % 4) === 0)
                ->take(120);

            foreach ($selection as $medicationId) {
                $buyPrice = mt_rand(60, 120) / 10;
                $sellPrice = $buyPrice + (mt_rand(15, 55) / 10);

                $product = Product::updateOrCreate(
                    ['supplier_id' => $supplier->id, 'medication_id' => $medicationId],
                    [
                        'qte' => mt_rand(20, 240),
                        'prix_achat' => $buyPrice,
                        'prix_vente' => $sellPrice,
                    ],
                );

                if ((($medicationId + $index) % 12) === 0) {
                    $medication = $medicationMap->get($medicationId);
                    $baseName = $medication?->commercial_name ?: $medication?->name ?: 'Medication';

                    SupplierPost::updateOrCreate(
                        ['supplier_id' => $supplier->id, 'product_id' => $product->id],
                        [
                            'title' => 'Offer: '.$baseName,
                            'description' => 'Available now with competitive supplier pricing.',
                            'image' => $medication?->img_link,
                            'qte_vente' => max(1, min(40, (int) floor($product->qte / 4))),
                        ],
                    );
                }
            }
        }

        $this->command?->info("MedicationCsvSeeder imported {$importedRows} rows and populated inventories/products.");
    }

    private function mapRecord(array $header, array $row): ?array
    {
        if (count($row) < count($header)) {
            $row = array_pad($row, count($header), null);
        }

        if (count($row) > count($header)) {
            $row = array_slice($row, 0, count($header));
        }

        $mapped = array_combine($header, $row);

        return is_array($mapped) ? $mapped : null;
    }

    private function clean(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '' || strtoupper($trimmed) === 'NULL') {
            return null;
        }

        return $trimmed;
    }

    private function toBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['1', 'true', 'yes', 'y', 'oui'], true);
    }

    private function mapType(?string $raw): string
    {
        $value = strtolower((string) $raw);

        return match (true) {
            str_contains($value, 'princeps'), str_contains($value, 'brand') => 'brand',
            str_contains($value, 'bio') => 'biosimilar',
            str_contains($value, 'herbal') => 'herbal',
            default => 'generic',
        };
    }

    private function mapList(?string $raw): string
    {
        $value = strtolower((string) $raw);

        return match (true) {
            str_contains($value, 'iii') => 'list_iii',
            str_contains($value, 'ii') => 'list_ii',
            str_contains($value, 'i') => 'list_i',
            default => 'free',
        };
    }

    private function resolveActiveIngredient(int $creatorId, string $dci, string $dciCode): ActiveIngredient
    {
        $ingredient = ActiveIngredient::query()
            ->where('created_by', $creatorId)
            ->where(function ($q) use ($dci, $dciCode): void {
                $q->where('dci', $dci)
                    ->orWhere('dci_code', $dciCode);
            })
            ->first();

        if ($ingredient) {
            $ingredient->update([
                'dci' => $ingredient->dci ?: $dci,
                'dci_code' => $ingredient->dci_code ?: $dciCode,
            ]);

            return $ingredient;
        }

        return ActiveIngredient::create([
            'created_by' => $creatorId,
            'dci' => $dci,
            'dci_code' => $dciCode,
        ]);
    }

    private function normalizeCountryName(?string $rawCountry): string
    {
        $countryName = $this->clean($rawCountry);

        if ($countryName === null) {
            return 'Unknown';
        }

        $normalized = strtoupper($countryName);

        if (in_array($normalized, ['N/D', 'ND', 'N/A', 'NA', 'NULL', 'UNK', 'UNKNOWN'], true)) {
            return 'Unknown';
        }

        return $countryName;
    }

    private function resolveCountryCode(string $countryName, int $creatorId): string
    {
        $normalizedCountry = $this->normalizeCountryName($countryName);
        $base = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $normalizedCountry) ?: 'UNK', 0, 3));
        $base = str_pad($base, 3, 'X');

        for ($i = 0; $i < 10; $i++) {
            $candidate = $i === 0 ? $base : strtoupper(substr(md5($normalizedCountry.'|'.$i), 0, 3));

            $conflict = Country::where('created_by', $creatorId)
                ->where('code', $candidate)
                ->where('name', '!=', $normalizedCountry)
                ->exists();

            if (! $conflict) {
                return $candidate;
            }
        }

        return strtoupper(substr(md5($normalizedCountry.'|fallback'), 0, 3));
    }
}
