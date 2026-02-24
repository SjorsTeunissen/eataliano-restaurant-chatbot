# PLAN: SER-59 — [Backend] Reservation API

## Issue Summary

Build REST API endpoints for the reservation system: public creation with validation, and admin-protected listing and status management. Validates against location opening hours, party size limits, and date constraints.

## Existing Work Assessment

A previous session produced complete implementations for all three target files. The code is untracked (never committed or pushed). Assessment below.

### Files Found in Worktree

| File | Status | Assessment |
|------|--------|------------|
| `src/app/api/reservations/route.ts` | Complete | POST + GET handlers implemented with full validation |
| `src/app/api/reservations/[id]/route.ts` | Complete | PATCH handler for admin status updates |
| `src/app/api/reservations/__tests__/route.test.ts` | Complete | 13 test cases covering all endpoints |
| `vitest.config.ts` | Complete | Vitest configuration with `@/` alias resolution |

### Quality Assessment of Existing Code

**route.ts (POST /api/reservations) - Good, minor issues:**
- Required field validation (location_id, customer_name, customer_phone, party_size, reservation_date, reservation_time)
- Party size validated: integer between 1-20
- Date format validated (YYYY-MM-DD), time format validated (HH:MM)
- Date-not-in-past validation using Amsterdam timezone
- Location existence and is_active checked via admin client
- Opening hours validation: Dutch day names, time range check
- created_via validation (chatbot/admin, defaults to chatbot)
- Uses `createAdminClient()` for inserts (bypasses RLS for public reservation creation)
- **Issue**: Returns 400 for validation errors; acceptance criteria specifies 422 for validation failures

**route.ts (GET /api/reservations) - Good:**
- Auth check via `createClient()` + `getUser()`
- Supports filters: location_id, date_from, date_to, status
- Orders by date then time ascending

**[id]/route.ts (PATCH) - Good:**
- Auth check via `createClient()` + `getUser()`
- Validates status is one of: confirmed, cancelled, completed, no_show
- Checks reservation exists before updating (returns 404 if not found)

**Tests (route.test.ts) - Good coverage:**
- POST: valid creation, missing fields, party size too small/large, past date, location not found, outside opening hours, invalid date format, invalid time format, default created_via
- GET: unauthorized (401), returns reservations when authenticated, applies filters
- PATCH: unauthorized (401), updates status, invalid status, missing status, reservation not found (404)

## Required Changes

### 1. Fix HTTP status codes for validation errors

The acceptance criteria states: "returns 422 with specific error messages for each validation failure." The current code returns 400 for all validation errors. Change validation-specific responses to 422 (Unprocessable Entity).

**In `src/app/api/reservations/route.ts`**, update these responses from `status: 400` to `status: 422`:
- Missing required fields (line 80)
- Party size out of range (line 93)
- Invalid date format (line 101)
- Invalid time format (line 108)
- Date in the past (line 117)
- Invalid created_via (line 132)
- Location not found (line 148) -- keep as 400 (bad reference, not validation)
- Location not active (line 154) -- keep as 400 (business rule, not input validation)
- Closed on day (line 173) -- 422 (time/schedule validation)
- Time outside opening hours (line 182) -- 422 (time/schedule validation)

### 2. Update tests to match 422 status codes

**In `src/app/api/reservations/__tests__/route.test.ts`**, update `expect(res.status).toBe(400)` to `expect(res.status).toBe(422)` for the validation test cases:
- "returns 422 when required fields are missing" (was 400)
- "returns 422 when party_size is out of range (too small)" (was 400)
- "returns 422 when party_size is out of range (too large)" (was 400)
- "returns 422 when reservation_date is in the past" (was 400)
- "returns 422 when time is outside opening hours" (was 400)
- "returns 422 for invalid date format" (was 400)
- "returns 422 for invalid time format" (was 400)

Keep `400` for: location not found, location not active (these are 400 bad request, not 422 validation).

### 3. Verify vitest dependency and test script

The worktree's `package.json` has `vitest: "^2"` in devDependencies but no `"test"` script. The resolver must:
- Add `"test": "vitest run"` to `package.json` scripts (if not already present)
- Ensure `vitest.config.ts` is committed
- Run `npx vitest run src/app/api/reservations/__tests__/route.test.ts` to verify all tests pass

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/app/api/reservations/route.ts` | Modify | Change validation error status codes from 400 to 422 |
| `src/app/api/reservations/[id]/route.ts` | Keep as-is | No changes needed |
| `src/app/api/reservations/__tests__/route.test.ts` | Modify | Update expected status codes from 400 to 422 for validation tests |
| `vitest.config.ts` | Keep as-is | Already correct |
| `package.json` | Modify | Add `"test": "vitest run"` script if missing |

## Implementation Steps

1. **Update validation status codes in route.ts**: Change 9 validation error responses from `{ status: 400 }` to `{ status: 422 }`
2. **Update test expectations**: Change 7 test assertions from `.toBe(400)` to `.toBe(422)` for validation test cases
3. **Add test script to package.json**: Add `"test": "vitest run"` if not present
4. **Run tests**: Execute `npx vitest run` and verify all 13 tests pass
5. **Stage and commit all files**

## Acceptance Criteria Checklist

- [x] POST /api/reservations validates: date not in past, party_size 1-20, time within opening hours, required fields present
- [ ] Returns 422 with specific error messages for validation failures (currently returns 400, needs fix)
- [x] GET /api/reservations returns filtered by date/location (admin only)
- [x] PATCH /api/reservations/[id] updates status to confirmed/cancelled/completed/no_show (admin only)
- [x] Integration tests cover creation, all validations, admin operations (need status code update)

## Scope Boundaries

**MUST modify:** `src/app/api/reservations/route.ts`, `src/app/api/reservations/[id]/route.ts`, `src/app/api/reservations/__tests__/route.test.ts`
**MUST NOT modify:** Files outside `src/app/api/reservations/`

## Dependencies

- `@/lib/supabase/server` (createClient) -- exists on main branch
- `@/lib/supabase/admin` (createAdminClient) -- exists on main branch
- `vitest` -- in devDependencies
- Database: `reservations` table (migration 003), `locations` table (migration 001), RLS policies (migration 007)

## Risk Notes

- The `vitest.config.ts` file is at the project root, which is fine for the resolver but note it also exists in the SER-58 worktree -- potential merge conflict if both add it. The content is identical so auto-merge should handle it.
- The POST handler uses `createAdminClient()` (service role key) to bypass RLS for public inserts. This is correct per the RLS design: `reservations_insert_public` policy exists but the admin client is used for the location lookup + insert atomicity.
- Opening hours use Dutch day names (maandag, dinsdag, etc.) matching the seed data format.
