# SER-69: Admin Settings & Location Management — Implementation Plan

## Overview

Build the admin settings page at `/admin/settings` for managing Eataliano's two restaurant locations (Arnhem, Huissen). The page allows editing location details, weekly opening hours, and delivery zones. All changes persist directly to the Supabase `locations` table via the browser client (authenticated admin has RLS write access).

## Branch & Worktree

- Branch: `ser-69-admin-settings-location-management`
- Worktree: `.worktrees/ser-69`
- Base: `main`

## Existing Infrastructure

- **Admin layout**: `src/app/admin/layout.tsx` (from SER-67) — sidebar with "Instellingen" nav item pointing to `/admin/settings`
- **Admin auth**: SER-66 — Supabase Auth session, middleware protecting `/admin` routes
- **UI components**: `src/components/ui/` — Button, Input, Card, Badge, Modal
- **Admin components**: `src/components/admin/` — StatCard, MenuItemForm, CategoryForm (SER-67 patterns)
- **Supabase browser client**: `src/lib/supabase/client.ts` — `createClient()` for reads/writes
- **Design tokens**: `src/app/globals.css` — colors (oven, fiamma, basilico, crema), fonts (Oswald headlines, Montserrat body), spacing, shadows
- **Database**: `locations` table with `opening_hours` JSONB (Dutch day names), `delivery_zones` JSONB (string array), RLS policies allowing authenticated UPDATE

## Database Schema (existing — no changes)

Table: `locations` (from `supabase/migrations/001_create_locations.sql`)

```
id            UUID PK
name          TEXT NOT NULL       -- "Arnhem" / "Huissen"
address       TEXT NOT NULL
phone         TEXT NOT NULL
email         TEXT
opening_hours JSONB NOT NULL      -- keyed by Dutch day names
delivery_zones JSONB              -- array of postal code strings
is_active     BOOLEAN
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ         -- auto-updated via trigger
```

### Opening Hours JSONB Structure (from seed data)

```json
{
  "maandag":   { "open": "16:00", "close": "22:00" },
  "dinsdag":   { "open": "16:00", "close": "22:00" },
  "woensdag":  { "open": "16:00", "close": "22:00" },
  "donderdag": { "open": "16:00", "close": "22:00" },
  "vrijdag":   { "open": "16:00", "close": "23:00" },
  "zaterdag":  { "open": "15:00", "close": "23:00" },
  "zondag":    { "open": "15:00", "close": "22:00" }
}
```

The seed data does NOT include a `closed` field. The implementation extends this to support `{ "open": "...", "close": "...", "closed": false }` where `closed: true` means the day is not operational. When `closed` is absent or `false`, the location is open with the given times.

### Delivery Zones JSONB Structure (from seed data)

```json
["6811", "6812", "6813", ...]
```

A flat array of postal code strings.

### RLS Access (from `supabase/migrations/007_rls_policies.sql`)

- `locations_select_public` — anyone can read
- `locations_update_authenticated` — only authenticated users can UPDATE

The admin's browser client session has the `authenticated` role (via SER-66 auth), so UPDATE queries pass RLS without API routes.

## Files to Create/Modify

### 1. `src/app/admin/settings/page.tsx` (CREATE)

Replace the `.gitkeep` placeholder. `'use client'` page that:
- Fetches all locations from Supabase on mount via `createClient().from('locations').select('*').order('name')`
- Shows loading skeleton with `animate-pulse` while fetching
- Renders one Card per location containing three sub-sections: LocationForm, OpeningHoursEditor, DeliveryZoneEditor
- Each sub-section has its own save button — users save sections independently
- After successful save, re-fetches locations to confirm persistence
- Success/error feedback shown per section

**Pattern reference:** `src/app/admin/menu/page.tsx` (SER-67) — same `'use client'` + `useState` + `useEffect` + `useCallback` + `createClient()` pattern.

### 2. `src/components/admin/LocationForm.tsx` (CREATE)

Editable location details component.

**Props:**
```tsx
interface LocationFormProps {
  location: Location;
  onSaved: () => void;
}
```

**Fields (controlled via useState):**
- `name` — Input, label "Naam", required
- `address` — Input, label "Adres", required
- `phone` — Input, label "Telefoon", required
- `email` — Input, label "E-mail", optional (validate format if provided)

