# ArchiDiagram Project Context & Architecture

This file serves as a memory bank for the Antigravity agent. It contains architectural decisions, tech stack details, and recent feature implementations.

## Tech Stack
- Frontend: React (Vite), TypeScript.
- State Management: Zustand (`src/store/useEditorStore.ts`).
- Backend/Database: Supabase (Auth, PostgreSQL, Edge Functions).
- Payment Processing: Lemon Squeezy.

## Core Components
- `Studio.tsx`: The main workhorse component. It manages the 3D environment, the UI overlay, and global modals (Profile, Auth, custom alerts).
- `AuthModal.tsx`: Handles user authentication via Supabase Auth and triggers Lemon Squeezy checkout popups using `window.LemonSqueezy.Setup`.
- `useEditorStore.ts`: Global state container. Holds critical session data (`user`, `isPro`, `customerPortalUrl`, `renewsAt`) and UI state (`customAlert`).

## Lemon Squeezy Integration (Billing & Subscriptions)
- **Frontend Flow**: When a user clicks "Upgrade", the Lemon Squeezy checkout is triggered in an iframe overlay. Upon `Checkout.Success`, the store optimistically updates `isPro = true` and shows a custom success alert.
- **Backend Flow (Webhook)**: 
  - An Edge Function (`supabase/functions/lemon-webhook`) listens for Lemon Squeezy events (`subscription_created`, `subscription_updated`, `subscription_expired`).
  - It uses a secure HMAC SHA-256 signature verification.
  - Upon receiving an event, it extracts `urls.customer_portal` and `renews_at` and updates the user's row in the `profiles` table using the `supabaseAdmin` client (bypassing RLS).
- **Database Schema**: The `public.profiles` table contains:
  - `id` (uuid, references `auth.users`)
  - `is_pro` (boolean)
  - `subscription_id` (text)
  - `subscription_status` (text)
  - `customer_portal_url` (text)
  - `renews_at` (timestamp with time zone)
- **Profile Modal UI**: The Profile Modal dynamically reads `isPro`, `renewsAt`, and `customerPortalUrl` from Zustand. The "Manage Billing" button directly opens the `customerPortalUrl` if available, otherwise it shows a fallback custom alert.

## Design Principles & UI Guidelines
- **Modern UI**: Avoid native browser elements like `alert()` or `confirm()`. Always use custom modals with consistent styling (glassmorphism, gradient buttons, rounded corners).
- **Color Palette**: Pro features often use a `#f59e0b` to `#d97706` gradient (orange/gold). The main brand logo is `LOGO_FEBHOUSE1.svg`.
- **UX Strategy**: "Less is More". Keep the interface clean. Consolidate account info into a single Profile Modal rather than cluttering the top bar.

## Deployment & Infrastructure
- **Hosting**: The project is entirely hosted on **Cloudflare Pages** (Vercel is no longer used).
- **Package Manager**: Strict use of `pnpm`. `package-lock.json` must NOT be generated or committed.
- **Repository**: Hosted on GitHub. Automated deployments are handled by Cloudflare Pages directly pulling from GitHub.
