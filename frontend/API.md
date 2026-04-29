# API Documentation

This backend is a Laravel JSON API for a pharmacy marketplace with three main actor types:

- `admin`
- `supplier_admin`
- `pharmacy_admin`

Regular authenticated users can create approval requests and read public discovery data. They cannot create medication catalogs or manage platform entities.

## Base URL

All endpoints are prefixed with `/api`.

## Route Catalog

### Public routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/` | API health check |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a Sanctum token |
| `GET` | `/api/files/{path}` | Serve public file assets |
| `GET` | `/api/pharmacies/nearby` | Search nearby pharmacies |
| `GET` | `/api/pharmacies` | List public pharmacies |
| `GET` | `/api/pharmacies/{pharmacy}` | Show a public pharmacy profile |
| `GET` | `/api/medications` | List public medications |
| `GET` | `/api/medications/{medication}` | Show a public medication |

### Authenticated account routes

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/logout` | Invalidate the current token |
| `GET` | `/api/auth/me` | Return the authenticated user |
| `POST` | `/api/auth/avatar` | Upload or update the user avatar |
| `POST` | `/api/auth/change-password` | Change the current password |

### Approval request routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/approval-requests` | List approval requests |
| `POST` | `/api/approval-requests` | Create a new approval request |
| `GET` | `/api/approval-requests/{approval_request}` | Show a single approval request |
| `PUT` | `/api/approval-requests/{approval_request}` | Update a pending approval request |
| `PATCH` | `/api/approval-requests/{approval_request}` | Update a pending approval request |
| `PATCH` | `/api/approval-requests/{approval_request}/status` | Accept or reject a request as admin |
| `DELETE` | `/api/approval-requests/{approval_request}` | Delete an approval request as admin |

### Notification routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/notifications` | List user notifications |
| `GET` | `/api/notifications/{notification}` | Show a notification |
| `DELETE` | `/api/notifications/{notification}` | Delete a notification |
| `PATCH` | `/api/notifications/{notification}/read` | Mark a notification as read |

### Admin lookup routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/laboratories` | List laboratories |
| `POST` | `/api/laboratories` | Create a laboratory |
| `GET` | `/api/laboratories/{laboratory}` | Show a laboratory |
| `PUT` | `/api/laboratories/{laboratory}` | Update a laboratory |
| `PATCH` | `/api/laboratories/{laboratory}` | Update a laboratory |
| `DELETE` | `/api/laboratories/{laboratory}` | Delete a laboratory |
| `GET` | `/api/therapeutic-classes` | List therapeutic classes |
| `POST` | `/api/therapeutic-classes` | Create a therapeutic class |
| `GET` | `/api/therapeutic-classes/{therapeutic_class}` | Show a therapeutic class |
| `PUT` | `/api/therapeutic-classes/{therapeutic_class}` | Update a therapeutic class |
| `PATCH` | `/api/therapeutic-classes/{therapeutic_class}` | Update a therapeutic class |
| `DELETE` | `/api/therapeutic-classes/{therapeutic_class}` | Delete a therapeutic class |
| `GET` | `/api/pharmacological-classes` | List pharmacological classes |
| `POST` | `/api/pharmacological-classes` | Create a pharmacological class |
| `GET` | `/api/pharmacological-classes/{pharmacological_class}` | Show a pharmacological class |
| `PUT` | `/api/pharmacological-classes/{pharmacological_class}` | Update a pharmacological class |
| `PATCH` | `/api/pharmacological-classes/{pharmacological_class}` | Update a pharmacological class |
| `DELETE` | `/api/pharmacological-classes/{pharmacological_class}` | Delete a pharmacological class |
| `GET` | `/api/active-ingredients` | List active ingredients |
| `POST` | `/api/active-ingredients` | Create an active ingredient |
| `GET` | `/api/active-ingredients/{active_ingredient}` | Show an active ingredient |
| `PUT` | `/api/active-ingredients/{active_ingredient}` | Update an active ingredient |
| `PATCH` | `/api/active-ingredients/{active_ingredient}` | Update an active ingredient |
| `DELETE` | `/api/active-ingredients/{active_ingredient}` | Delete an active ingredient |
| `GET` | `/api/pharmaceutical-forms` | List pharmaceutical forms |
| `POST` | `/api/pharmaceutical-forms` | Create a pharmaceutical form |
| `GET` | `/api/pharmaceutical-forms/{pharmaceutical_form}` | Show a pharmaceutical form |
| `PUT` | `/api/pharmaceutical-forms/{pharmaceutical_form}` | Update a pharmaceutical form |
| `PATCH` | `/api/pharmaceutical-forms/{pharmaceutical_form}` | Update a pharmaceutical form |
| `DELETE` | `/api/pharmaceutical-forms/{pharmaceutical_form}` | Delete a pharmaceutical form |
| `GET` | `/api/countries` | List countries |
| `POST` | `/api/countries` | Create a country |
| `GET` | `/api/countries/{country}` | Show a country |
| `PUT` | `/api/countries/{country}` | Update a country |
| `PATCH` | `/api/countries/{country}` | Update a country |
| `DELETE` | `/api/countries/{country}` | Delete a country |

