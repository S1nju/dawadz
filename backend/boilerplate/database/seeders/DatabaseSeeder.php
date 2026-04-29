<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\{ActiveIngredient, ApprovalRequest, Commande, Country, Facture, Inventory, Laboratory, Medication, PharmaceuticalForm, PharmacologicalClass, Pharmacy, Product, Supplier, SupplierPost, TherapeuticClass, User, UserNotification};
use Carbon\Carbon;
use Clickbar\Magellan\Data\Geometries\Point;
use Spatie\Permission\Models\Role;
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Role::findOrCreate('supplier_admin');
        Role::findOrCreate('supplier');
        Role::findOrCreate('pharmacy_admin');
        Role::findOrCreate('admin');
        Role::findOrCreate('user');

        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Platform Admin',
                'phone_number' => '+212600000001',
                'password' => Hash::make('password'),
            ],
        );
        $admin->syncRoles(['admin']);

        $supplierAdmin = User::updateOrCreate(
            ['email' => 'supplier@example.com'],
            [
                'name' => 'Supplier Admin',
                'phone_number' => '+212600000002',
                'password' => Hash::make('password'),
            ],
        );
        $supplierAdmin->syncRoles(['supplier_admin']);

        Supplier::updateOrCreate(
            ['user_id' => $supplierAdmin->id],
            [
                'company_name' => 'Demo Supplier SARL',
                'address' => '123 Supplier Avenue, Casablanca',
                'verified_at' => now(),
            ],
        );

        $pharmacyAdmin = User::updateOrCreate(
            ['email' => 'pharmacy@example.com'],
            [
                'name' => 'Pharmacy Admin',
                'phone_number' => '+212600000003',
                'password' => Hash::make('password'),
            ],
        );
        $pharmacyAdmin->syncRoles(['pharmacy_admin']);

        $oranPharmacyOwnerOne = User::updateOrCreate(
            ['email' => 'oran.central@example.com'],
            [
                'name' => 'Oran Central Owner',
                'phone_number' => '+213550000001',
                'password' => Hash::make('password'),
            ],
        );
        $oranPharmacyOwnerOne->syncRoles(['pharmacy_admin']);

        $oranPharmacyOwnerTwo = User::updateOrCreate(
            ['email' => 'oran.corniche@example.com'],
            [
                'name' => 'Oran Corniche Owner',
                'phone_number' => '+213550000002',
                'password' => Hash::make('password'),
            ],
        );
        $oranPharmacyOwnerTwo->syncRoles(['pharmacy_admin']);

        $oranPharmacyOwnerThree = User::updateOrCreate(
            ['email' => 'oran.es-senia@example.com'],
            [
                'name' => 'Oran Es Senia Owner',
                'phone_number' => '+213550000003',
                'password' => Hash::make('password'),
            ],
        );
        $oranPharmacyOwnerThree->syncRoles(['pharmacy_admin']);

        $oranPharmacyOwnerFour = User::updateOrCreate(
            ['email' => 'oran.akrama@example.com'],
            [
                'name' => 'Oran Akid Lotfi Owner',
                'phone_number' => '+213550000004',
                'password' => Hash::make('password'),
            ],
        );
        $oranPharmacyOwnerFour->syncRoles(['pharmacy_admin']);

        Pharmacy::updateOrCreate(
            ['owner_id' => $pharmacyAdmin->id],
            [
                'name' => 'Demo Pharmacy',
                'address' => '45 Pharmacy Street, Rabat',
                'city' => 'Rabat',
                'location' => Point::makeGeodetic(34.020882, -6.841650), // Rabat coordinates
                'registre_commerce_number' => 'RC-10001',
                'time_open' => '08:00:00',
                'time_closes' => '22:00:00',
                'verified_at' => now(),
            ],
        );

        $oranPharmacyOne = Pharmacy::updateOrCreate(
            ['registre_commerce_number' => 'RC-ORAN-10001'],
            [
                'owner_id' => $oranPharmacyOwnerOne->id,
                'name' => 'Oran Central Pharmacy',
                'address' => 'Place du 1er Novembre, Oran',
                'city' => 'Oran',
                'location' => Point::makeGeodetic(35.6971, -0.6308),
                'time_open' => '08:00:00',
                'time_closes' => '22:00:00',
                'verified_at' => now()->subDays(2),
            ],
        );

        $oranPharmacyTwo = Pharmacy::updateOrCreate(
            ['registre_commerce_number' => 'RC-ORAN-10002'],
            [
                'owner_id' => $oranPharmacyOwnerTwo->id,
                'name' => 'Oran Corniche Pharmacy',
                'address' => 'Boulevard de la Corniche, Oran',
                'city' => 'Oran',
                'location' => Point::makeGeodetic(35.7571, -0.6308),
                'time_open' => '09:00:00',
                'time_closes' => '21:00:00',
                'verified_at' => now()->subDay(),
            ],
        );

        $oranPharmacyThree = Pharmacy::updateOrCreate(
            ['registre_commerce_number' => 'RC-ORAN-10003'],
            [
                'owner_id' => $oranPharmacyOwnerThree->id,
                'name' => 'Es Senia Health Pharmacy',
                'address' => 'Avenue de l\'ALN, Es Senia, Oran',
                'city' => 'Oran',
                'location' => Point::makeGeodetic(35.6502, -0.6214),
                'time_open' => '08:00:00',
                'time_closes' => '20:30:00',
                'verified_at' => now()->subHours(18),
            ],
        );

        $oranPharmacyFour = Pharmacy::updateOrCreate(
            ['registre_commerce_number' => 'RC-ORAN-10004'],
            [
                'owner_id' => $oranPharmacyOwnerFour->id,
                'name' => 'Akid Lotfi Care Pharmacy',
                'address' => 'Akid Lotfi, Bir El Djir, Oran',
                'city' => 'Oran',
                'location' => Point::makeGeodetic(35.7306, -0.5861),
                'time_open' => '08:30:00',
                'time_closes' => '22:00:00',
                'verified_at' => now()->subHours(12),
            ],
        );

        $regularUser = User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Regular User',
                'phone_number' => '+212600000004',
                'password' => Hash::make('password'),
            ],
        );
        $regularUser->syncRoles(['user']);

        // Additional users to create realistic listings and role filters.
        $supplierStaff = User::updateOrCreate(
            ['email' => 'supplier.staff@example.com'],
            [
                'name' => 'Supplier Staff',
                'phone_number' => '+212600000005',
                'password' => Hash::make('password'),
            ],
        );
        $supplierStaff->syncRoles(['supplier_admin']);

        $pharmacyStaff = User::updateOrCreate(
            ['email' => 'pharmacy.staff@example.com'],
            [
                'name' => 'Pharmacy Staff',
                'phone_number' => '+212600000006',
                'password' => Hash::make('password'),
            ],
        );
        $pharmacyStaff->syncRoles(['pharmacy_admin']);

        $patientUser = User::updateOrCreate(
            ['email' => 'patient@example.com'],
            [
                'name' => 'Patient User',
                'phone_number' => '+212600000007',
                'password' => Hash::make('password'),
            ],
        );
        $patientUser->syncRoles(['user']);

        $oranPatientUser = User::updateOrCreate(
            ['email' => 'oran.patient@example.com'],
            [
                'name' => 'Oran Patient User',
                'phone_number' => '+213660000001',
                'password' => Hash::make('password'),
            ],
        );
        $oranPatientUser->syncRoles(['user']);

        $supplierTwo = Supplier::updateOrCreate(
            ['user_id' => $supplierStaff->id],
            [
                'company_name' => 'Atlas Medical Distribution',
                'address' => '77 Logistics Park, Casablanca',
                'verified_at' => now()->subDays(7),
            ],
        );

        $pharmacyTwo = Pharmacy::updateOrCreate(
            ['owner_id' => $pharmacyStaff->id],
            [
                'name' => 'Atlas Pharmacy',
                'address' => '18 Hassan II Avenue, Marrakech',
                'city' => 'Marrakech',
                'location' => Point::makeGeodetic(31.6295, -7.9811),
                'registre_commerce_number' => 'RC-20002',
                'time_open' => '09:00:00',
                'time_closes' => '21:00:00',
                'verified_at' => now()->subDays(5),
            ],
        );

        // Lookup catalogs are owner-scoped to pharmacy admins.
        $countryMa = Country::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'code' => 'MAR'],
            ['name' => 'Morocco'],
        );
        $countryFr = Country::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'code' => 'FRA'],
            ['name' => 'France'],
        );

        $labOne = Laboratory::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'name' => 'Demo Pharma Labs'],
            ['country' => 'MA'],
        );
        $labTwo = Laboratory::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'name' => 'Nordic Therapeutics'],
            ['country' => 'FR'],
        );

        $therapeuticOne = TherapeuticClass::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'name' => 'Analgesics'],
            ['description' => 'Pain relief medications'],
        );
        $therapeuticTwo = TherapeuticClass::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'name' => 'Antibiotics'],
            ['description' => 'Bacterial infection treatment'],
        );

        $pharmacologicalOne = PharmacologicalClass::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'name' => 'NSAIDs'],
            ['description' => 'Non-steroidal anti-inflammatory drugs'],
        );
        $pharmacologicalTwo = PharmacologicalClass::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'name' => 'Beta-lactams'],
            ['description' => 'Penicillin-related antibacterial agents'],
        );

        $ingredientParacetamol = ActiveIngredient::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'dci_code' => 'N02BE01'],
            ['dci' => 'Paracetamol'],
        );
        $ingredientAmoxicillin = ActiveIngredient::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'dci_code' => 'J01CA04'],
            ['dci' => 'Amoxicillin'],
        );

        $formTablet = PharmaceuticalForm::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'name' => 'Tablet'],
            [],
        );
        $formCapsule = PharmaceuticalForm::updateOrCreate(
            ['created_by' => $pharmacyAdmin->id, 'name' => 'Capsule'],
            [],
        );

        $medicationOne = Medication::updateOrCreate(
            ['registration_num' => 'REG-1000'],
            [
                'name' => 'Paracetamol',
                'commercial_name' => 'Doliprane',
                'laboratory_id' => $labOne->id,
                'therapeutic_class_id' => $therapeuticOne->id,
                'pharmacological_class_id' => $pharmacologicalOne->id,
                'pharmaceutical_form_id' => $formTablet->id,
                'country_id' => $countryMa->id,
                'dosage' => '500mg',
                'conditioning' => 'Box of 16',
                'type' => 'brand',
                'list' => 'free',
                'marketed' => true,
                'reimbursable' => true,
                'notice_link' => 'https://example.com/notices/paracetamol.pdf',
                'img_link' => 'https://example.com/images/paracetamol.png',
                'created_by' => $pharmacyAdmin->id,
            ],
        );

        $medicationTwo = Medication::updateOrCreate(
            ['registration_num' => 'REG-1001'],
            [
                'name' => 'Amoxicillin',
                'commercial_name' => 'Amoxil',
                'laboratory_id' => $labTwo->id,
                'therapeutic_class_id' => $therapeuticTwo->id,
                'pharmacological_class_id' => $pharmacologicalTwo->id,
                'pharmaceutical_form_id' => $formCapsule->id,
                'country_id' => $countryFr->id,
                'dosage' => '500mg',
                'conditioning' => 'Box of 12',
                'type' => 'generic',
                'list' => 'list_i',
                'marketed' => true,
                'reimbursable' => false,
                'notice_link' => 'https://example.com/notices/amoxicillin.pdf',
                'img_link' => 'https://example.com/images/amoxicillin.png',
                'created_by' => $pharmacyAdmin->id,
            ],
        );

        $medicationOne->activeIngredients()->syncWithoutDetaching([
            $ingredientParacetamol->id => ['strength' => '500mg'],
        ]);
        $medicationTwo->activeIngredients()->syncWithoutDetaching([
            $ingredientAmoxicillin->id => ['strength' => '500mg'],
        ]);

        $productOne = Product::updateOrCreate(
            ['supplier_id' => $supplierAdmin->supplier->id, 'medication_id' => $medicationOne->id],
            [
                'qte' => 150,
                'prix_achat' => 4.50,
                'prix_vente' => 7.50,
            ],
        );

        $productTwo = Product::updateOrCreate(
            ['supplier_id' => $supplierTwo->id, 'medication_id' => $medicationTwo->id],
            [
                'qte' => 90,
                'prix_achat' => 6.00,
                'prix_vente' => 9.75,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $pharmacyAdmin->pharmacy->id, 'medication_id' => $medicationOne->id],
            [
                'qte' => 80,
                'prix_achat' => 5.00,
                'prix_vente' => 8.20,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $pharmacyAdmin->pharmacy->id, 'medication_id' => $medicationTwo->id],
            [
                'qte' => 35,
                'prix_achat' => 6.30,
                'prix_vente' => 10.00,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $pharmacyTwo->id, 'medication_id' => $medicationTwo->id],
            [
                'qte' => 45,
                'prix_achat' => 6.80,
                'prix_vente' => 10.40,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $pharmacyTwo->id, 'medication_id' => $medicationOne->id],
            [
                'qte' => 28,
                'prix_achat' => 4.90,
                'prix_vente' => 8.10,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $oranPharmacyOne->id, 'medication_id' => $medicationOne->id],
            [
                'qte' => 72,
                'prix_achat' => 4.70,
                'prix_vente' => 8.05,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $oranPharmacyOne->id, 'medication_id' => $medicationTwo->id],
            [
                'qte' => 31,
                'prix_achat' => 6.20,
                'prix_vente' => 10.20,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $oranPharmacyTwo->id, 'medication_id' => $medicationOne->id],
            [
                'qte' => 54,
                'prix_achat' => 4.85,
                'prix_vente' => 8.15,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $oranPharmacyTwo->id, 'medication_id' => $medicationTwo->id],
            [
                'qte' => 26,
                'prix_achat' => 6.25,
                'prix_vente' => 10.35,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $oranPharmacyThree->id, 'medication_id' => $medicationOne->id],
            [
                'qte' => 60,
                'prix_achat' => 4.80,
                'prix_vente' => 8.00,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $oranPharmacyThree->id, 'medication_id' => $medicationTwo->id],
            [
                'qte' => 22,
                'prix_achat' => 6.10,
                'prix_vente' => 10.05,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $oranPharmacyFour->id, 'medication_id' => $medicationTwo->id],
            [
                'qte' => 35,
                'prix_achat' => 6.40,
                'prix_vente' => 10.10,
            ],
        );

        Inventory::updateOrCreate(
            ['pharmacy_id' => $oranPharmacyFour->id, 'medication_id' => $medicationOne->id],
            [
                'qte' => 40,
                'prix_achat' => 4.95,
                'prix_vente' => 8.30,
            ],
        );

        SupplierPost::updateOrCreate(
            ['supplier_id' => $supplierAdmin->supplier->id, 'product_id' => $productOne->id],
            [
                'title' => 'Pain Relief Weekly Offer',
                'description' => 'Bulk order discount for pharmacies',
                'image' => 'https://example.com/posts/paracetamol-weekly.png',
                'qte_vente' => 25,
            ],
        );

        SupplierPost::updateOrCreate(
            ['supplier_id' => $supplierTwo->id, 'product_id' => $productTwo->id],
            [
                'title' => 'Antibiotics Campaign',
                'description' => 'Limited batch with short lead time',
                'image' => 'https://example.com/posts/amoxicillin-campaign.png',
                'qte_vente' => 18,
            ],
        );

        $orderedAt = Carbon::create(2026, 4, 12, 10, 0, 0);
        $commande = Commande::updateOrCreate(
            [
                'pharmacy_id' => $pharmacyAdmin->pharmacy->id,
                'supplier_id' => $supplierAdmin->supplier->id,
                'ordered_at' => $orderedAt,
            ],
            [
                'external_supplier_name' => null,
                'status' => 'confirmed',
                'confirmed_at' => $orderedAt->copy()->addHours(2),
                'notes' => 'Routine monthly restock',
            ],
        );

        $commande->lines()->updateOrCreate(
            ['medication_name' => 'Paracetamol 500mg'],
            [
                'product_id' => $productOne->id,
                'qte' => 20,
                'unit_price' => 7.50,
                'total' => 150.00,
            ],
        );

        $facture = Facture::updateOrCreate(
            ['commande_id' => $commande->id],
            [
                'supplier_id' => $supplierAdmin->supplier->id,
                'pharmacy_id' => $pharmacyAdmin->pharmacy->id,
                'invoice_number' => 'FAC-2026-0001',
                'status' => 'issued',
                'total_ht' => 150.00,
                'total_ttc' => 150.00,
                'issued_at' => $orderedAt->copy()->addDay(),
            ],
        );

        $facture->lines()->updateOrCreate(
            ['medication_name' => 'Paracetamol 500mg'],
            [
                'product_id' => $productOne->id,
                'qte' => 20,
                'unit_price' => 7.50,
                'total' => 150.00,
            ],
        );

        ApprovalRequest::updateOrCreate(
            ['user_id' => $patientUser->id, 'type' => 'pharmacy'],
            [
                'status' => 'pending',
                'documents' => ['patient-pharmacy-license.pdf'],
                'images' => ['patient-pharmacy-front.jpg'],
                'reviewed_by' => null,
                'reviewed_at' => null,
            ],
        );

        ApprovalRequest::updateOrCreate(
            ['user_id' => $supplierStaff->id, 'type' => 'supplier'],
            [
                'status' => 'accepted',
                'documents' => ['supplier-registry.pdf'],
                'images' => ['supplier-warehouse.jpg'],
                'reviewed_by' => $admin->id,
                'reviewed_at' => now()->subDays(1),
            ],
        );

        UserNotification::updateOrCreate(
            [
                'user_id' => $patientUser->id,
                'type' => 'approval_request_status',
                'message' => 'Your approval request is pending review.',
            ],
            ['read_at' => null],
        );

        UserNotification::updateOrCreate(
            [
                'user_id' => $supplierStaff->id,
                'type' => 'approval_request_status',
                'message' => 'Your supplier approval request has been accepted.',
            ],
            ['read_at' => now()->subHours(4)],
        );

        $this->call(MedicationCsvSeeder::class);
    }
}
