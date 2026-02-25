# SER-61: Home Page — Implementation Plan

## Overview

Build the Eataliano home page with four sections: hero with restaurant intro and CTA, featured dishes from Supabase, location cards with opening hours for Arnhem and Huissen, and a "Why Eataliano" section. The page is server-rendered (RSC) using the existing public layout (Header/Footer from SER-57) and UI components (Card, Button, Badge from SER-56).

## Branch & Worktree

- Branch: `ser-61`
- Worktree: `.worktrees/ser-61`
- Base: `main` (includes SER-55 database schema, SER-56 UI components, SER-57 layout)

## Existing Infrastructure (Already Merged)

- **Public layout**: `src/app/(public)/layout.tsx` — wraps children with Header + Footer
- **UI components**: `src/components/ui/` — Button (primary/secondary/ghost), Card (white bg, border, shadow), Badge (default/success/warning/error)
- **Design tokens**: `src/app/globals.css` — Tailwind v4 `@theme` directive + CSS custom properties for colors (oven, fiamma, basilico, crema), fonts (Oswald headlines, Montserrat body), spacing scale, shadows
- **Tailwind config**: `tailwind.config.ts` — extends theme with oven/fiamma/basilico/crema colors, headline/body fonts, warm shadows
- **Supabase server client**: `src/lib/supabase/server.ts` — `createClient()` for RSC data fetching
- **Database**: locations table (Arnhem/Huissen seed data with opening_hours JSONB using Dutch day names), menu_items table (with `is_featured` boolean, `is_available` boolean)
- **Current placeholder**: `src/app/(public)/page.tsx` — simple centered "Welkom bij Eataliano" text to be replaced

## Files to Create/Modify

### 1. `src/app/(public)/page.tsx` (MODIFY)
Replace the placeholder with the full home page. Server component that:
- Fetches featured menu items from Supabase (`is_featured = true, is_available = true`)
- Fetches active locations from Supabase (`is_active = true`)
- Renders four sections in order: HeroSection, FeaturedDishes, LocationCards, WhyEataliano
- Exports metadata for SEO

### 2. `src/components/home/HeroSection.tsx` (CREATE)
Server component (no "use client") for the hero area:
- Full-width section with bg-oven (dark charcoal background)
- Restaurant name "Eataliano" in large Oswald headline (text-crema)
- Tagline: "Authentieke Italiaanse keuken in Arnhem & Huissen"
- Two CTA buttons using existing Button component + Next.js Link:
  - "Bekijk Menu" (primary variant, links to /menu)
  - "Reserveer een Tafel" (secondary variant with text-crema styling, links to /contact)
- Generous vertical padding for visual impact (py-24 md:py-32)

### 3. `src/components/home/FeaturedDishes.tsx` (CREATE)
Server component that receives featured menu items as props:
- Section heading "Onze Favorieten" with Oswald font
- Responsive grid: 1 col mobile, 2 cols md, 3 cols lg
- Each dish rendered in an existing Card component showing:
  - Dish name (font-headline)
  - Description (truncated to 2 lines with line-clamp)
  - Price formatted as Euro (e.g., "EUR 12,50")
  - Category name as a Badge
- CTA link "Bekijk het volledige menu" to /menu at the bottom
- If no featured items exist, the entire section is not rendered (returns null)

### 4. `src/components/home/LocationCards.tsx` (CREATE)
Server component that receives locations as props:
- Section heading "Onze Locaties"
- Two side-by-side Card components (stacked on mobile: grid-cols-1 md:grid-cols-2)
- Each card shows:
  - Location name as heading (font-headline, text-fiamma)
  - Address with MapPin icon from lucide-react
  - Phone with Phone icon from lucide-react
  - Today's opening hours with Clock icon, parsed from JSONB
- Opening hours logic: map JS `getDay()` to Dutch day names (zondag=0, maandag=1, ..., zaterdag=6) and display "Vandaag: 16:00 - 22:00" or "Gesloten" if no entry

### 5. `src/components/home/WhyEataliano.tsx` (CREATE)
Server component for the value proposition section:
- Section heading "Waarom Eataliano?"
- Grid of 3 items (1 col mobile, 3 cols lg) each containing:
  1. ChefHat icon + "Verse Ingredienten" + short description about quality
  2. MapPin icon + "Twee Locaties" + description about convenience (Arnhem & Huissen)
  3. ShoppingBag icon + "Online Bestellen" + description about easy online ordering