### Supplier and marketplace routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/suppliers` | List suppliers |
| `POST` | `/api/suppliers` | Create a supplier |
| `GET` | `/api/suppliers/{supplier}` | Show a supplier |
| `PUT` | `/api/suppliers/{supplier}` | Update a supplier |
| `PATCH` | `/api/suppliers/{supplier}` | Update a supplier |
| `DELETE` | `/api/suppliers/{supplier}` | Delete a supplier |
| `GET` | `/api/products` | List products |
| `POST` | `/api/products` | Create a product |
| `GET` | `/api/products/{product}` | Show a product |
| `PUT` | `/api/products/{product}` | Update a product |
| `PATCH` | `/api/products/{product}` | Update a product |
| `DELETE` | `/api/products/{product}` | Delete a product |
| `GET` | `/api/supplier-posts` | List supplier posts for pharmacy admins |
| `GET` | `/api/supplier-posts/{supplier_post}` | Show a supplier post for pharmacy admins |
| `POST` | `/api/supplier-posts` | Create a supplier post |
| `PUT` | `/api/supplier-posts/{supplier_post}` | Update a supplier post |
| `PATCH` | `/api/supplier-posts/{supplier_post}` | Update a supplier post |
| `DELETE` | `/api/supplier-posts/{supplier_post}` | Delete a supplier post |

### Pharmacy routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/pharmacies` | List public pharmacies |
| `GET` | `/api/pharmacies/{pharmacy}` | Show a public pharmacy |
| `POST` | `/api/pharmacies` | Create a pharmacy |
| `PUT` | `/api/pharmacies/{pharmacy}` | Update a pharmacy |
| `PATCH` | `/api/pharmacies/{pharmacy}` | Update a pharmacy |
| `DELETE` | `/api/pharmacies/{pharmacy}` | Delete a pharmacy |
| `GET` | `/api/inventories` | List inventories |
| `POST` | `/api/inventories` | Create an inventory line |
| `GET` | `/api/inventories/{inventory}` | Show an inventory line |
| `PUT` | `/api/inventories/{inventory}` | Update an inventory line |
| `PATCH` | `/api/inventories/{inventory}` | Update an inventory line |
| `DELETE` | `/api/inventories/{inventory}` | Delete an inventory line |
| `GET` | `/api/commandes` | List commandes |
| `POST` | `/api/commandes` | Create a commande |
| `GET` | `/api/commandes/{commande}` | Show a commande |
| `PUT` | `/api/commandes/{commande}` | Update a commande |
| `PATCH` | `/api/commandes/{commande}` | Update a commande |
| `DELETE` | `/api/commandes/{commande}` | Delete a commande |
| `PATCH` | `/api/commandes/{commande}/confirm` | Confirm a commande as supplier admin or admin |
| `GET` | `/api/factures` | List factures |
| `POST` | `/api/factures` | Create a facture |
| `GET` | `/api/factures/{facture}` | Show a facture |
| `PUT` | `/api/factures/{facture}` | Update a facture |
| `PATCH` | `/api/factures/{facture}` | Update a facture |
| `DELETE` | `/api/factures/{facture}` | Delete a facture |

### Nested medication ingredient routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/medications/{medication}/active-ingredients` | List a medication's ingredients |
| `POST` | `/api/medications/{medication}/active-ingredients` | Attach an ingredient |
| `GET` | `/api/medications/{medication}/active-ingredients/{active_ingredient}` | Show a medication ingredient link |
| `PUT` | `/api/medications/{medication}/active-ingredients/{active_ingredient}` | Update a medication ingredient link |
| `PATCH` | `/api/medications/{medication}/active-ingredients/{active_ingredient}` | Update a medication ingredient link |
| `DELETE` | `/api/medications/{medication}/active-ingredients/{active_ingredient}` | Detach an ingredient |

### Medication routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/medications` | List public medications |
| `GET` | `/api/medications/{medication}` | Show a public medication |
| `POST` | `/api/medications` | Create a medication |
| `PUT` | `/api/medications/{medication}` | Update a medication |
| `PATCH` | `/api/medications/{medication}` | Update a medication |
| `DELETE` | `/api/medications/{medication}` | Delete a medication |

## Route Notes

