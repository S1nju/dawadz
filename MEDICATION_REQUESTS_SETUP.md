# Medication Requests Setup Guide

## What Was Fixed/Implemented

### 1. Backend Database Issue
**Problem:** `Database file at path [test] does not exist`

**Solution:** Updated `.env` to use absolute path:
```
DB_DATABASE=/home/amine/Desktop/projects/hackathon/hackathons-boilerplate/backend/boilerplate/database/database.sqlite
```

Also changed cache store from `database` to `file` to avoid cache errors during Reverb startup.

### 2. Frontend Implementation

Created three key files:

#### `hooks/use-echo.ts`
- Initializes Laravel Echo with Reverb connection
- Uses environment variables from `.env.local`
- Single instance shared across the app

#### `hooks/use-medication-requests.ts`
- Hook to manage medication requests
- Listens for real-time events via Echo
- Provides `sendRequest()` and `acceptRequest()` methods
- Syncs incoming requests in real-time

#### `components/MedicationRequests.tsx`
- UI component for medication request management
- Supports three modes: 'send', 'receive', or 'both'
- Displays pending and accepted requests with real-time updates

#### `.env.local`
- Frontend environment variables for Reverb connection
- Uses local development settings

## How to Use

### 1. Start the Backend

```bash
cd backend/boilerplate

# Run migrations (if needed)
php artisan migrate

# Start Reverb server
php artisan reverb:start
```

### 2. Start the Frontend

```bash
cd frontend

npm run dev
# or
yarn dev
```

### 3. Use in Your Components

#### Send Requests Mode (Pharmacies requesting medications):
```tsx
import { MedicationRequestsView } from '@/components/MedicationRequests'

export default function SupplierProvidePage() {
  return (
    <div>
      <MedicationRequestsView mode="receive" />
    </div>
  )
}
```

#### Receive Requests Mode (Suppliers handling requests):
```tsx
<MedicationRequestsView mode="receive" />
```

#### Show Both:
```tsx
<MedicationRequestsView mode="both" />
```

### 4. Hook Usage for Custom Implementation

```tsx
import { useMedicationRequests } from '@/hooks/use-medication-requests'

function CustomComponent() {
  const { requests, sendRequest, acceptRequest, loading, error } = 
    useMedicationRequests()

  const handleSend = async () => {
    try {
      await sendRequest(medicationId, quantity)
    } catch (err) {
      console.error('Failed:', err)
    }
  }

  return (
    // Your custom JSX
  )
}
```

## Real-Time Events

The system listens for Laravel Reverb events:

- **MedicationRequestSent**: Triggered when a new request is sent
  ```php
  broadcast(new MedicationRequestSent($request))
  ```

- **MedicationRequestAccepted**: Triggered when a request is accepted
  ```php
  broadcast(new MedicationRequestAccepted($request))
  ```

## Backend Routes (Already Implemented)

```php
Route::post('medication-requests', [MedicationRequestController::class, 'sendRequest']);
Route::post('accepte-request', [MedicationRequestController::class, 'acceptRequest']);
```

## Troubleshooting

### Reverb won't start
- Ensure database path is correct in `.env`
- Check Laravel cache is writable: `chmod -R 777 storage/`

### No real-time updates
- Verify Reverb is running: `php artisan reverb:start`
- Check browser console for Echo connection errors
- Verify environment variables in `.env.local` match backend

### CORS/Connection Issues
- If frontend is on different port, ensure Laravel CORS is configured
- Check `config/cors.php` allows your frontend URL

## Environment Variables Reference

### Backend (.env)
```
REVERB_APP_ID=900861
REVERB_APP_KEY=u8dqlttcafh83u2gqg7c
REVERB_APP_SECRET=eylzqvgxaoedqrjptpl2
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

### Frontend (.env.local)
```
NEXT_PUBLIC_REVERB_APP_KEY=u8dqlttcafh83u2gqg7c
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```
