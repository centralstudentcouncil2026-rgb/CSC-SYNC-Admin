# Bug Fix Guide

Use this guide after the first behavior-preserving extraction works.

## Calendar bugs
Check these files first:
- `src/features/calendar/calendar-logic-guard.js`
- `src/features/calendar/calendar-google-style-addon.js`
- `src/features/calendar/calendar-google-style-addon.inlined-from-dashboard.js`
- `src/features/calendar/calendar-drag-create.js`
- `src/services/schedule-service.js`
- `src/utils/date-utils.js`

## Notification bugs
Check these files first:
- `src/features/notifications/notification-routing-guard.js`
- `src/features/notifications/notification-routing-guard.inlined-from-dashboard.js`
- `src/features/notifications/notification-actions.js`
- `src/features/notifications/notification-render.js`
- `src/services/notification-service.js`

Known concern from scan: make sure notification insertion persists to Supabase instead of only updating local state.

## Approval workflow bugs
Check these files first:
- `src/features/approvals/approval-workflow-guard.js`
- `src/features/approvals/approval-workflow-guard.inlined-from-dashboard.js`
- `src/features/approvals/event-request-enhanced-cards.js`
- `src/features/approvals/admin-event-request-search.js`
- `src/services/schedule-service.js`
- `src/services/notification-service.js`

## UI/mobile bugs
Check these files first:
- `src/ui/mobile-admin-card-fix.js`
- `src/ui/mobile-admin-ui-polish.js`
- `src/ui/modal-responsive-center.js`
- `styles/mobile.css`
- `styles/modal.css`