**Save:** Direct Supabase update via browser client:
```tsx
const supabase = createClient();
await supabase.from('locations').update({ name, address, phone, email: email || null }).eq('id', location.id);
```

**Feedback:** Success banner in `text-basilico`, error in `text-red-500`.

**Pattern reference:** `src/components/admin/MenuItemForm.tsx` — same controlled inputs, validate(), handleSubmit, Button with isLoading, Input with label/error.

### 3. `src/components/admin/OpeningHoursEditor.tsx` (CREATE)

Weekly schedule editor.

**Props:**
```tsx
interface OpeningHoursEditorProps {
  locationId: string;
  openingHours: OpeningHours;
  onSaved: () => void;
}
```

**Types:**
```tsx
interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}
type DayName = 'maandag' | 'dinsdag' | 'woensdag' | 'donderdag' | 'vrijdag' | 'zaterdag' | 'zondag';
type OpeningHours = Record<DayName, DayHours>;
```

**Constants:**
```tsx
const DAYS: { key: DayName; label: string }[] = [
  { key: 'maandag', label: 'Maandag' },
  { key: 'dinsdag', label: 'Dinsdag' },
  { key: 'woensdag', label: 'Woensdag' },
  { key: 'donderdag', label: 'Donderdag' },
  { key: 'vrijdag', label: 'Vrijdag' },
  { key: 'zaterdag', label: 'Zaterdag' },
  { key: 'zondag', label: 'Zondag' },
];
```

**UI:** 7 rows, each with: day label | `<input type="time">` for open | dash | `<input type="time">` for close | "Gesloten" checkbox. When checked, time inputs disabled/grayed. Responsive: stack on mobile, row on desktop.

**Validation:** Close time must be after open time for non-closed days. Inline error per row.

**Save:** `supabase.from('locations').update({ opening_hours: hours }).eq('id', locationId)`

**Time input styling:** Match existing Input component styles: `rounded-base border border-oven/20 px-3 py-2 text-base font-body text-oven focus:outline-none focus:ring-2 focus:border-fiamma focus:ring-fiamma/20`

### 4. `src/components/admin/DeliveryZoneEditor.tsx` (CREATE)

Add/remove delivery zones.

**Props:**
```tsx
interface DeliveryZoneEditorProps {
  locationId: string;
  deliveryZones: string[];
  onSaved: () => void;
}
```

**UI:**
- Current zones as removable chips (Badge component + X icon button)
- Text input + "Toevoegen" button to add new zone
- "Opslaan" button at bottom

**Behavior:**
- Add: trim input, prevent empty/duplicate, add to local state
- Remove: filter out from local state
- Changes are local until "Opslaan" clicked

**Save:** `supabase.from('locations').update({ delivery_zones: zones }).eq('id', locationId)`

### 5. `src/components/admin/index.ts` (MODIFY)

Add exports for the three new components:
```tsx
export { LocationForm } from "./LocationForm";
export { OpeningHoursEditor } from "./OpeningHoursEditor";
export { DeliveryZoneEditor } from "./DeliveryZoneEditor";
```

## UI & Styling

All styling follows established patterns from `globals.css` tokens and existing SER-67 components:

- **Page heading:** `<h1 className="font-headline text-2xl text-oven mb-6">Instellingen</h1>`
- **Location heading:** `<h2 className="font-headline text-xl text-oven mb-4">{location.name}</h2>`
- **Section heading:** `<h3 className="font-headline text-lg text-oven mb-3">`
- **Cards:** `<Card>` component (white bg, subtle shadow, rounded-base)
- **Form inputs:** `<Input>` component with `label` and `error` props
- **Time inputs:** Native `<input type="time">` with matching border/focus styles
- **Closed toggle:** Checkbox with label "Gesloten" (same pattern as MenuItemForm checkboxes)
- **Zone chips:** `<Badge>` with X icon to remove
- **Save buttons:** `<Button>` primary (fiamma) with `isLoading`
- **Success:** `text-basilico` text
- **Error:** `text-red-500` text with `role="alert"`
- **Spacing:** `space-y-8` between location cards, `space-y-6` between sections within a card, `space-y-4` within forms
- **Dutch labels:** Naam, Adres, Telefoon, E-mail, Openingstijden, Bezorggebieden, Gesloten, Opslaan, Toevoegen

## Page Layout Wireframe

