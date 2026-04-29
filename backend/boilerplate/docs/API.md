# API Documentation

This backend is a Laravel JSON API for a pharmacy marketplace.

Swagger/OpenAPI spec: [openapi.yaml](openapi.yaml)

## Base URL

All endpoints are prefixed with `/api`.

## Authentication

Authentication uses Laravel Sanctum bearer tokens.

### Public auth routes

- `POST /api/auth/register`
- `POST /api/auth/login`

### Authenticated account routes

- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/avatar`
- `POST /api/auth/change-password`

Use token auth header:

```http
Authorization: Bearer <token>
```

## Rate Limiting

The API uses named throttles:

- `auth`: login/register
- `public-search`: public discovery endpoints
- `api`: authenticated reads
- `api-write`: authenticated writes

## Roles and Access

### admin

Can manage:

- approval request review (`status` update and delete)
- all users
- suppliers
- pharmacies
- products
- medications
- medication active ingredient links

### pharmacy_admin

Can manage:

- laboratories they create
- therapeutic classes they create
- pharmacological classes they create
- active ingredients they create
- pharmaceutical forms they create
- countries they create
- their pharmacy resources
- inventories
- commandes
- factures
- supplier posts feed (read only)
- medications they create

### supplier_admin

Can manage:

- supplier profile
- products
- supplier posts (write)
- medications they create
- laboratories they create
- therapeutic classes they create
- pharmacological classes they create
- active ingredients they create
- pharmaceutical forms they create
- countries they create
- commande confirmation for their supplier

### user

Can:

- read public pharmacies
- create and inspect own approval requests

## Full Route Catalog

### Public routes

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/` | API health check |
| `GET` | `/api/files/{path}` | Serve stored file |
| `POST` | `/api/auth/register` | Register |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/pharmacies/nearby` | Nearby pharmacies beyond 5 km |
| `GET` | `/api/pharmacies` | Public pharmacy list |
| `GET` | `/api/pharmacies/{pharmacy}` | Public pharmacy details |

`/api/pharmacies/nearby` accepts either `city` (recommended) or `latitude` + `longitude`.

### Approval requests (authenticated)

| Method | Path |
| --- | --- |
| `GET` | `/api/approval-requests` |
| `POST` | `/api/approval-requests` |
| `GET` | `/api/approval-requests/{approval_request}` |
| `PUT` | `/api/approval-requests/{approval_request}` |
| `PATCH` | `/api/approval-requests/{approval_request}` |
| `PATCH` | `/api/approval-requests/{approval_request}/status` |
| `DELETE` | `/api/approval-requests/{approval_request}` |

### Notifications (authenticated)

| Method | Path |
| --- | --- |
| `GET` | `/api/notifications` |
| `GET` | `/api/notifications/{notification}` |
| `DELETE` | `/api/notifications/{notification}` |
| `PATCH` | `/api/notifications/{notification}/read` |

### Users (admin only)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/users` | List all users and filter by query string |
| `POST` | `/api/users` | Create a user |
| `GET` | `/api/users/{user}` | Show a user |
| `PUT` | `/api/users/{user}` | Update a user |
| `PATCH` | `/api/users/{user}` | Update a user |
| `DELETE` | `/api/users/{user}` | Delete a user |

Filters supported on `GET /api/users`:

- `q` searches `name`, `email`, and `phone_number`
- `role` filters users by a single role name
- `roles[]` filters users by multiple role names

### Lookup catalogs (pharmacy_admin and supplier_admin, owner-scoped)

Each pharmacy owner only sees/manages records where `created_by = current_user`.

| Resource | Routes |
| --- | --- |
| laboratories | `GET, POST /api/laboratories`, `GET, PUT, PATCH, DELETE /api/laboratories/{laboratory}` |
| therapeutic classes | `GET, POST /api/therapeutic-classes`, `GET, PUT, PATCH, DELETE /api/therapeutic-classes/{therapeutic_class}` |
| pharmacological classes | `GET, POST /api/pharmacological-classes`, `GET, PUT, PATCH, DELETE /api/pharmacological-classes/{pharmacological_class}` |
| active ingredients | `GET, POST /api/active-ingredients`, `GET, PUT, PATCH, DELETE /api/active-ingredients/{active_ingredient}` |
| pharmaceutical forms | `GET, POST /api/pharmaceutical-forms`, `GET, PUT, PATCH, DELETE /api/pharmaceutical-forms/{pharmaceutical_form}` |
| countries | `GET, POST /api/countries`, `GET, PUT, PATCH, DELETE /api/countries/{country}` |

### Suppliers and marketplace

