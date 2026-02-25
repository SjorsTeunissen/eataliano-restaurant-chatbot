# SER-67: Admin Dashboard & Menu Management — Implementation Plan

## Summary

Build the admin dashboard overview page (today's stats) and the full menu management interface (list items by category, add/edit/delete items, manage categories, toggle availability). This maps to Task 14 in the technical spec.

## Branch & Worktree

- Branch: `ser-67`
- Worktree: `.worktrees/ser-67`
- Base: `main`

## Dependencies (all merged)

- **SER-56**: UI Components — `Button`, `Input`, `Card`, `Badge`, `Modal` at `src/components/ui/`
- **SER-58**: Menu API CRUD — endpoints at `src/app/api/menu/` (items + categories CRUD)
- **SER-66**: Admin Auth — middleware at `src/middleware.ts`, login at `src/app/auth/login/`, Supabase session, logout at `POST /api/auth/logout`

## Existing Patterns to Follow

- **Language**: Dutch for user-facing text (e.g. "Inloggen", "E-mailadres")
- **Client components**: `"use client"` directive, `useState` for local state, `createClient()` from `@/lib/supabase/client` for browser-side Supabase
- **API calls**: `fetch("/api/...")` from client components for mutations; Supabase browser client for direct queries
- **Design tokens**: Tailwind v4 `@theme` tokens — `bg-fiamma`, `text-oven`, `text-crema`, `font-headline`, `font-body`, `rounded-base`, `shadow-warm-md`, `p-space-7`
- **UI components**: Import from `@/components/ui` — `Button` (primary/secondary/ghost, sm/md/lg, isLoading), `Input` (label, error), `Card`, `Badge` (default/success/warning/error), `Modal` (isOpen, onClose, title)
- **Auth pattern in client**: `createClient()` from `@/lib/supabase/client` + `supabase.auth.getUser()`
- **Test pattern**: Vitest + RTL, `import { describe, it, expect, vi } from "vitest"`, co-located `__tests__/` directories, `@testing-library/react` + `@testing-library/user-event`
- **Container pattern**: `mx-auto max-w-7xl px-4 md:px-6`
- **Icons**: `lucide-react` (e.g. `Menu`, `X`, `MapPin`, `Phone`, `Clock`)

## Files to Create

### 1. `src/app/admin/layout.tsx` — Admin Layout with Sidebar Navigation

**Purpose**: Admin shell wrapping all `/admin/*` pages with sidebar nav and top bar.

**Details**:
- Client component (`"use client"`) for navigation state + logout handling
- **Sidebar** (left, 256px wide):
  - `bg-oven` dark background, full-height
  - Logo/branding: "Eataliano Admin" in `font-headline text-crema`
  - Nav links using `usePathname()` for active state:
    - Dashboard (`/admin`) — `LayoutDashboard` icon
    - Menu (`/admin/menu`) — `UtensilsCrossed` icon
    - Bestellingen (`/admin/orders`) — `ShoppingBag` icon (future SER-68)
    - Reserveringen (`/admin/reservations`) — `CalendarDays` icon (future SER-68)
    - Instellingen (`/admin/settings`) — `Settings` icon (future SER-69)
  - Active link: `bg-fiamma/20 text-fiamma`, inactive: `text-crema/70 hover:text-crema hover:bg-white/5`
- **Top bar** (right of sidebar):
  - Logout button (calls `POST /api/auth/logout`, then `router.push("/auth/login")`)
  - Mobile hamburger toggle for sidebar
- **Responsive**: sidebar hidden on mobile, toggled via hamburger; overlay on mobile
- **Content area**: `flex-1` with `bg-crema` background, padding

### 2. `src/components/admin/StatCard.tsx` — Dashboard Stat Card

**Purpose**: Reusable card for dashboard stats.

**Props**: `title: string`, `value: string | number`, `subtitle?: string`, `icon: React.ReactNode`

**Details**:
- Uses `Card` component as wrapper
- Icon rendered at 24px in `text-fiamma`
- Value in large `font-headline text-2xl` font
- Title in `text-sm text-oven/60 font-body`
- Subtitle in `text-xs text-oven/40`

### 3. `src/app/admin/page.tsx` — Dashboard Overview

**Purpose**: Today's quick stats overview.

**Details**:
- Client component, fetches data on mount with `useEffect`
- Uses Supabase browser client for authenticated queries
- Computes today's date in Amsterdam timezone for filtering
- **4 stat cards** in responsive grid (2x2 on desktop, stacked on mobile):
  - "Bestellingen Vandaag" — count of today's orders + total revenue formatted as EUR
  - "Reserveringen Vandaag" — count of today's reservations
  - "Menu Items" — count of active menu items
  - "Categorieen" — count of active categories
- Loading state with skeleton/placeholder while fetching
- Quick action: "Beheer Menu" button linking to `/admin/menu`

### 4. `src/components/admin/MenuItemForm.tsx` — Menu Item Add/Edit Form

**Purpose**: Modal form for creating and editing menu items.

**Props**: `item?: MenuItem | null` (null = create mode), `categories: Category[]`, `onSave: () => void`, `onCancel: () => void`

**Fields**:
- `name` — `Input` component, required
- `description` — `<textarea>` styled to match Input
- `price` — `Input` type="number" step="0.01", required
- `category_id` — `<select>` dropdown, required
- `allergens` — `Input`, comma-separated text (parsed to string array on submit)
- `dietary_labels` — `Input`, comma-separated text (parsed to string array)
- `image_url` — `Input`, optional URL
- `is_available` — checkbox
- `is_featured` — checkbox
- `sort_order` — `Input` type="number"

**Behavior**:
- Pre-fills fields when `item` prop provided (edit mode)
- Client-side validation: name non-empty, price > 0, category selected
- Submit: `POST /api/menu` (create) or `PATCH /api/menu/{id}` (update)
- Shows `Button isLoading` during save
- Calls `onSave()` on success for parent to refresh list

### 5. `src/components/admin/CategoryForm.tsx` — Category Add/Edit Form

**Purpose**: Modal form for creating and editing categories.

**Props**: `category?: Category | null`, `onSave: () => void`, `onCancel: () => void`

**Fields**: `name` (required), `description` (optional textarea), `sort_order` (number), `is_active` (checkbox)

**Behavior**:
- Submit: `POST /api/menu/categories` (create) or `PATCH /api/menu/categories/{id}` (update)
- Validation: name non-empty

### 6. `src/app/admin/menu/page.tsx` — Menu Management Page

**Purpose**: Full CRUD interface for menu items and categories.

**Details**:
- Client component with two tabs: "Items" | "Categorieen"
- **Items tab**:
  - Fetch ALL items (including `is_available=false`) via Supabase browser client: `supabase.from("menu_items").select("*, category:menu_categories(*)").order("sort_order")`
  - Fetch all categories for the filter/form dropdown
  - Display items grouped by category in collapsible sections
  - Each item row in a `Card`:
    - Name (font-headline), price (formatted EUR), category `Badge`
    - `is_available` toggle switch — optimistic update via `PATCH /api/menu/{id}`
    - Edit button (pencil icon) — opens `Modal` with `MenuItemForm`
    - Delete button (trash icon) — confirmation dialog, then `DELETE /api/menu/{id}`
  - "Nieuw Item" `Button` above the list — opens `Modal` with empty `MenuItemForm`
  - Search input at top to filter items by name
- **Categories tab**:
  - Fetch all categories via Supabase browser client (including `is_active=false`)
  - Each row: name, description snippet, sort_order, `is_active` badge
  - Edit button — opens `Modal` with `CategoryForm`
  - "Nieuwe Categorie" `Button` — opens `Modal` with empty `CategoryForm`
- Refresh data after any CRUD operation

### 7. `src/components/admin/index.ts` — Barrel Export

Export: `StatCard`, `MenuItemForm`, `CategoryForm`

### 8. Unit Tests

#### `src/components/admin/__tests__/StatCard.test.tsx`
- Renders title, value, subtitle
- Renders icon
- Handles missing subtitle gracefully

#### `src/components/admin/__tests__/MenuItemForm.test.tsx`
- Renders all form fields
- Shows empty fields in create mode
- Pre-fills fields in edit mode
- Validates required fields (name, price, category)
- Calls onCancel when cancel button clicked
- Shows loading state on submit

#### `src/components/admin/__tests__/CategoryForm.test.tsx`
- Renders form fields
- Pre-fills in edit mode
- Validates name required
- Calls onCancel

#### `src/app/admin/__tests__/page.test.tsx`
- Renders dashboard heading
- Renders 4 stat cards
- Mocks Supabase client to return test data

#### `src/app/admin/menu/__tests__/page.test.tsx`
- Renders menu management heading
- Shows items tab by default
- Switches to categories tab
- Renders "Nieuw Item" button
- Mocks Supabase client to return test items and categories

### 9. E2E Test: `e2e/admin-menu.spec.ts`

**Scenarios**:
1. Unauthenticated user visiting `/admin` is redirected to `/auth/login`
2. Admin logs in and sees dashboard with stat cards
3. Admin navigates to `/admin/menu` via sidebar
4. Admin sees menu items listed
5. Admin clicks "Nieuw Item" and sees the form modal
6. Admin fills form and creates a new item
7. Admin edits an existing item
8. Admin toggles item availability
9. Admin switches to categories tab and sees categories

## API Surface (all existing, no modifications)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/menu` | Public | List active items (used for stats count) |
| POST | `/api/menu` | Admin | Create menu item |
| PATCH | `/api/menu/[id]` | Admin | Update menu item |
| DELETE | `/api/menu/[id]` | Admin | Soft-delete item (`is_available=false`) |
| GET | `/api/menu/categories` | Public | List active categories |
| POST | `/api/menu/categories` | Admin | Create category |
| PATCH | `/api/menu/categories/[id]` | Admin | Update category |
| GET | `/api/orders` | Admin | List orders (filtered by date for stats) |
| GET | `/api/reservations` | Admin | List reservations (filtered by date for stats) |
| POST | `/api/auth/logout` | Any | Sign out and redirect |

**Key note on admin menu listing**: The public `GET /api/menu` only returns `is_available=true` items. For the admin menu page, we query Supabase directly from the browser client (authenticated) to get ALL items including unavailable ones. This avoids modifying the public API.

## Design Decisions

1. **Direct Supabase browser client for admin queries**: The admin menu page needs all items including unavailable ones. Rather than adding query params to the public API, we use the authenticated Supabase browser client directly. The admin is already authenticated via Supabase Auth.

2. **Tab-based menu management**: Items and categories on the same page with tab switching. Keeps navigation minimal and provides the "full menu management interface" in one view.

3. **Modal forms for CRUD**: Using the existing `Modal` component for add/edit forms. Users stay on the same page, reducing context switching.

4. **Optimistic availability toggle**: When toggling `is_available`, update the UI immediately, then call `PATCH /api/menu/{id}` in the background. Revert on error with a toast-style error message.

5. **Sidebar navigation pattern**: Dark sidebar (`bg-oven`) with light text (`text-crema`), active state uses `text-fiamma`. This is a standard admin dashboard pattern that clearly separates the admin area from the public site.

6. **Responsive sidebar**: Full sidebar on desktop (md+), hamburger-toggled overlay on mobile. Content area takes remaining width.

7. **Dutch date handling**: Dashboard stats use Amsterdam timezone for "today" calculation, matching the reservation API pattern.

## Implementation Order

1. `src/app/admin/layout.tsx` — admin shell (needed by all pages)
2. `src/components/admin/StatCard.tsx` — dashboard building block
3. `src/app/admin/page.tsx` — dashboard overview
4. `src/components/admin/CategoryForm.tsx` — category form (simpler, test first)
5. `src/components/admin/MenuItemForm.tsx` — menu item form
6. `src/app/admin/menu/page.tsx` — main CRUD page
7. `src/components/admin/index.ts` — barrel export
8. Unit tests (all `__tests__/` files)
9. `e2e/admin-menu.spec.ts` — E2E test

## Acceptance Criteria

- [ ] Admin layout renders with sidebar navigation and responsive hamburger
- [ ] Sidebar links to Dashboard, Menu, Bestellingen, Reserveringen, Instellingen
- [ ] Active sidebar link highlighted in fiamma
- [ ] Logout button works (signs out, redirects to login)
- [ ] Dashboard shows 4 stat cards with today's data
- [ ] Menu management lists ALL items grouped by category (including unavailable)
- [ ] Add new menu item via modal form works end-to-end
- [ ] Edit existing menu item via modal form works end-to-end
- [ ] Toggle item availability works with optimistic update
- [ ] Delete (soft-delete) item works with confirmation
- [ ] Category management: list all, add new, edit existing
- [ ] Form validation: required fields, price > 0, name non-empty
- [ ] Search/filter items by name
- [ ] Tab switching between Items and Categories
- [ ] Design tokens applied: fiamma accent, oven text/sidebar, crema background, headline font, warm shadows
- [ ] All unit tests pass
- [ ] E2E test passes
- [ ] No TypeScript errors on `npm run build`