```
┌──────────────────────────────────────────────────┐
│ h1: Instellingen                                 │
│                                                  │
│ ┌─── Card: Arnhem ────────────────────────────┐  │
│ │ h2: Arnhem                                  │  │
│ │                                             │  │
│ │ h3: Locatiegegevens                         │  │
│ │ ┌─────────────────────────────────────────┐ │  │
│ │ │ Naam:     [____________]                │ │  │
│ │ │ Adres:    [____________]                │ │  │
│ │ │ Telefoon: [____________]                │ │  │
│ │ │ E-mail:   [____________]                │ │  │
│ │ │                        [Opslaan]        │ │  │
│ │ └─────────────────────────────────────────┘ │  │
│ │                                             │  │
│ │ h3: Openingstijden                          │  │
│ │ ┌─────────────────────────────────────────┐ │  │
│ │ │ Maandag    [16:00] - [22:00]  □ Gesloten│ │  │
│ │ │ Dinsdag    [16:00] - [22:00]  □ Gesloten│ │  │
│ │ │ ...                                     │ │  │
│ │ │ Zondag     [15:00] - [22:00]  □ Gesloten│ │  │
│ │ │                        [Opslaan]        │ │  │
│ │ └─────────────────────────────────────────┘ │  │
│ │                                             │  │
│ │ h3: Bezorggebieden                          │  │
│ │ ┌─────────────────────────────────────────┐ │  │
│ │ │ [6811 x] [6812 x] [6813 x] ...         │ │  │
│ │ │ [__________] [Toevoegen]                │ │  │
│ │ │                        [Opslaan]        │ │  │
│ │ └─────────────────────────────────────────┘ │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ ┌─── Card: Huissen ───────────────────────────┐  │
│ │ (same structure as Arnhem)                  │  │
│ └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## Acceptance Criteria Mapping

| Criterion | Implementation |
|-----------|---------------|
| Settings page shows both locations as separate sections | Page fetches all locations, renders a Card per location |
| Editable fields for name, address, phone, email with save | `LocationForm` with controlled inputs and Supabase update |
| Changes persist to Supabase locations table | Direct `supabase.from('locations').update(...)` — RLS allows authenticated updates |
| Opening hours editor shows all 7 days | `OpeningHoursEditor` renders all 7 Dutch day names with time inputs |
| Open/close time inputs | Native `<input type="time">` per day |
| Supports marking a day as closed | Checkbox toggle per day: `closed: true` in JSONB, disables time inputs |
| Saves as JSONB to locations table | Saves full `opening_hours` object via Supabase update |
| Delivery zones: add/remove postal codes or area names | `DeliveryZoneEditor` with removable badge chips + text input to add |
| Saved as JSONB array to delivery_zones field | Saves string array via Supabase update |

## Validation Rules

1. **LocationForm:** name, address, phone required. Email optional but validated if provided.
2. **OpeningHoursEditor:** close time must be after open time for non-closed days. Inline error per row.
3. **DeliveryZoneEditor:** prevent empty strings and duplicate entries when adding.

## Implementation Order

1. Create `src/components/admin/LocationForm.tsx`
2. Create `src/components/admin/OpeningHoursEditor.tsx`
3. Create `src/components/admin/DeliveryZoneEditor.tsx`
4. Update `src/components/admin/index.ts` with new exports
5. Create `src/app/admin/settings/page.tsx` — compose components with data fetching
6. Run `npm run build` to verify no TypeScript/build errors
7. Manual testing against dev server

## Test Scenarios (manual/E2E — no unit tests per spec)

1. Page loads and displays both Arnhem and Huissen locations with current data
2. Edit Arnhem address, save — database updated, success feedback shown
3. Change Monday close time to 23:00, save — opening_hours JSONB updated correctly
4. Toggle Wednesday to closed — JSONB has `"woensdag": { "open": "...", "close": "...", "closed": true }`
5. Add postal code "6828" to delivery zones, save — delivery_zones array includes "6828"
6. Remove a postal code from zones, save — no longer in delivery_zones array
7. Try to save with close time before open time — validation error shown, save blocked

## Scope Boundaries

**IN scope:** Location detail editing, opening hours editor, delivery zone management
**OUT of scope:** Creating new locations, deleting locations, image/logo management, email notification settings, database schema modifications
**Must NOT modify:** `src/app/admin/menu/*`, `src/app/admin/orders/*`, `supabase/migrations/*`
