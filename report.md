# DawaDz Platform Report

## 1) Executive Summary
DawaDz is a full-stack pharmacy marketplace and medical request platform that connects patients, pharmacies, suppliers, and administrators. It combines operational dashboards, public discovery, real-time notifications, and role-based business workflows in one system.

The solution is built with a modern web/mobile frontend and a Laravel backend API, and it supports interactive map-based pharmacy discovery, medication request negotiation, inventory and ordering operations, approval workflows, and live event broadcasting.

## 2) Product Goals
- Make it easy for users to find pharmacies and request medications by city.
- Enable pharmacy owners to receive and accept requests quickly.
- Provide suppliers with tools to publish product offers and posts.
- Give admins strong control over approvals, catalogs, roles, and compliance.
- Keep users informed in real time through event-driven notifications.

## 3) User Roles and Responsibilities
### Admin
- Reviews and processes approval requests.
- Manages users, roles, lookup catalogs, and core platform entities.
- Oversees pharmacies, suppliers, products, medications, and linked data.

### Pharmacy Admin
- Creates and manages pharmacy profile (with ownership constraints).
- Receives medication requests for the pharmacy city.
- Accepts requests and serves users.
- Manages inventory, commandes, factures, and pharmacy operations.
- Uses map tools and navigation to reach selected pharmacy destinations.

### Supplier Admin
- Manages supplier profile and product offerings.
- Publishes supplier posts for marketplace visibility.
- Handles supplier-side order and business flows.

### Regular User
- Registers/logs in and maintains profile.
- Browses public pharmacy and medication data.
- Submits medication requests (with optional attachment image).
- Receives acceptance updates and can start navigation to accepted pharmacy.

## 4) End-to-End Feature Description
## 4.1 Authentication and Account Management
- Registration and login through backend auth endpoints.
- Token-based authentication with Laravel Sanctum.
- Profile retrieval through authenticated account APIs.
- Avatar upload and password change support.

## 4.2 Approval Workflow
- Users submit approval requests with documents and images.
- Admin reviews pending requests and accepts/rejects.
- Accepted approvals unlock role-based capabilities.
- File uploads are persisted and served securely through API file routes.

## 4.3 Pharmacy Discovery and Map Experience
- Public and authenticated pharmacy search endpoints.
- Nearby pharmacy lookup with location parameters.
- Interactive map UI with selected pharmacy focus.
- Route rendering and travel estimates.
- In-app navigation mode with automatic route guidance behavior.
- Follow-user camera behavior for mobile navigation scenarios.

## 4.4 Medication Request Lifecycle
- User submits medication request for a target city.
- Request is broadcast to pharmacy listeners by city channel.
- Pharmacy admin receives request in notification bell and request views.
- Pharmacy admin accepts request from the interface.
- User receives acceptance notification and can auto-start navigation.
- Cancellations propagate through the same notification model.

## 4.5 Marketplace and Supply Chain Operations
- Supplier posts and product publishing for pharmacy discovery.
- Inventory management for pharmacy-side stock control.
- Commande management for procurement workflows.
- Facture management for financial/transaction records.

## 4.6 Admin Management Consoles
- User and role administration.
- Catalog master data management:
  - Laboratories
  - Therapeutic classes
  - Pharmacological classes
  - Active ingredients
  - Pharmaceutical forms
  - Countries
- Monitoring and moderation of platform resources.

## 4.7 Notifications and Real-Time UX
- Real-time notifications for incoming requests and request status changes.
- Channel-based broadcasting for city-scoped pharmacy updates.
- User-scoped request status channels for acceptance events.
- Fallback synchronization from notification APIs for resilience when websocket connectivity is unstable.

## 5) Event-Driven Architecture
This platform uses an Event-Driven Architecture to decouple user actions from downstream side effects and real-time delivery.

### Core Event Principles Used
- Producers emit domain events when important business actions occur.
- Consumers react asynchronously through channels and listeners.
- Event payloads carry minimal but sufficient context.
- UI components subscribe to relevant event streams and update state incrementally.

