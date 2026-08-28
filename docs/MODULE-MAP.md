# Module Map

This ZIP keeps the original compacted dashboard and also provides responsibility-based extracted copies for Codex.

## Original fallback

- `admin-dashboard.html` — original compacted dashboard, left unchanged so current behavior is preserved.
- `legacy/original-compacted/` — backup copy of the original files and original uploaded ZIP.

## Runnable first-pass extraction area

- `src/legacy-bundle/` — modules extracted from the embedded `moduleSources` bundle. Keep these together at first because their imports are relative to the same folder.
- `src/legacy-external-scripts/` — the separate guard/addon JS files from the uploaded ZIP.

## Responsibility-based reading copies

- `src/core/app-data.js` — extracted from embedded `app-data.js`.
- `src/core/app-rules.js` — extracted from embedded `app-rules.js`.
- `src/services/supabase-storage.js` — extracted from embedded `supabase-storage.js`.
- `src/features/calendar/calendar-logic-guard.js` — extracted from embedded `calendar-logic-guard.js`.
- `src/features/portal/portal-logic-fixes.js` — extracted from embedded `portal-logic-fixes.js`.
- `src/features/portal/script.js` — extracted from embedded `script.js`.
- `src/features/portal/portal-wiring.js` — extracted from embedded `portal-wiring.js`.
- `src/features/activity-status/activity-status-bridge.js` — extracted from embedded `activity-status-bridge.js`.
- `src/ui/ui-light-cards.js` — extracted from embedded `ui-light-cards.js`.
- `src/ui/portal-ui-polish.js` — extracted from embedded `portal-ui-polish.js`.
- `src/features/approvals/event-request-enhanced-cards.js` — extracted from embedded `event-request-enhanced-cards.js`.
- `src/features/admin-tabs/admin-tabs-inline.js` — extracted from embedded `admin-tabs-inline.js`.
- `src/features/auth/admin-integrated-bootstrap.js` — extracted from embedded `admin-integrated-bootstrap.js`.
- `src/features/notifications/notification-routing-guard.js` — copied from uploaded `admin-dashboard.html.inlined-notification-routing-guard.tmp.js`.
- `src/features/approvals/approval-workflow-guard.js` — copied from uploaded `admin-dashboard.html.inlined-approval-workflow-guard.tmp.js`.
- `src/features/calendar/calendar-google-style-addon.js` — copied from uploaded `admin-dashboard.html.inlined-calendar-google-style-addon.tmp.js`.
- `src/features/concerns/concern-sync-bridge.js` — copied from uploaded `admin-dashboard.html.csc-sync-concerns-database-bridge-v1.tmp.js`.
- `src/features/admin-tabs/admin-tabs-card-final.js` — copied from uploaded `admin-tabs-card-final.js`.
- `src/features/admin-tabs/admin-tabs-inline.external.js` — copied from uploaded `admin-tabs-inline.js`.
- `src/ui/mobile-admin-card-fix.js` — copied from uploaded `mobile-admin-card-fix.js`.
- `src/ui/mobile-admin-ui-polish.js` — copied from uploaded `mobile-admin-ui-polish.js`.
- `src/ui/modal-responsive-center.js` — copied from uploaded `modal-responsive-center.js`.

## Inline scripts extracted from `admin-dashboard.html`

- `src/ui/early-session-restore.js` — `first inline script without id` (8 lines).
- `src/features/calendar/schedule-modal-fit.js` — `csc-sync-schedule-modal-fit-v6` (294 lines).
- `src/features/calendar/personal-calendar-addon.js` — `inlined-personal-calendar-addon` (1390 lines).
- `src/features/calendar/calendar-google-style-addon.inlined-from-dashboard.js` — `inlined-calendar-google-style-addon` (689 lines).
- `src/ui/sidebar-auto-hide.js` — `inlined-dashboard-sidebar-auto-hide` (131 lines).
- `src/features/approvals/admin-event-request-search.js` — `inlined-admin-event-request-search` (254 lines).
- `src/features/notifications/notification-routing-guard.inlined-from-dashboard.js` — `inlined-notification-routing-guard` (844 lines).
- `src/features/approvals/approval-workflow-guard.inlined-from-dashboard.js` — `inlined-approval-workflow-guard` (673 lines).
- `src/ui/dashboard-reload-state.js` — `inlined-dashboard-reload-state` (142 lines).

## CSS extracted from `admin-dashboard.html`

- `styles/early-session.css` — `style tag #1` (20 lines).
- `styles/base.css` — `self-contained-dashboard-styles` (4320 lines).
- `styles/_extracted/style-03.css` — `style tag #3` (634 lines).
- `styles/fixes.css` — `style tag #4` (57 lines).
