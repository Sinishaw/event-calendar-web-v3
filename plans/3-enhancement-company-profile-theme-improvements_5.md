# Plan — Company Profile & Theme Config Improvements

**Branch:** enhancement/company-profile-theme-improvements_5
**Issue:** #5
**Date:** 2026-06-20

## Goal
Improve administrative forms for Company Profile and Theme configurations. This involves changing the established field from text to date, creating logoLocation and adsScreenLocation select fields with responsive options dynamic filtering, adding a submit loading overlay, and resolving optimistic state updating and descriptive alerts in company action triggers.

## Approach
- **Established Date**: Modified `CompanyForm.tsx` to set the input type of the established field to `date` and remove the text placeholder.
- **Theme Locations Selects**: Defined `logoLocation` and `adsScreenLocation` states in `CompanyThemeForm.tsx` defaulting to `topright` and `left` respectively. Created options map matching the user spec where `logoLocation` dynamically changes the 2 valid options for `adsScreenLocation`, resetting the value to the first matching option upon change.
- **Save API Integration**: Extended the backend route `app/api/company/[id]/theme/route.ts` to retrieve and save `logoLocation` and `adsScreenLocation` settings in Remote Config.
- **Loading UI Overlay**: Wrapped the theme form in a relative container with an absolute-positioned semi-transparent overlay blocking interaction while the form is loading/submitting.
- **Action Buttons Optimistic Feedback**: Added an optimistic `localSt` status tracker to `CompanyActions.tsx` that changes button states immediately upon call success, rather than waiting on `router.refresh()`. Added success alerts and context-specific descriptive error alerts.

## Changes
- [CompanyForm.tsx](file:///Users/sinishaw/My_Projects/calendar-platform-web-v3/app/dashboard/company/CompanyForm.tsx) — Changed established input type to `date` and removed text placeholder.
- [CompanyThemeForm.tsx](file:///Users/sinishaw/My_Projects/calendar-platform-web-v3/app/dashboard/company/%5Bid%5D/theme/CompanyThemeForm.tsx) — Appended logoLocation and adsScreenLocation dropdown selections, conditional state resetting, loading overlay, and submission fields.
- [route.ts](file:///Users/sinishaw/My_Projects/calendar-platform-web-v3/app/api/company/%5Bid%5D/theme/route.ts) — Stored logoLocation and adsScreenLocation in Remote Config payload.
- [CompanyActions.tsx](file:///Users/sinishaw/My_Projects/calendar-platform-web-v3/app/dashboard/company/%5Bid%5D/CompanyActions.tsx) — Integrated local optimistic states, success status alerts, and descriptive fallback errors.