### Key Domain Events in the System
- MedicationRequested
  - Triggered when a user sends a medication request.
  - Broadcast on city-scoped pharmacy channels.
- RequestAccepted
  - Triggered when a pharmacy accepts a request.
  - Broadcast to user-scoped notification channels.
- RequestCanceled
  - Triggered when user cancels pending request.
  - Broadcast back to city-scoped pharmacy channels.

### Event-Driven Benefits Achieved
- Near real-time request visibility for pharmacies.
- Faster user feedback loop after acceptance.
- Reduced tight coupling between modules.
- Better extensibility for future listeners (analytics, auditing, automations).
- Improved user experience through reactive UI updates.

## 6) Technical Architecture
## 6.1 Frontend
- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: React 19, Tailwind CSS, Radix-based component primitives
- Maps: Leaflet + React Leaflet
- Realtime client: Laravel Echo + Pusher JS protocol adapter (for Reverb)
- Mobile bridge: Capacitor (Android/iOS support)
- HTTP client: Axios with project-specific API wrappers

### Frontend Runtime Design
- Route-level middleware for access flow.
- Proxy paths for backend and realtime services in web deployment.
- Componentized dashboard and role-specific interfaces.
- Hook-driven state management for requests and notifications.

## 6.2 Backend
- Framework: Laravel 12
- Language: PHP 8.2+
- Authentication: Laravel Sanctum
- Roles/Permissions: Spatie Laravel Permission
- Realtime broadcasting: Laravel Reverb
- ORM and data layer: Eloquent + migrations
- API style: RESTful JSON endpoints

### Backend Runtime Design
- Role-aware controllers and ownership guards.
- Throttling policies for auth, search, and write endpoints.
- File storage and file-serving routes for uploads.
- Event classes for broadcast domain actions.

## 6.3 Data and Domain Model Highlights
Primary entities include:
- User
- Pharmacy
- Supplier
- Medication
- Product
- Inventory
- SupplierPost
- Commande
- Facture
- ApprovalRequest
- UserNotification

These entities support both public discovery and authenticated operational workflows.

## 7) API and Integration Approach
- Public endpoints for discovery and onboarding.
- Authenticated endpoints for account, workflows, and operations.
- Role-scoped endpoints for admin, pharmacy_admin, supplier_admin.
- File endpoints for uploaded artifacts.
- Broadcast channels for real-time event delivery.

The frontend consumes APIs through proxy paths to simplify deployment and free-plan tunneling constraints.

## 8) Reliability and Operational Notes
- Notification hooks include fallback polling to prevent missed updates if realtime transport is temporarily degraded.
- Request state is synchronized with notification history APIs.
- City-scoped channel naming and event compatibility handling reduce subscriber mismatches.
- Geolocation support includes browser/mobile considerations and permission handling.

## 9) Security and Access Control
- Bearer token authentication (Sanctum).
- Role-based authorization and owner-scoped data checks.
- Route-level protection in frontend middleware.
- Controlled file serving with explicit allowed paths.

## 10) Deployment and Runtime Topology
Typical local/dev topology:
- Frontend app server on localhost:3002
- Backend API server on localhost:8001
- Reverb websocket server on localhost:8080

Public exposure uses ngrok free-plan single frontend tunnel plus proxy paths:
- Frontend root on public ngrok URL
- Backend through /proxy-api
- Reverb through /proxy-reverb

## 11) Business Value Delivered
- Faster medication discovery and response cycles.
- Better pharmacy-user communication loop.
- Structured supplier-pharmacy commerce workflows.
- Strong administrative control and governance.
- Real-time, event-driven UX with practical resilience strategies.

## 12) Conclusion
DawaDz is an end-to-end digital platform for pharmacy operations and medication request fulfillment. It combines robust role-based business workflows with map-driven discovery and real-time updates.

Most importantly, the system is explicitly built around Event-Driven Architecture, enabling responsive user experiences, cleaner separation of responsibilities, and scalable future integration points across notification, analytics, and workflow automation domains.