- Each item centered with icon in fiamma color, heading in Oswald, description in Montserrat

### 6. `src/components/home/index.ts` (CREATE)
Barrel export file for all home section components.

### 7. `playwright.config.ts` (CREATE)
Playwright configuration:
- Base URL: `http://localhost:3000`
- Web server command: `npm run dev`
- Single project: chromium
- Test directory: `e2e/`

### 8. `e2e/home.spec.ts` (CREATE)
Playwright E2E test:
- Navigate to `/`
- Verify hero section visible with "Eataliano" heading and CTA buttons
- Verify "Bekijk Menu" link points to /menu
- Verify "Reserveer een Tafel" link points to /contact
- Verify location cards section renders with "Arnhem" and "Huissen" text
- Verify "Waarom Eataliano?" section renders
- Verify page title/metadata

## Data Fetching Strategy

All data fetching happens server-side in the page component:

```typescript
const supabase = await createClient();

// Featured dishes (limit 6 for homepage)
const { data: featuredItems } = await supabase
  .from("menu_items")
  .select("*, category:menu_categories(name)")
  .eq("is_featured", true)
  .eq("is_available", true)
  .order("sort_order", { ascending: true })
  .limit(6);

// Active locations
const { data: locations } = await supabase
  .from("locations")
  .select("*")
  .eq("is_active", true)
  .order("name", { ascending: true });
```

Data is passed to section components as props. No client-side fetching needed.

## Opening Hours Helper

Dutch day name mapping for `opening_hours` JSONB lookup:

```typescript
const DUTCH_DAYS = [
  "zondag", "maandag", "dinsdag", "woensdag",
  "donderdag", "vrijdag", "zaterdag",
] as const;

function getTodayHours(openingHours: Record<string, { open: string; close: string }>) {
  const dayName = DUTCH_DAYS[new Date().getDay()];
  return openingHours[dayName] ?? null;
}
```

## Design Decisions

- **All Server Components**: No "use client" directive on any home page component — no interactivity needed, better performance
- **Link wrapping buttons**: CTAs use Next.js `<Link>` wrapping `<Button>` for SPA navigation
- **Existing Card component**: Reuse `src/components/ui/Card.tsx` for featured dishes and location cards
- **Existing Button component**: Reuse primary and secondary variants for hero CTAs
- **Responsive grid**: Tailwind responsive breakpoints matching the max-w-7xl container from Header/Footer
- **Section spacing**: Consistent `py-16 md:py-24` vertical rhythm between sections
- **Container pattern**: `mx-auto max-w-7xl px-4 md:px-6` matching Header/Footer pattern
- **No images**: Menu items may lack image_url; cards focus on text content with price prominent
- **Dutch language**: All user-facing text in Dutch
- **Euro formatting**: Prices displayed with EUR symbol, comma for decimals (Dutch convention)

## Implementation Order

1. Create `src/components/home/HeroSection.tsx`
2. Create `src/components/home/FeaturedDishes.tsx`
3. Create `src/components/home/LocationCards.tsx`
4. Create `src/components/home/WhyEataliano.tsx`
5. Create `src/components/home/index.ts`
6. Modify `src/app/(public)/page.tsx` — compose sections with Supabase data
7. Create `playwright.config.ts`
8. Create `e2e/home.spec.ts`
9. Run `npm run build` to verify no TypeScript/build errors
10. Run E2E tests

## Acceptance Criteria

- [ ] Page renders with real data from Supabase (featured items, locations)
- [ ] Hero section displays with headline, tagline, and two CTA buttons
- [ ] Featured dishes section shows menu items with name, description, price, category badge
- [ ] Featured dishes section handles empty data gracefully (renders nothing)
- [ ] Location cards show Arnhem and Huissen with address, phone, and today's hours
- [ ] "Why Eataliano" section shows three value propositions
- [ ] Responsive layout works at mobile, tablet, and desktop breakpoints
- [ ] Design system tokens applied throughout (colors, fonts, spacing, shadows)
- [ ] CTA buttons navigate correctly to /menu and /contact
- [ ] E2E tests pass
- [ ] No TypeScript errors on `npm run build`

## Scope Boundaries

**IN scope**: Home page sections, home section components, Playwright config + E2E test
**OUT of scope**: Header/Footer changes (SER-57), UI component changes (SER-56), database changes (SER-55), menu page (SER-62)
