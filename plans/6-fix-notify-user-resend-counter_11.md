# Plan — Fix FCM notifyUser Flag, Add Resend Confirmation and Send Counter

**Branch:** fix/notify-user-resend-counter_11
**Issue:** #11
**Date:** 2026-07-01

## Goal
Fix the FCM broadcast bug where the mobile in-app notification dialog never
appears because `notifyUser` is sent as `"false"`, and add a safe resend
flow plus a broadcast-send counter for both company content and topic
content.

## Approach
Diagnosed via the mobile-side finding: `FcmHandler.dart` gates the in-app
dialog on `notifyUser`. Both `notifyContent()` and `notifyTopicContent()`
were building that payload field from the content document's stored
`notifyUser` value — a creation-time form field unrelated to broadcast
intent — instead of asserting `true` at send time.

Rather than adding a new field for the send counter, repurposed the
existing but previously dead `successCount` field (always `-1`, never
updated) per explicit direction: set to `1` on first send, incremented by
`1` on each resend. `failureCount` is left untouched for now.

For resend safety, kept the existing single notify button always visible
(instead of hiding it after first send) but disabled by default post-send,
requiring an explicit "Confirm resend" checkbox (its own row, label and
checkbox laid out with flexbox and `nowrap` since `.form-check` classes
aren't actually defined in the project's CSS) above a full-width button —
avoiding a separate resend endpoint while making repeat sends deliberate.
Below that checkbox row, a "Sent successfully N time(s)" line surfaces the
`successCount` field so publishers can see broadcast history at a glance.
On top of that, both the first send and any resend now require a second,
explicit confirmation step: clicking Send/Resend reveals an inline warning
card (reusing the existing delete-confirmation visual pattern from
`UserActions.tsx`) stating the action can't be reverted once sent, with
"Yes, Send" / "Cancel" — the FCM call only fires after "Yes, Send".

## Changes
- `services/content.service.ts` — `notifyContent()` now hardcodes
  `notifyUser: 'true'` in the FCM payload, persists `notifyUser: true` and
  increments `successCount` (1 on first send, +1 thereafter) on the
  Firestore doc.
- `services/topic-content.service.ts` — identical fix in
  `notifyTopicContent()`.
- `app/dashboard/content/[id]/ContentActions.tsx` — added `confirmResend`
  and `showSendConfirm` state; after `content.notified`, renders a
  disabled-by-default "Resend Push Notification (FCM)" button side-by-side
  with a "Confirm resend" checkbox; clicking Send/Resend reveals an inline
  irreversible-action warning card before the API call fires.
- `app/dashboard/topics/[topic]/[id]/TopicActions.tsx` — identical UI
  change for topic content.
