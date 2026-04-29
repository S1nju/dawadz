# Medication Schema - 3NF Normalization Documentation

## Overview
The medication schema has been normalized to **Third Normal Form (3NF)** to eliminate data redundancy and ensure data integrity.

## CSV Format Mapping
**Original CSV fields mapped to normalized tables:**

```
"id" → medications.id
"name" → medications.name
"laboratory" → laboratories.name (lookup table)
"therapeutic_class" → therapeutic_classes.name (lookup table)
"pharmaco_class" → pharmacological_classes.name (lookup table)
"dci" → active_ingredients.dci (lookup table, many-to-many)
"commercial_name" → medications.commercial_name
"dci_code" → active_ingredients.dci_code (lookup table)
"form" → pharmaceutical_forms.name (lookup table)
"dosage" → medications.dosage (atomic value)
"conditioning" → medications.conditioning (e.g., "Blister of 10")
"type" → medications.type (generic|brand|biosimilar|herbal)
"list" → medications.list (list_i|list_ii|list_iii|free)
"country" → countries.name (lookup table)
"marketed" → medications.marketed (boolean)
"reimbursable" → medications.reimbursable (boolean)
"reference_price" → medications.reference_price (decimal)
"ppa_indicative" → medications.ppa_indicative (decimal)
"registration_num" → medications.registration_num (unique)
"notice_link" → medications.notice_link (URL)
"img_link" → medications.img_link (URL)
```

## Database Tables

### 1. **laboratories**
Isolates pharmaceutical company/laboratory data.
```
Fields: id, name (unique), country, created_at, updated_at
```

### 2. **therapeutic_classes**
Classification by therapeutic use (e.g., Antibiotics, Antihistamines, etc.)
```
Fields: id, name (unique), description, created_at, updated_at
```

### 3. **pharmacological_classes**
Classification by mechanism of action.
```
Fields: id, name (unique), description, created_at, updated_at
```

### 4. **active_ingredients**
Stores DCI (Dénomination Commune Internationale) information.
```
Fields: id, dci (unique), dci_code (unique), created_at, updated_at
```

### 5. **pharmaceutical_forms**
Drug delivery forms (tablet, capsule, syrup, injection, etc.)
```
Fields: id, name (unique), created_at, updated_at
```

### 6. **countries**
Geographic location/marketing information.
```
Fields: id, name (unique), code (ISO 3166-1 alpha-3, unique), created_at, updated_at
```

### 7. **medications** (Main Table)
Normalized medication records with foreign keys to lookup tables.
```
Fields:
- id (primary key)
- name (medication name)
- commercial_name (brand name, nullable)
- laboratory_id (FK → laboratories)
- therapeutic_class_id (FK → therapeutic_classes, nullable)
- pharmacological_class_id (FK → pharmacological_classes, nullable)
- pharmaceutical_form_id (FK → pharmaceutical_forms)
- country_id (FK → countries, nullable)
- dosage (e.g., "500mg")
- conditioning (e.g., "Blister of 10")
- type (generic|brand|biosimilar|herbal)
- list (list_i|list_ii|list_iii|free)
- reference_price (decimal 12,2, nullable)
- ppa_indicative (decimal 12,2, nullable)
- marketed (boolean, default true)
- reimbursable (boolean, default false)
- registration_num (unique, nullable)
- notice_link (URL)
- img_link (URL)
- created_by (FK → users, nullable)
- created_at, updated_at
- Indexes: name, commercial_name, laboratory_id, therapeutic_class_id
```

### 8. **medication_active_ingredients** (Junction Table)
Many-to-many relationship for medications with multiple active ingredients (combination drugs).
```
Fields:
- id (primary key)
- medication_id (FK → medications, cascading delete)
- active_ingredient_id (FK → active_ingredients, cascading delete)
- strength (dosage strength of this ingredient, nullable)
- created_at, updated_at
- Unique constraint: (medication_id, active_ingredient_id)
```

## 3NF Normalization Rules Applied

1. ✅ **1NF** (First Normal Form): All atomic values - no repeating groups
2. ✅ **2NF** (Second Normal Form): All non-key attributes depend on the primary key
3. ✅ **3NF** (Third Normal Form):
   - Lookup tables eliminate transitive dependencies
   - Audit trail (created_by) is kept in medications for context
   - Many-to-many relationship properly normalized via junction table

## Usage Examples

### Create a Laboratory
```php
$lab = Laboratory::create([
    'name' => 'Pharma Co.',
    'country' => 'France',
]);
```

### Create Active Ingredient
```php
$dci = ActiveIngredient::create([
    'dci' => 'Acetaminophen',
    'dci_code' => 'N02BE01',
]);
```

### Create Pharmaceutical Form
```php
$form = PharmaceuticalForm::create([
    'name' => 'Tablet',
]);
```

### Create Medication (Example: Simple)
```php
$med = Medication::create([
    'name' => 'Paracetamol',
    'commercial_name' => 'Doliprane',
    'laboratory_id' => $lab->id,
    'pharmaceutical_form_id' => $form->id,
    'dosage' => '500mg',
    'conditioning' => 'Blister of 10',
    'type' => 'brand',
    'list' => 'free',
    'marketed' => true,
    'reimbursable' => true,
    'reference_price' => 3.50,
]);
```

### Attach Active Ingredients (with strength)
```php
$med->activeIngredients()->attach($dci->id, ['strength' => '500mg']);
```

### Query with Relationships
```php
// Get medication with all relationships loaded
$med = Medication::with([
    'laboratory',
    'therapeuticClass',
    'pharmaceuticalForm',
    'activeIngredients',
    'country'
])->find(1);

// Filter by therapeutic class
$antihistamines = Medication::whereHas('therapeuticClass', 
    fn($q) => $q->where('name', 'Antihistamines')
)->get();

// Get medications from a specific laboratory
$pharmaCoMeds = Laboratory::find($lab_id)->medications;
```

## Related Business Domain Relations

### Medications → Products
A supplier creates products from medications (with pricing and quantity).

### Medications → Inventory
A pharmacy maintains inventory of medications.

### Medications → Supplier Posts
Suppliers create posts advertising specific medications.

### Medications → Commande Lines
Pharmacy orders can include multiple medications.

### Medications → Facture Lines
Invoices line items reference medications.

## Benefits of This Design

✨ **Data Integrity**: No duplicate data across medications  
✨ **Flexibility**: Easy to add/update therapeutic classes, forms, etc.  
✨ **Performance**: Indexes on frequently filtered fields  
✨ **Scalability**: Supports complex medications and combinations  
✨ **Maintainability**: Clear separation of concerns  
✨ **Auditability**: created_by and timestamps on all records
