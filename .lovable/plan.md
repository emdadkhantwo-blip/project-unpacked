
# Change Occupied Room Color to Red

## Overview

This update will change the color theme for occupied rooms from **blue** to **red** across the entire application for better visual distinction.

---

## Files to Modify

### 1. CSS Variables (`src/index.css`)

Change the occupied room color from blue to red:

| Line | Current Value | New Value |
|------|---------------|-----------|
| 68 | `--room-occupied: 217 91% 60%` (blue) | `--room-occupied: 350 89% 60%` (red) |

This single change automatically updates all components using the CSS variable classes like:
- `bg-room-occupied`
- `text-room-occupied`
- `border-room-occupied`

---

### 2. Room Card Styles (`src/components/rooms/RoomCard.tsx`)

Update the occupied status styles at lines 90-94:

| Property | Current | New |
|----------|---------|-----|
| `iconBg` | `bg-vibrant-blue-light` | `bg-vibrant-rose-light` |
| `iconColor` | `text-vibrant-blue` | `text-vibrant-rose` |

---

### 3. Housekeeping Room Grid (`src/components/housekeeping/RoomStatusGrid.tsx`)

Update the occupied status config at line 21:

| Property | Current | New |
|----------|---------|-----|
| `color` | `text-blue-700` | `text-red-700` |
| `bgColor` | `bg-blue-100 border-blue-200` | `bg-red-100 border-red-200` |

---

## Visual Result

After this change, occupied rooms will display as **red** consistently across:

- Room cards on the Rooms page
- Room status badges everywhere
- Housekeeping room grid
- Calendar timeline reservations
- Front desk displays
- Any other component using `room-occupied` color tokens

---

## Technical Notes

- The CSS variable approach ensures consistency - most components will update automatically
- Only 2 components have hardcoded blue colors that need manual updates
- No database changes required
- No new dependencies needed