| Method | Path |
| --- | --- |
| `GET` | `/api/suppliers` |
| `POST` | `/api/suppliers` |
| `GET` | `/api/suppliers/{supplier}` |
| `PUT` | `/api/suppliers/{supplier}` |
| `PATCH` | `/api/suppliers/{supplier}` |
| `DELETE` | `/api/suppliers/{supplier}` |
| `GET` | `/api/products` |
| `POST` | `/api/products` |
| `GET` | `/api/products/{product}` |
| `PUT` | `/api/products/{product}` |
| `PATCH` | `/api/products/{product}` |
| `DELETE` | `/api/products/{product}` |
| `GET` | `/api/supplier-posts` |
| `GET` | `/api/supplier-posts/{supplier_post}` |
| `POST` | `/api/supplier-posts` |
| `PUT` | `/api/supplier-posts/{supplier_post}` |
| `PATCH` | `/api/supplier-posts/{supplier_post}` |
| `DELETE` | `/api/supplier-posts/{supplier_post}` |

Notes:

- `GET /api/supplier-posts*` is for `admin|pharmacy_admin|supplier_admin`.
- write actions on `/api/supplier-posts*` are for `admin|supplier_admin`.

### Commandes

- `GET /api/commandes*` and `PATCH /api/commandes/{commande}/confirm|refuse` are for `admin|pharmacy_admin|supplier_admin|supplier`.
- `GET /api/supplier-posts` supports filters:
  - `search`: matches post title/description, supplier company/address, and medication names.
  - `city`: matches supplier address by city text.
  - `company_name`: matches supplier company name.
  - `supplier_id`: filters by a specific supplier.
  - `product_id`: filters by a specific product.

### Pharmacy operations

| Method | Path |
| --- | --- |
| `POST` | `/api/pharmacies` |
| `PUT` | `/api/pharmacies/{pharmacy}` |
| `PATCH` | `/api/pharmacies/{pharmacy}` |
| `DELETE` | `/api/pharmacies/{pharmacy}` |
| `GET` | `/api/inventories` |
| `POST` | `/api/inventories` |
| `GET` | `/api/inventories/{inventory}` |
| `PUT` | `/api/inventories/{inventory}` |
| `PATCH` | `/api/inventories/{inventory}` |
| `DELETE` | `/api/inventories/{inventory}` |
| `GET` | `/api/commandes` |
| `POST` | `/api/commandes` |
| `GET` | `/api/commandes/{commande}` |
| `PUT` | `/api/commandes/{commande}` |
| `PATCH` | `/api/commandes/{commande}` |
| `DELETE` | `/api/commandes/{commande}` |
| `PATCH` | `/api/commandes/{commande}/confirm` |
| `GET` | `/api/factures` |
| `POST` | `/api/factures` |
| `GET` | `/api/factures/{facture}` |
| `PUT` | `/api/factures/{facture}` |
| `PATCH` | `/api/factures/{facture}` |
| `DELETE` | `/api/factures/{facture}` |

### Medications (authenticated, owner-scoped)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/medications` | List medications visible to the authenticated user |
| `POST` | `/api/medications` | Create a medication |
| `GET` | `/api/medications/{medication}` | Show a medication if owned by the authenticated user or if admin |
| `PUT` | `/api/medications/{medication}` | Update a medication |
| `PATCH` | `/api/medications/{medication}` | Update a medication |
| `DELETE` | `/api/medications/{medication}` | Delete a medication |
| `GET` | `/api/medications/{medication}/active-ingredients` | List medication ingredients |
| `POST` | `/api/medications/{medication}/active-ingredients` | Add a medication ingredient |
| `GET` | `/api/medications/{medication}/active-ingredients/{active_ingredient}` | Show a medication ingredient |
| `PUT` | `/api/medications/{medication}/active-ingredients/{active_ingredient}` | Update a medication ingredient |
| `PATCH` | `/api/medications/{medication}/active-ingredients/{active_ingredient}` | Update a medication ingredient |
| `DELETE` | `/api/medications/{medication}/active-ingredients/{active_ingredient}` | Remove a medication ingredient |

## Full JSON Bodies (Write Endpoints)

### Auth

`POST /api/auth/register`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

`POST /api/auth/login`

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

`POST /api/auth/change-password`