- Public read routes are throttled with `public-search`.
- Auth endpoints use `auth` and authenticated writes use `api-write`.
- Standard `apiResource` routes follow Laravel REST conventions.
- Pharmacy admin access is required for the marketplace feed routes.
- Supplier and pharmacy ownership is enforced inside the controllers.

## Authentication

Authentication uses Laravel Sanctum bearer tokens.

### Login

`POST /api/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "plain-text-token",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "User Name"
  }
}
```

### Register

`POST /api/auth/register`

Request:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

### Authenticated account routes

- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/avatar`
- `POST /api/auth/change-password`

Send the token in the header:

```http
Authorization: Bearer <token>
```

## Rate Limiting

The API uses named throttles:

- `auth`: login/register endpoints
- `public-search`: public discovery endpoints
- `api`: authenticated read traffic
- `api-write`: authenticated mutating traffic

## Roles and Access Rules

### admin

Can manage:

- approval requests review/status
- laboratories
- therapeutic classes
- pharmacological classes
- active ingredients
- pharmaceutical forms
- countries
- suppliers
- pharmacies
- products
- medications
- medication active ingredients

### supplier_admin

Can manage:

- supplier profile
- products
- supplier posts
- medications they created
- confirmation of commandes assigned to their supplier

### pharmacy_admin

Can manage:

- pharmacy profile
- inventories
- commandes
- factures
- marketplace feed visibility (`supplier-posts` index/show)
- medications they created

### user

Can:

- read public medications and pharmacies
- create and inspect own approval requests

## Public Discovery Endpoints

These are available without authentication, with `public-search` throttling.

### Pharmacies nearby

`GET /api/pharmacies/nearby`

Query parameters:

- `latitude` required
- `longitude` required
- `radius_km` optional, default `10`
- `medication_id` optional
- `medication_name` optional

### Public pharmacies

- `GET /api/pharmacies`
- `GET /api/pharmacies/{pharmacy}`

### Public medications

- `GET /api/medications`
- `GET /api/medications/{medication}`

## Approval Requests

`/api/approval-requests`

Accessible to authenticated users.

### Actions

- `GET /api/approval-requests` - list own requests, admin sees all
- `POST /api/approval-requests` - create request
- `GET /api/approval-requests/{approval_request}` - show request
- `PUT/PATCH /api/approval-requests/{approval_request}` - update pending request
- `PATCH /api/approval-requests/{approval_request}/status` - admin only
- `DELETE /api/approval-requests/{approval_request}` - admin only

### Create request body

```json
{
  "type": "pharmacy",
  "documents": ["license.pdf"],
  "images": ["storefront.png"]
}
```

Accepted `type` values:

- `pharmacy`
- `supplier`

Accepted `status` values:

- `pending`
- `accepted`
- `rejected`

### Approval side effects

When an admin accepts a request:

- `supplier` request creates/updates a supplier profile and assigns `supplier_admin`
- `pharmacy` request creates/updates a pharmacy profile and assigns `pharmacy_admin`

## Notifications

`/api/notifications`

Authenticated users can:

- `GET /api/notifications`
- `GET /api/notifications/{notification}`
- `DELETE /api/notifications/{notification}`
- `PATCH /api/notifications/{notification}/read`

## Platform Lookup Models

Admin-only CRUD:

- `GET/POST /api/laboratories`
- `GET/PUT/PATCH/DELETE /api/laboratories/{laboratory}`
- `GET/POST /api/therapeutic-classes`
- `GET/PUT/PATCH/DELETE /api/therapeutic-classes/{therapeutic_class}`
- `GET/POST /api/pharmacological-classes`
- `GET/PUT/PATCH/DELETE /api/pharmacological-classes/{pharmacological_class}`
- `GET/POST /api/active-ingredients`
- `GET/PUT/PATCH/DELETE /api/active-ingredients/{active_ingredient}`
- `GET/POST /api/pharmaceutical-forms`
- `GET/PUT/PATCH/DELETE /api/pharmaceutical-forms/{pharmaceutical_form}`
- `GET/POST /api/countries`
- `GET/PUT/PATCH/DELETE /api/countries/{country}`

### Lookup payload examples

Laboratory:

```json
{
  "name": "Central Lab",
  "country": "MA"
}
```

Active ingredient:

```json
{
  "dci": "Paracetamol",
  "dci_code": "N02BE01"
}
```

## Medication Catalog

`/api/medications`

Accessible publicly for read, and writable only for `admin`, `supplier_admin`, and `pharmacy_admin`.

### Actions

- `GET /api/medications`
- `GET /api/medications/{medication}`
- `POST /api/medications`
- `PUT/PATCH /api/medications/{medication}`
- `DELETE /api/medications/{medication}`

### Fields

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
  "reference_price": 10,
  "ppa_indicative": 8,
  "marketed": true,
  "reimbursable": true,
  "registration_num": "REG-1000",
  "notice_link": "https://example.com/notice.pdf",
  "img_link": "https://example.com/img.png"
}
```

