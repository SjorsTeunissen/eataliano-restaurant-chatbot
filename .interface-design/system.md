# Eataliano Design System

## Color Primitives

| Token       | Hex       | Usage                            |
|-------------|-----------|----------------------------------|
| `--oven`    | `#232323` | Dark charcoal — primary text, dark surfaces |
| `--fiamma`  | `#ff7801` | Orange accent — CTAs, highlights, active states |
| `--basilico`| `#4eb971` | Green — success states, fresh accents |
| `--crema`   | `#f5f0eb` | Warm off-white — page background, light surfaces |

## Typography

| Role      | Font        | Style                          | Weights         |
|-----------|-------------|--------------------------------|-----------------|
| Headlines | Oswald      | Condensed, geometric, uppercase feel | 400, 500, 600, 700 |
| Body / UI | Montserrat  | Clean, modern, highly readable | 400, 500, 600, 700 |

- Headlines use `font-family: var(--font-headline)`
- Body text uses `font-family: var(--font-body)`
- Fonts loaded via `next/font/google` with `display: swap`

## Spacing

Base unit: **4px**

| Token       | Value  |
|-------------|--------|
| `--space-1` | 4px    |
| `--space-2` | 8px    |
| `--space-3` | 12px   |
| `--space-4` | 16px   |
| `--space-5` | 24px   |
| `--space-6` | 32px   |
| `--space-7` | 48px   |

## Border Radius

| Token          | Value  |
|----------------|--------|
| `--radius-sm`  | 4px    |
| `--radius-base`| 8px    |
| `--radius-lg`  | 12px   |
| `--radius-full`| 9999px |

## Depth (Shadows)

Strategy: Subtle, warm-tinted shadows (using `--oven` as shadow color base).

| Token         | Value                              |
|---------------|------------------------------------|
| `--shadow-sm` | `0 1px 2px rgba(35, 35, 35, 0.08)` |
| `--shadow-md` | `0 2px 8px rgba(35, 35, 35, 0.12)` |
| `--shadow-lg` | `0 4px 16px rgba(35, 35, 35, 0.16)`|

## Component Patterns

### Buttons
- **Primary:** `background: var(--fiamma)`, white text, `border-radius: var(--radius-base)`
- **Secondary:** Outlined with `border: 1px solid var(--oven)`, transparent background
- **Ghost:** No border, no background, text color only

### Cards
- Background: white or `var(--crema)`
- Border: `1px solid rgba(35, 35, 35, 0.08)`
- Shadow: `var(--shadow-sm)`
- Border radius: `var(--radius-base)`

### Chatbot Sidebar
- Width: 400px (desktop), full-width (mobile)
- Background: dark surface using `var(--oven)`
- User messages: light background tint
- Bot messages: subtle `var(--fiamma)` tint

### Navigation
- Background: `var(--oven)` (dark)
- Active link: `var(--fiamma)` accent
- Text: white / `var(--crema)`