```json
{
  "current_password": "password123",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

`POST /api/auth/avatar`

This endpoint expects `multipart/form-data` with file field `avatar` and does not use JSON.

`POST /api/auth/logout`

No request body.

### Approval Requests

`POST /api/approval-requests`

```json
{
  "type": "pharmacy",
  "documents": ["license.pdf"],
  "images": ["storefront.png"]
}
```

`PUT/PATCH /api/approval-requests/{approval_request}`

```json
{
  "documents": ["updated-license.pdf"],
  "images": ["updated-storefront.png"]
}
```

`PATCH /api/approval-requests/{approval_request}/status`

```json
{
  "status": "accepted",
  "review_notes": "Looks good"
}
```

On acceptance, the user is granted the matching role (`supplier_admin` or `pharmacy_admin`).
The supplier/pharmacy profile is then created by that accepted user from their dashboard endpoints.

### Admin Users

`POST /api/users`

```json
{
  "name": "Platform User",
  "email": "platform.user@example.com",
  "phone_number": "+212600000010",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "pharmacy_admin",
  "roles": ["pharmacy_admin"]
}
```

`PUT/PATCH /api/users/{user}`

```json
{
  "name": "Updated Name",
  "email": "updated.user@example.com",
  "phone_number": "+212600000099",
  "password": "newpassword123",
  "password_confirmation": "newpassword123",
  "role": "supplier_admin",
  "roles": ["supplier_admin"]
}
```

### Lookup Catalogs (pharmacy_admin and supplier_admin)

`POST /api/laboratories`

```json
{
  "name": "Central Lab",
  "country": "MA"
}
```

`PUT/PATCH /api/laboratories/{laboratory}`

```json
{
  "name": "Central Lab Updated",
  "country": "TN"
}
```

`POST /api/therapeutic-classes`

```json
{
  "name": "Antibiotics",
  "description": "Bacterial infections"
}
```

`PUT/PATCH /api/therapeutic-classes/{therapeutic_class}`

```json
{
  "name": "Antibiotics Updated",
  "description": "Updated description"
}
```

`POST /api/pharmacological-classes`

```json
{
  "name": "Beta Blockers",
  "description": "Heart medications"
}
```

`PUT/PATCH /api/pharmacological-classes/{pharmacological_class}`

```json
{
  "name": "Beta Blockers Updated",
  "description": "Updated description"
}
```

`POST /api/active-ingredients`

```json
{
  "dci": "Paracetamol",
  "dci_code": "N02BE01"
}
```

`PUT/PATCH /api/active-ingredients/{active_ingredient}`

```json
{
  "dci": "Paracetamol",
  "dci_code": "N02BE02"
}
```

`POST /api/pharmaceutical-forms`

```json
{
  "name": "Tablet"
}
```

`PUT/PATCH /api/pharmaceutical-forms/{pharmaceutical_form}`

```json
{
  "name": "Capsule"
}
```

`POST /api/countries`

```json
{
  "name": "Morocco",
  "code": "MAR"
}
```

`PUT/PATCH /api/countries/{country}`

```json
{
  "name": "Tunisia",
  "code": "TUN"
}
```

### Suppliers, Products, Supplier Posts

`POST /api/suppliers`

```json
{
  "user_id": 10,
  "company_name": "Acme Supplies",
  "address": "Industrial Zone",
  "verified_at": "2026-04-12T10:00:00Z"
}
```

Note: for `supplier_admin`, `user_id` is forced to the authenticated user.

`PUT/PATCH /api/suppliers/{supplier}`

```json
{
  "user_id": 10,
  "company_name": "Acme Supplies Updated",
  "address": "Updated Address",
  "verified_at": "2026-04-13T10:00:00Z"
}
```

`POST /api/products`

```json
{
  "supplier_id": 1,
  "medication_id": 1,
  "qte": 100,
  "prix_achat": 5.5,
  "prix_vente": 8.0
}
```

Note: for `supplier_admin`, `supplier_id` is forced to the authenticated supplier profile.

`PUT/PATCH /api/products/{product}`

```json
{
  "supplier_id": 1,
  "medication_id": 2,
  "qte": 120,
  "prix_achat": 5.0,
  "prix_vente": 8.5
}
```

`POST /api/supplier-posts`

```json
{
  "supplier_id": 1,
  "product_id": 1,
  "title": "Weekend Promotion",
  "description": "Limited stock available",
  "image": "https://example.com/post.png",
  "qte_vente": 20
}
```

`PUT/PATCH /api/supplier-posts/{supplier_post}`

```json
{
  "supplier_id": 1,
  "product_id": 1,
  "title": "Updated Promotion",
  "description": "Updated details",
  "image": "https://example.com/post-updated.png",
  "qte_vente": 15
}
```

### Pharmacies and Inventories

`POST /api/pharmacies`

```json
{
  "owner_id": 25,
  "name": "City Pharmacy",
  "address": "123 Main Street",
  "city": "Oran",
  "latitude": 33.5898,
  "longitude": -7.6039,
  "registre_commerce_number": "RC-2001",
  "time_open": "08:00:00",
  "time_closes": "20:00:00",
  "verified_at": "2026-04-12T10:00:00Z"
}
```

Note: for `pharmacy_admin`, `owner_id` is forced to the authenticated user.

`PUT/PATCH /api/pharmacies/{pharmacy}`

```json
{
  "owner_id": 25,
  "name": "City Pharmacy Updated",
  "address": "456 Updated Street",
  "city": "Algiers",
  "latitude": 33.59,
  "longitude": -7.60,
  "registre_commerce_number": "RC-2001-NEW",
  "time_open": "09:00:00",
  "time_closes": "21:00:00",
  "verified_at": "2026-04-13T10:00:00Z"
}
```

`POST /api/inventories`

```json
{
  "pharmacy_id": 1,
  "medication_id": 1,
  "qte": 50,
  "prix_achat": 6.0,
  "prix_vente": 9.0
}
```

Note: for `pharmacy_admin`, `pharmacy_id` is forced to the authenticated pharmacy profile.

`PUT/PATCH /api/inventories/{inventory}`

```json
{
  "qte": 60,
  "prix_achat": 6.2,
  "prix_vente": 9.5
}
```

### Commandes

`POST /api/commandes`

```json
{
  "pharmacy_id": 1,
  "supplier_id": 1,
  "external_supplier_name": null,
  "status": "pending",
  "ordered_at": "2026-04-12T10:00:00Z",
  "confirmed_at": null,
  "notes": "Urgent order",
  "lines": [
    {
      "product_id": 1,
      "medication_name": "Paracetamol",
      "qte": 3,
      "unit_price": 8,
      "total": 24
    }
  ]
}
```

Note: provide either `supplier_id` or `external_supplier_name`.

`PUT/PATCH /api/commandes/{commande}`

```json
{
  "supplier_id": 1,
  "external_supplier_name": "External Supplier Name",
  "status": "processing",
  "ordered_at": "2026-04-12T10:00:00Z",
  "confirmed_at": "2026-04-12T12:00:00Z",
  "notes": "Updated notes",
  "lines": [
    {
      "product_id": 1,
      "medication_name": "Paracetamol",
      "qte": 5,
      "unit_price": 8,
      "total": 40
    }
  ]
}
```

`PATCH /api/commandes/{commande}/confirm`

No request body.

`PATCH /api/commandes/{commande}/refuse`

No request body.

### Factures

`POST /api/factures`

```json
{
  "commande_id": 1,
  "supplier_id": 1,
  "pharmacy_id": 1,
  "invoice_number": "FAC-0001",
  "status": "issued",
  "issued_at": "2026-04-12T10:00:00Z",
  "total_ht": 24,
  "total_ttc": 24,
  "lines": [
    {
      "product_id": 1,
      "medication_name": "Paracetamol",
      "qte": 3,
      "unit_price": 8,
      "total": 24
    }
  ]
}
```

Note: for `pharmacy_admin`, `pharmacy_id` is forced to the authenticated pharmacy profile.

`PUT/PATCH /api/factures/{facture}`

```json
{
  "supplier_id": 1,
  "status": "paid",
  "issued_at": "2026-04-13T10:00:00Z",
  "total_ht": 40,
  "total_ttc": 40,
  "lines": [
    {
      "product_id": 1,
      "medication_name": "Paracetamol",
      "qte": 5,
      "unit_price": 8,
      "total": 40
    }
  ]
}
```

### Medications

`POST /api/medications`

```json
{
  "name": "Paracetamol",
  "commercial_name": "Doliprane",
  "laboratory_id": 1,
  "therapeutic_class_id": 1,
  "pharmacological_class_id": 1,
  "pharmaceutical_form_id": 1,
  "country_id": 1,
  "dosage": "500mg",
  "conditioning": "Box of 10",
  "type": "brand",
  "list": "free",
  "marketed": true,
  "reimbursable": true,
  "registration_num": "REG-1000",
  "notice_link": "https://example.com/notice.pdf",
  "img_link": "https://example.com/img.png"
}
```

`PUT/PATCH /api/medications/{medication}`

```json
{
  "name": "Paracetamol Updated",
  "commercial_name": "Doliprane Forte",
  "laboratory_id": 1,
  "therapeutic_class_id": 1,
  "pharmacological_class_id": 1,
  "pharmaceutical_form_id": 1,
  "country_id": 1,
  "dosage": "650mg",
  "conditioning": "Box of 12",
  "type": "brand",
  "list": "free",
  "marketed": true,
  "reimbursable": false,
  "registration_num": "REG-1001",
  "notice_link": "https://example.com/notice-updated.pdf",
  "img_link": "https://example.com/img-updated.png"
}
```

`POST /api/medications/{medication}/active-ingredients`

```json
{
  "active_ingredient_id": 1,
  "strength": "500mg"
}
```

`PUT/PATCH /api/medications/{medication}/active-ingredients/{active_ingredient}`

```json
{
  "strength": "650mg"
}
```

### Notifications

`PATCH /api/notifications/{notification}/read`

No request body.

## Common Status Codes

- `200 OK`
- `201 Created`
- `204 No Content`
- `401 Unauthorized`
- `403 Forbidden`
- `422 Unprocessable Entity`
- `429 Too Many Requests`