Accepted `type` values:

- `generic`
- `brand`
- `biosimilar`
- `herbal`

Accepted `list` values:

- `list_i`
- `list_ii`
- `list_iii`
- `free`

### Medication active ingredients

Nested under a medication:

- `GET /api/medications/{medication}/active-ingredients`
- `POST /api/medications/{medication}/active-ingredients`
- `GET /api/medications/{medication}/active-ingredients/{active_ingredient}`
- `PUT/PATCH /api/medications/{medication}/active-ingredients/{active_ingredient}`
- `DELETE /api/medications/{medication}/active-ingredients/{active_ingredient}`

Payload:

```json
{
  "active_ingredient_id": 1,
  "strength": "500mg"
}
```

## Supplier Profiles and Marketplace

### Suppliers

`/api/suppliers`

- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/suppliers/{supplier}`
- `PUT/PATCH /api/suppliers/{supplier}`
- `DELETE /api/suppliers/{supplier}`

### Products

`/api/products`

Supplier and admin access.

Payload:

```json
{
  "supplier_id": 1,
  "medication_id": 1,
  "qte": 10,
  "prix_achat": 5,
  "prix_vente": 8
}
```

### Supplier posts

`/api/supplier-posts`

- `GET /api/supplier-posts` - pharmacy admin feed
- `GET /api/supplier-posts/{supplier_post}` - pharmacy admin feed
- `POST /api/supplier-posts` - supplier admin/admin
- `PUT/PATCH /api/supplier-posts/{supplier_post}` - supplier admin/admin
- `DELETE /api/supplier-posts/{supplier_post}` - supplier admin/admin

Payload:

```json
{
  "supplier_id": 1,
  "product_id": 1,
  "title": "New stock available",
  "description": "Limited offer",
  "image": "https://example.com/post.png",
  "qte_vente": 4
}
```

## Pharmacy Operations

### Pharmacies

`/api/pharmacies`

- `GET /api/pharmacies` - public
- `GET /api/pharmacies/{pharmacy}` - public
- `POST /api/pharmacies` - authenticated pharmacy/admin
- `PUT/PATCH /api/pharmacies/{pharmacy}` - authenticated pharmacy/admin
- `DELETE /api/pharmacies/{pharmacy}` - authenticated pharmacy/admin

### Inventory

`/api/inventories`

- `GET /api/inventories`
- `POST /api/inventories`
- `GET /api/inventories/{inventory}`
- `PUT/PATCH /api/inventories/{inventory}`
- `DELETE /api/inventories/{inventory}`

Payload:

```json
{
  "pharmacy_id": 1,
  "medication_id": 1,
  "qte": 12,
  "prix_achat": 6,
  "prix_vente": 9
}
```

Pharmacy admins only see and manage their own inventory.

## Commandes

`/api/commandes`

- `GET /api/commandes`
- `POST /api/commandes`
- `GET /api/commandes/{commande}`
- `PUT/PATCH /api/commandes/{commande}`
- `DELETE /api/commandes/{commande}`
- `PATCH /api/commandes/{commande}/confirm`

Payload:

```json
{
  "supplier_id": 1,
  "external_supplier_name": null,
  "notes": "Urgent",
  "lines": [
    {
      "product_id": 1,
      "medication_name": "Paracetamol",
      "qte": 3,
      "unit_price": 8
    }
  ]
}
```

Notes:

- command lines are embedded in the parent request payload
- pharmacy admins only see their own commandes
- supplier admins confirm commandes assigned to their supplier

## Factures

`/api/factures`

- `GET /api/factures`
- `POST /api/factures`
- `GET /api/factures/{facture}`
- `PUT/PATCH /api/factures/{facture}`
- `DELETE /api/factures/{facture}`

Payload:

```json
{
  "commande_id": 1,
  "supplier_id": 1,
  "lines": [
    {
      "product_id": 1,
      "medication_name": "Paracetamol",
      "qte": 3,
      "unit_price": 8
    }
  ]
}
```

Notes:

- facture lines are embedded in the parent request payload
- pharmacy admins only see their own factures
- totals are computed from line items when not provided

## Response Conventions

- Successful create: `201 Created`
- Successful update: `200 OK`
- Successful delete: `204 No Content`
- Forbidden access: `403 Forbidden`
- Validation error: `422 Unprocessable Entity`
- Rate limit hit: `429 Too Many Requests`

## Testing

Dedicated API tests exist under `tests/Feature/Api` for:

- auth and approval requests
- role access and visibility
- lookup CRUD
- medication CRUD
- marketplace behavior
- notifications
- throttling
- commandes and factures with embedded lines
