# Plan — Holiday Color Configuration

**Branch:** enhancement/holiday-color-settings_7
**Issue:** #7
**Date:** 2026-06-21

## Goal
Add two new color picker configuration fields, `holidayColorLight` and `holidayColorDark`, to the company Theme configuration form. These fields should default to `#FF5252`.

## Approach
- **TypeScript Model**: Updated `CompanyThemeConfig` in `services/remote-config.service.ts` to support the two optional string fields.
- **Form UI & State**: Initialized form states for `holidayColorLight` and `holidayColorDark` with default `#FF5252` fallback values. Rendered native color picker select fields in both light and dark theme panels. Added form field appends to submission `FormData`.
- **API route**: Processed the submitted color values inside `app/api/company/[id]/theme/route.ts` and pushed them to Firebase Remote Config updates.

## Changes
- [remote-config.service.ts](file:///Users/sinishaw/My_Projects/calendar-platform-web-v3/services/remote-config.service.ts) — Extended `CompanyThemeConfig` interface.
- [CompanyThemeForm.tsx](file:///Users/sinishaw/My_Projects/calendar-platform-web-v3/app/dashboard/company/%5Bid%5D/theme/CompanyThemeForm.tsx) — Added state variables, inputs, and form field appends.
- [route.ts](file:///Users/sinishaw/My_Projects/calendar-platform-web-v3/app/api/company/%5Bid%5D/theme/route.ts) — Extracted and stored settings in Remote Config updates.
