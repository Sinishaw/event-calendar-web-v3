# Project Context — Calendar Platform Web V3

This file is a workspace **Rule**: always-on context for every agent session in this repository. It provides a concise description of the project structure, features, integrations, and architectural flows.

---

## 1. Project Overview & Purpose

- **Project Name:** `calendar-platform-web-v3`
- **Purpose:** A multi-tenant event calendar platform management console. It serves as a dashboard for organization administrators (tenants) to manage organization profiles, custom calendar content, monthly Ethiopian calendar covers, and terms & policies. It also allows system administrators (Super Admins) to manage tenant registration, user accounts, and global settings.
- **Client Impact:** Configured settings, themes, and content are synchronized directly to Firebase Remote Config, Firestore, and Cloud Storage, which serve as the backend data sources for the companion mobile applications.

---

## 2. Directory & File Structure

```
├── .agents/                    # Agent-specific configurations and rules
│   └── rules/
│       ├── constitution.md     # Project development pipeline and guidelines
│       └── project-context.md  # [Active] Workspace architecture & module summary
├── app/                        # Next.js App Router (pages and API endpoints)
│   ├── api/                    # Server-side API endpoints for dashboard actions
│   │   ├── admin/              # User account provisioning APIs
│   │   ├── auth/               # Session login/logout cookie helpers
│   │   ├── company/            # Organization management APIs
│   │   ├── content/            # Event calendar content creation & notification APIs
│   │   ├── month-images/       # Ethiopian month cover asset APIs
│   │   ├── terms/              # Terms & policies versioning APIs
│   │   └── topics/             # Global topics management APIs
│   ├── dashboard/              # Protected dashboard user interfaces
│   │   ├── admin/              # Super Admin user management view
│   │   ├── company/            # Organization profile editor
│   │   ├── content/            # Calendar event editor and FCM sender UI
│   │   ├── month-images/       # Month images uploader and publisher UI
│   │   └── terms/              # Terms & policies version manager
│   ├── login/                  # Authentication page
│   ├── reset-password/         # Password reset request flow
│   ├── globals.css             # Global Tailwind/CSS style imports
│   ├── layout.tsx              # Root HTML wrapper
│   └── page.tsx                # Application root redirect landing page
├── components/                 # Reusable React layout components
│   └── layout/                 # Sidebar and Topbar panels with CSS modules
├── lib/                        # Core SDK client/admin initializations and utilities
│   ├── auth.ts                 # Server-side verifySession & cookie utilities
│   ├── firebase-admin.ts       # Server-side Firebase Admin SDK initialization
│   ├── firebase-client.ts      # Client-side Firebase SDK initialization
│   └── upload.ts               # Google Cloud Storage file upload utility
├── scripts/                    # Maintenance & data migration helper scripts
├── services/                   # Backend services layers interacting with Firebase APIs
│   ├── admin.service.ts        # System user creation, deletion, and Custom Claims
│   ├── company.service.ts      # Firestore-backed company profile CRUD
│   ├── content.service.ts      # Firestore subcollection events CRUD & FCM messaging
│   ├── remote-config.service.ts# Multi-tenant theme configurations & global Remote Config parameters
│   ├── terms.service.ts        # Policies version control & Remote Config synchronization
│   ├── topic-content.service.ts# Topic-specific event CRUD & notification FCM messaging
│   └── month-image.service.ts  # Ethiopian month image collections & Remote Config publication
├── types/                      # Shared TypeScript interface type definitions
└── package.json                # Project dependencies and script runner configurations
```

---

## 3. Modules & Features

### 3.1 Authentication & Session Management
- Logs in users via client-side Firebase Auth, then posts ID tokens to `/api/auth/session-login` to mint a secure, HTTP-only session cookie (max age 1 day).
- Server routes verify session validity using the Admin SDK.

### 3.2 Company Management
- Allows creation, modification, approval, and soft deletion of organization tenants.
- Synchronizes updated company profile details automatically into their corresponding Firebase Remote Config parameters.

### 3.3 Content Management & FCM Notifications
- Manages calendar events categorized by organization or custom subscription topics.
- Events progress through a lifecycle: `Draft` (st=0) ➔ `Approved` (st=1) ➔ `Deleted` (st=2).
- Approved events can be broadcast to mobile clients via Firebase Cloud Messaging (FCM) topic subscriptions.

### 3.4 Month Image Collections
- Manages 13 distinct monthly calendar cover images mapped directly to Ethiopian Calendar months (e.g., Meskerem, Tikimt, Pagumen).
- Allows drafts, approvals, and publishes the active set of image URLs directly to the company's Remote Config key (`monthImages`).

### 3.5 Terms & Policies
- Version-controlled documents for either global system-wide (`general`) or company-specific usage.
- Once approved, terms are compiled and synced to Remote Config.

---

## 4. Key Technologies, Integrations & Data Flows

### 4.1 Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** Cloud Firestore (Structured as `/Companies/{companyId}` and subcollections `/Contents`, `/MonthImages`, `/TermsAndPolicies`, and `/Topics/{topicId}/Contents`)
- **Authentication:** Firebase Auth & server-side Session Cookies
- **Configuration & Themes:** Firebase Remote Config (Multi-tenant schema, where each company has a dedicated JSON parameter and globals like `Topics`, `Languages`, `General`, `ContentCategory` exist)
- **Asset Storage:** Firebase Storage (via Google Cloud Storage bucket)
- **Push Messages:** Firebase Cloud Messaging (FCM) topic-based notifications

### 4.2 Data Flows
1. **Event Notification Flow:**
   ```
   Admin UI ➔ Content Service ➔ Firestore (save) ➔ Approve ➔ FCM (Send to Topic) ➔ Mobile App Clients
   ```
2. **Theme Configuration Sync Flow:**
   ```
   Admin UI ➔ Remote Config Service ➔ Fetch Template ➔ Merge Company JSON ➔ Validate Template ➔ Publish Template ➔ Mobile App Clients
   ```

---

## 5. Actors & Roles

- **Super Admin:**
  - Complete control over all features.
  - Manages system users and assigns Roles/Custom Claims (`superAdmin`, `admin`, `creater`, `publisher`, `company`).
  - Creates, approves, and deletes Company accounts.
  - Manages global topics, subscription settings, content categories, and system-wide terms (`general`).
- **Tenant Admin (Company Admin):**
  - Manages their own Company Profile.
  - Assigns and manages users belonging to their company.
- **Publisher:**
  - Has read/write access to company contents, month images, and terms.
  - Approves and publishes draft items to Remote Config / FCM.
- **Creator:**
  - Can create and update draft contents, month images, and terms.
  - Cannot approve or publish content to live environments.
- **Mobile Client Apps (End Users):**
  - Read configuration from Remote Config (theme colors, logo, month images, terms).
  - Subscribe to FCM topics (by company or general topics) to receive real-time push calendar updates.
