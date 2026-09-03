// Extracted from the embedded moduleSources object inside legacy/original-compacted/admin-dashboard.html.
// This copy is placed by responsibility for Codex readability.
// NOTE: Because it was moved into a feature folder, relative imports may need adjustment before this specific copy is runnable.

const PLF_SESSION_KEY = 'core_supabase_auth_session';

function plfHex(length) {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

function plfValidUuid() {
  return `${plfHex(8)}-${plfHex(4)}-4${plfHex(3)}-${['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)]}${plfHex(3)}-${plfHex(12)}`;
}

try {
  Object.defineProperty(window.crypto, 'randomUUID', { value: plfValidUuid, configurable: true });
} catch {}

function plfSession() {
  try { return JSON.parse(sessionStorage.getItem(PLF_SESSION_KEY) || 'null'); }
  catch { return null; }
}

function plfStore() { return window.CONNECT_STATE?.store || null; }
function plfPortalUser() {
  const store = plfStore();
  return (store?.users || []).find((user) => user.id === store.currentUserId) || {};
}
function plfIsOrgUser() { return plfPortalUser().role === 'organization_manager'; }
function plfCurrentUserId() { return window.CONNECT_STATE?.store?.currentUserId || plfSession()?.user?.id || ''; }
function plfUuid(value) {
  const text = String(value || '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null;
}

function plfHeaders() {
  const key = window.SUPABASE_CONFIG?.publishableKey || window.SUPABASE_CONFIG?.anonKey || window.SUPABASE_CONFIG?.apiKey || window.SUPABASE_CONFIG?.apikey || '';
  return { apikey: key, Authorization: `Bearer ${plfSession()?.access_token || key}`, 'Content-Type': 'application/json' };
}

async function plfPatchCalendarItem(id, payload) {
  if (!id || !window.SUPABASE_CONFIG?.url) return false;
  const response = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/calendar_items?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...plfHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Calendar item patch failed (${response.status})`);
  }
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

async function plfPostCalendarItem(payload) {
  const response = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/calendar_items?on_conflict=id`, {
    method: 'POST',
    headers: { ...plfHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload)
  });
  if (response.ok) return;
  const err = await response.json().catch(() => ({}));
  if (response.status !== 400) throw new Error(err.message || err.error || `Calendar item save failed (${response.status})`);
  if (await plfPatchCalendarItem(payload.id, payload)) return;
  const inserted = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/calendar_items`, {
    method: 'POST',
    headers: { ...plfHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(payload)
  });
  if (!inserted.ok && inserted.status !== 409) {
    const insertErr = await inserted.json().catch(() => ({}));
    throw new Error(insertErr.message || insertErr.error || err.message || err.error || `Calendar item save failed (${inserted.status})`);
  }
}

function plfIsCancellationRequest(row = {}) {
  return row.revision_status === 'cancel_pending' || row.event_status === 'cancellation_requested';
}

function plfCleanSchedulePayload(row, status, recommendation) {
  const now = new Date().toISOString();
  const reviewedBy = plfCurrentUserId() || row.reviewed_by || null;
  return {
    approval_status: status,
    admin_recommendation: recommendation || row.admin_recommendation || null,
    approval_date: now,
    approved_by: status === 'approved' ? reviewedBy : null,
    reviewed_by: reviewedBy,
    revision_status: row.revision_of ? status : (row.revision_status || null),
    event_status: status === 'approved' && !row.revision_of
      ? (row.event_status === 'finalized' ? 'finalized' : 'planned')
      : (row.event_status || 'planned'),
    notification_status: 'unread',
    updated_at: now
  };
}

function plfFullSchedulePayload(row) {
  const repeatRule = row.recurrence_type || row.repeat_rule || null;
  const repeatUntil = row.recurrence_until || row.repeat_until || null;
  return {
    category_id: row.category_id || null,
    title: row.title || null,
    venue: row.venue || null,
    schedule_type: row.schedule_type || null,
    start_time: row.start_time || null,
    end_time: row.end_time || null,
    occurrences: Array.isArray(row.occurrences) ? row.occurrences : [],
    expected_attendees: row.expected_attendees || null,
    privacy_level: row.privacy_level || 'basic',
    contact_person: row.contact_person || null,
    contact_info: row.contact_info || null,
    public_description: row.public_description || null,
    purpose: row.purpose || null,
    repeat_rule: repeatRule,
    repeat_until: repeatUntil,
    recurrence_type: repeatRule,
    recurrence_until: repeatUntil,
    approval_status: 'approved',
    admin_recommendation: row.admin_recommendation || null,
    approval_date: row.approval_date || new Date().toISOString(),
    approved_by: plfCurrentUserId() || null,
    reviewed_by: plfCurrentUserId() || null,
    revision_of: null,
    original_schedule_id: null,
    revision_status: 'approved',
    revision_history: Array.isArray(row.revision_history) ? row.revision_history : [],
    event_status: row.event_status === 'cancellation_requested' ? 'planned' : (row.event_status || 'planned'),
    notification_status: 'unread',
    updated_at: new Date().toISOString()
  };
}

function plfEventById(id) { return (window.CONNECT_STATE?.store?.events || []).find((item) => item.id === id); }

function plfToast(message, type = 'info') {
  const region = document.getElementById('toastRegion');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}
function plfOwnsSchedule(row = {}) {
  const user = plfPortalUser();
  return plfIsOrgUser() && row.record_type === 'schedule' && row.created_by && row.created_by === user.id;
}
function plfApprovedOriginal(row = {}) {
  return row.approval_status === 'approved' && !row.revision_of && !plfIsCancellationRequest(row);
}
function plfOrgDbRow(row) {
  return {
    id: row.id,
    record_type: 'schedule',
    schedule_source: row.schedule_source || 'organization',
    created_by_role: row.created_by_role || 'organization',
    requires_approval: row.requires_approval !== false,
    organization_id: plfUuid(row.organization_id),
    organization_name: row.organization_name || plfPortalUser().organization_name || plfPortalUser().organizationName || null,
    category_id: row.category_id || null,
    title: row.title || null,
    venue: row.venue || null,
    schedule_type: row.schedule_type || 'single_day',
    start_time: row.start_time || null,
    end_time: row.end_time || null,
    occurrences: Array.isArray(row.occurrences) ? row.occurrences : [],
    expected_attendees: row.expected_attendees || 1,
    privacy_level: row.privacy_level || 'basic',
    contact_person: row.contact_person || null,
    contact_info: row.contact_info || null,
    public_description: row.public_description || null,
    purpose: row.purpose || null,
    approval_status: row.approval_status || 'pending',
    admin_recommendation: row.admin_recommendation || null,
    approval_date: row.approval_date || null,
    reviewed_by: plfUuid(row.reviewed_by),
    approved_by: plfUuid(row.approved_by),
    revision_of: row.revision_of || null,
    original_schedule_id: row.original_schedule_id || null,
    revision_status: row.revision_status || null,
    request_type: row.request_type || null,
    request_reason: row.request_reason || null,
    requester_id: plfUuid(row.requester_id),
    revision_created_at: row.revision_created_at || null,
    revision_submitted_at: row.revision_submitted_at || null,
    revision_history: Array.isArray(row.revision_history) ? row.revision_history : [],
    event_status: row.event_status || 'planned',
    notification_status: row.notification_status || 'unread',
    created_by: row.created_by || plfPortalUser().id,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
}
function plfShowOrgButtons() {
  const row = window.CONNECT_STATE?.selectedDetails?.record;
  if (!plfOwnsSchedule(row)) return;
  const edit = document.getElementById('detailsEditButton');
  const remove = document.getElementById('detailsDeleteButton');
  [edit, remove].forEach((button) => {
    if (!button) return;
    button.hidden = false; button.disabled = false; button.classList.remove('action-hidden'); button.style.display = '';
  });
  if (plfApprovedOriginal(row)) {
    if (edit) edit.textContent = 'Request Edit';
    if (remove) remove.textContent = 'Request Removal';
  } else {
    if (edit) edit.textContent = 'Edit';
    if (remove) remove.textContent = 'Remove';
  }
}
function plfCancellationRequest(row) {
  const now = new Date().toISOString();
  return {
    ...row,
    id: crypto.randomUUID(),
    approval_status: 'pending',
    revision_of: row.id,
    original_schedule_id: row.id,
    revision_status: 'cancel_pending',
    request_type: 'delete',
    request_reason: row.request_reason || null,
    requester_id: plfCurrentUserId(),
    revision_created_at: now,
    revision_submitted_at: now,
    revision_history: [...(row.revision_history || []), { revision_id: crypto.randomUUID(), submitted_at: now, submitted_by: plfCurrentUserId(), request_type: 'delete', status: 'cancel_pending' }],
    event_status: 'cancellation_requested',
    notification_status: 'unread',
    created_by: plfCurrentUserId(),
    created_at: now,
    updated_at: now
  };
}

function plfBindApprovalPersistence() {
  document.addEventListener('submit', (event) => {
    if (event.target?.id !== 'eventReviewForm') return;
    const id = document.getElementById('eventReviewId')?.value || '';
    const status = document.getElementById('eventReviewStatus')?.value || '';
    const recommendation = document.getElementById('eventReviewRecommendation')?.value || '';
    window.setTimeout(async () => {
      const row = plfEventById(id);
      if (!row || !['approved', 'rejected'].includes(status)) return;
      try {
        await plfPatchCalendarItem(row.id, plfCleanSchedulePayload(row, status, recommendation));
        if (status === 'approved' && row.revision_of) {
          const original = plfEventById(row.revision_of);
          if (original && plfIsCancellationRequest(row)) {
            await plfPatchCalendarItem(original.id, { event_status: 'cancelled', notification_status: 'unread', updated_at: new Date().toISOString() });
          } else if (original) {
            await plfPatchCalendarItem(original.id, { event_status: 'disabled', notification_status: 'read', updated_at: new Date().toISOString() });
            await plfPatchCalendarItem(row.id, { ...plfFullSchedulePayload(row), created_by: row.created_by || original.created_by, created_at: row.created_at || new Date().toISOString(), event_status: row.event_status === 'cancellation_requested' ? 'planned' : (row.event_status || 'planned'), revision_of: null, original_schedule_id: null, revision_status: null });
          }
        }
      } catch (error) { console.warn('Direct approval status save failed:', error.message); }
    }, 500);
  }, true);
}

function plfBindOrgScheduleFallback() {
  document.addEventListener('click', (event) => {
    const selected = window.CONNECT_STATE?.selectedDetails?.record;
    if (!plfOwnsSchedule(selected)) return;
    if (event.target?.id === 'detailsDeleteButton') {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      if (plfApprovedOriginal(selected)) {
        const request = plfCancellationRequest(selected);
        plfPostCalendarItem(plfOrgDbRow(request)).then(() => { document.getElementById('detailsModal')?.close(); plfToast('Removal request submitted for admin approval.', 'success'); }).catch((error) => plfToast(error.message, 'error'));
      } else {
        plfPatchCalendarItem(selected.id, { event_status: 'cancelled', updated_at: new Date().toISOString() }).then(() => { selected.event_status = 'cancelled'; document.getElementById('detailsModal')?.close(); window.CONNECT_STATE?.calendar?.refetchEvents?.(); plfToast('Schedule removed from active calendar.', 'success'); }).catch((error) => plfToast(error.message, 'error'));
      }
    }
  }, true);
  window.setInterval(plfShowOrgButtons, 500);
}

function plfInit() { plfBindApprovalPersistence(); plfBindOrgScheduleFallback(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', plfInit);
else queueMicrotask(plfInit);
