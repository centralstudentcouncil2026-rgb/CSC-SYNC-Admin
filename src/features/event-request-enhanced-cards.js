// Extracted from the embedded moduleSources object inside legacy/original-compacted/admin-dashboard.html.
// This copy is placed by responsibility for Codex readability.
// NOTE: Because it was moved into a feature folder, relative imports may need adjustment before this specific copy is runnable.

(() => {
  if (window.__eventRequestEnhancedCards) return;
  window.__eventRequestEnhancedCards = true;

  const filterState = { search: '', approval: 'all', type: 'all', organization: 'all' };
  const EVENT_REQUEST_REVIEWER_EMAILS = new Set([
    'president@aup.edu.ph',
    'cscadviser@aup.edu.ph',
    'vicepresident@aup.edu.ph',
    'gensec@aup.edu.ph',
    'finance@aup.edu.ph',
    'assocgensec@aup.edu.ph'
  ]);
  let renderTimer = 0;
  let internalRender = false;

  function store() { return window.CONNECT_STATE?.store || null; }
  function user() { const currentStore = store(); return (currentStore?.users || []).find((item) => item.id === currentStore.currentUserId) || {}; }
  function loginEmail(account = user()) { return String(account?.email || account?.login_email || account?.username || '').trim().toLowerCase(); }
  function isAdmin() { return user().role === 'super_admin'; }
  function canReviewEventRequests() { return isAdmin() && EVENT_REQUEST_REVIEWER_EMAILS.has(loginEmail()); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
  function cap(value) { return String(value || '').split('_').join(' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  function cssToken(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, ''); }
  function dateText(value) { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function timeText(value) { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function categoryName(event) { return (store()?.categories || []).find((item) => item.id === event.category_id)?.name || 'Uncategorized'; }
  function occurrenceList(event) { return Array.isArray(event.occurrences) && event.occurrences.length ? event.occurrences : [{ date: event.start_date || '', start_time: event.start_time, end_time: event.end_time }]; }
  function scheduleText(event) { const occurrences = occurrenceList(event); if (event.schedule_type === 'multi_day') { const first = occurrences[0] || {}; const last = occurrences[occurrences.length - 1] || first; return `${dateText(first.start_time || event.start_time)} to ${dateText(last.end_time || event.end_time)}`; } const first = occurrences[0] || {}; return `${dateText(first.start_time || event.start_time)} to ${timeText(first.end_time || event.end_time)}`; }
  function hasSeparateRevision(event) { return Boolean((store()?.events || []).some((item) => item.revision_of === event.id)); }
  function hasPendingRevision(event) { return Boolean((store()?.events || []).some((item) => item.revision_of === event.id && item.approval_status === 'pending')); }
  function originalEvent(event) { const id = event.revision_of || event.original_schedule_id || ''; return id ? (store()?.events || []).find((item) => item.id === id) : null; }
  function hasPendingAction(event) { return ['edit', 'remove'].includes(event.pending_action) || event.revision_status === 'cancel_pending' || event.event_status === 'cancellation_requested'; }
  function isConferenceRoomBooking(event = {}) { const values = [event.schedule_type, event.venue, event.title, event.event_type, event.booking_type, event.category_id, event.category].map((value) => String(value || '').trim().toLowerCase()); return values.includes('conference_room_booking') || values.includes('conference room'); }
  function isOwnRecord(event = {}) { const account = user(); return Boolean(event.created_by && event.created_by === account.id); }
  function isLegacySameRowPending(event) { return ['edit', 'remove'].includes(event.pending_action) && event.revision_status === 'pending' && !hasSeparateRevision(event); }
  function requestType(event) { if (event.pending_action === 'remove' || event.revision_status === 'cancel_pending' || event.event_status === 'cancellation_requested') return 'Removal Request'; if (event.pending_action === 'edit' || event.revision_of) return 'Edit Request'; return 'Schedule Request'; }
  function isPendingRequest(event) { if (event.revision_of) return event.approval_status === 'pending'; if (isLegacySameRowPending(event)) return true; return event.approval_status === 'pending' && !hasPendingAction(event); }
  function isRequestRecord(event) { if (event.record_type === 'blocked_time') return false; if (isConferenceRoomBooking(event) && isOwnRecord(event)) return false; if (!event.revision_of && hasPendingRevision(event)) return false; if (event.revision_of) return event.approval_status === 'pending'; if (hasPendingAction(event)) return isLegacySameRowPending(event); return true; }
  function statusPriority(event) { if (isPendingRequest(event)) return 0; if ((event.approval_status || event.revision_status) === 'approved') return 2; if ((event.approval_status || event.revision_status) === 'rejected') return 3; return 1; }
  function needsReview(event) { return canReviewEventRequests() && event.created_by !== user().id && isPendingRequest(event); }
  function row(label, value) { if (value == null || String(value).trim() === '') return ''; return `<div class="er-detail-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`; }
  function requestCard(event) { const status = event.approval_status || 'pending'; const type = requestType(event); const review = needsReview(event); const details = [row('Organization', event.organization_name), row('Category', categoryName(event)), row('Venue', event.venue), row('Schedule', scheduleText(event)), row('Attendees', event.expected_attendees), row('Privacy Level', privacyText(event)), row('Description', event.public_description), row('Purpose', event.purpose), row('Person in charge', event.contact_person), row('Phone Number', event.contact_info), row('Request type', type), row('Recommendation', event.admin_recommendation)].join(''); return `<article class="event-request-detail-card" data-request-id="${esc(event.id)}" data-approval="${esc(status)}" data-request-type="${esc(type)}" data-pending="${isPendingRequest(event) ? 'true' : 'false'}"><div class="er-card-header"><div><h3>${esc(event.title || 'Untitled Schedule')} ${type === 'Edit Request' ? '<span class="er-edit-badge">Edit Request</span>' : ''}</h3><p>${esc(categoryName(event))} - ${esc(event.venue || 'No venue')}</p></div><span class="status-pill ${cssToken(status)}">${esc(cap(status))}</span></div>${type === 'Edit Request' ? editSummaryHtml(event) : ''}<dl class="er-details-grid">${details}</dl><div class="er-card-actions">${review ? `<button type="button" class="danger-button" data-action="event-reject" data-id="${esc(event.id)}">Reject</button><button type="button" class="primary-button" data-action="event-approve" data-id="${esc(event.id)}">Approve</button>` : ''}</div></article>`; }
  function privacyText(event) { return event.privacy_level === 'internal' ? 'Admin only' : cap(event.privacy_level || 'public'); }
  function detailMap(event) { return { Title: event.title, Category: categoryName(event), Venue: event.venue, Schedule: scheduleText(event), Attendees: event.expected_attendees, 'Privacy Level': privacyText(event), Description: event.public_description, Purpose: event.purpose, 'Person in charge': event.contact_person, 'Phone Number': event.contact_info }; }
  function sameValue(a, b) { return String(a == null ? '' : a).trim() === String(b == null ? '' : b).trim(); }
  function editSummaryHtml(event) {
    const original = originalEvent(event);
    if (!original) return '<section class="er-edit-summary"><strong>Requested edit</strong><p>This request updates an existing schedule. Review the details below before approving.</p></section>';
    const before = detailMap(original);
    const after = detailMap(event);
    const changes = Object.keys(after).filter((label) => !sameValue(before[label], after[label]));
    if (!changes.length) return '<section class="er-edit-summary"><strong>Requested edit</strong><p>No visible field changes were detected. Check the full details before approving.</p></section>';
    return `<section class="er-edit-summary"><strong>Requested changes</strong>${changes.map((label) => `<div class="er-edit-change"><span>${esc(label)}</span><del>${esc(before[label] || 'Blank')}</del><ins>${esc(after[label] || 'Blank')}</ins></div>`).join('')}</section>`;
  }
  function matches(event) { const haystack = `${event.title || ''} ${event.organization_name || ''} ${event.venue || ''} ${event.public_description || ''} ${event.purpose || ''}`.toLowerCase(); if (filterState.search && !haystack.includes(filterState.search)) return false; if (filterState.approval !== 'all') { const pendingAction = ['edit', 'remove'].includes(event.pending_action) && event.revision_status === 'pending'; if (filterState.approval === 'pending') { if (!(event.approval_status === 'pending' || pendingAction)) return false; } else if (event.approval_status !== filterState.approval && event.revision_status !== filterState.approval) return false; } if (filterState.type !== 'all' && requestType(event).toLowerCase().split(' ')[0] !== filterState.type) return false; if (filterState.organization !== 'all' && event.organization_id !== filterState.organization) return false; return true; }
  function requestEvents() { return [...(store()?.events || [])].filter(isRequestRecord).filter(matches).sort((a, b) => statusPriority(a) - statusPriority(b) || new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)); }
  function ensureFilters() {
    const modal = document.getElementById('eventRequestsModal');
    const list = document.getElementById('eventRequestsList');
    if (!modal || !list) return;
    let tools = modal.querySelector('.admin-tab-header-tools');
    if (!tools) {
      const header = modal.querySelector('.modal-header');
      if (header) {
        tools = document.createElement('div');
        tools.className = 'admin-tab-header-tools';
        const closeButton = header.querySelector('.icon-button[data-close]');
        header.insertBefore(tools, closeButton || null);
      }
    }
    let filters = modal.querySelector('#eventRequestFilters');
    if (!filters) {
      const orgs = (store()?.organizations || []).map((org) => `<option value="${esc(org.id)}">${esc(org.organization_name)}</option>`).join('');
      filters = document.createElement('div');
      filters.id = 'eventRequestFilters';
      filters.className = 'event-request-filters';
      filters.innerHTML = `<label title="Search event requests">Search<input id="erFilterSearch" type="search" placeholder="Search title, org, venue..." aria-label="Search event requests"></label><label>Approval<select id="erFilterApproval" aria-label="Filter by approval"><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><label>Request Type<select id="erFilterType" aria-label="Filter by request type"><option value="all">All Types</option><option value="schedule">Schedule</option><option value="edit">Edit</option><option value="removal">Removal</option></select></label><label>Organization<select id="erFilterOrg" aria-label="Filter by organization"><option value="all">All Organizations</option>${orgs}</select></label>`;
    }
    if (tools && filters.parentElement !== tools) tools.appendChild(filters);
    else if (!tools && filters.parentElement !== list.parentElement) list.parentElement.insertBefore(filters, list);
    if (filters.dataset.filterBound !== '1') {
      filters.addEventListener('input', readFilters);
      filters.addEventListener('change', readFilters);
      filters.dataset.filterBound = '1';
    }
  }
  function readFilters() { filterState.search = (document.getElementById('erFilterSearch')?.value || '').trim().toLowerCase(); filterState.approval = document.getElementById('erFilterApproval')?.value || 'all'; filterState.type = document.getElementById('erFilterType')?.value || 'all'; filterState.organization = document.getElementById('erFilterOrg')?.value || 'all'; render(true); }
  function render(force = false) { if (!isAdmin()) return; const list = document.getElementById('eventRequestsList'); const modal = document.getElementById('eventRequestsModal'); if (!list || !modal || (!modal.open && !modal.classList.contains('is-active'))) return; ensureFilters(); bindHorizontalScroll(list); const events = requestEvents(); const signature = JSON.stringify(events.map((event) => [event.id, event.updated_at, event.approval_status, event.revision_status, event.pending_action, event.title, statusPriority(event)])); if (!force && list.dataset.enhancedSignature === signature && list.classList.contains('event-request-detail-grid')) return; list.dataset.enhancedSignature = signature; internalRender = true; list.className = 'activity-list event-request-detail-grid'; list.innerHTML = events.length ? events.map(requestCard).join('') : '<div class="activity-item"><strong>No matching event requests.</strong></div>'; internalRender = false; }
  function bindHorizontalScroll(scroller) {
    if (!scroller || scroller.dataset.horizontalWheelBound === '1') return;
    scroller.dataset.horizontalWheelBound = '1';
    scroller.addEventListener('wheel', (event) => {
      if (scroller.scrollWidth <= scroller.clientWidth) return;
      if (window.matchMedia?.('(max-width: 860px)').matches) return;
      const before = scroller.scrollLeft;
      const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const atStart = before <= 0 && delta < 0;
      const atEnd = before >= max && delta > 0;
      if (atStart || atEnd) {
        event.preventDefault();
        return;
      }
      scroller.scrollLeft = Math.max(0, Math.min(max, before + delta));
      if (scroller.scrollLeft !== before) event.preventDefault();
    }, { passive: false });
  }
  function scheduleRender(force = false) {
    if (internalRender) return;
    clearTimeout(renderTimer);
    if (force) {
      renderTimer = 0;
      queueMicrotask(() => render(true));
      return;
    }
    renderTimer = setTimeout(() => render(false), 80);
  }
  function style() { if (document.getElementById('event-request-enhanced-style')) return; const s = document.createElement('style'); s.id = 'event-request-enhanced-style'; s.textContent = `.event-request-filters{display:grid;grid-template-columns:minmax(180px,1.2fr) repeat(3,minmax(130px,.85fr));gap:12px;margin-bottom:16px;background:transparent;border:0;border-radius:0;box-shadow:none;padding:0}.event-request-filters label{display:flex;flex-direction:column;gap:6px;color:#475569;font-weight:700;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em}.event-request-filters input,.event-request-filters select{min-height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;background:#f8fafc;color:#0f172a;font:inherit;text-transform:none;letter-spacing:0}.event-request-detail-grid{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:stretch!important;gap:clamp(10px,1.2vw,16px)!important;min-height:0!important;overflow-x:auto!important;overflow-y:hidden!important;padding:2px 2px 16px!important;scroll-snap-type:x proximity!important;scroll-padding-inline:6px!important}.event-request-detail-card{background:#fff;border:1px solid #dbe4ef;border-radius:20px;box-shadow:0 18px 46px rgba(15,23,42,.1);display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;gap:8px!important;flex:0 0 clamp(300px,31vw,430px)!important;min-width:300px!important;max-width:clamp(300px,31vw,430px)!important;height:100%!important;max-height:100%!important;min-height:0!important;overflow:hidden!important;padding:clamp(10px,1vw,14px)!important;scroll-snap-align:start;white-space:normal}.event-request-detail-card[data-pending="true"]{border-color:#f4b400!important;box-shadow:0 18px 46px rgba(202,138,4,.16)!important}.er-card-head{display:grid;gap:6px;border-bottom:1px solid #e2e8f0;padding-bottom:8px}.er-card-head strong{color:#0f172a;font-size:clamp(15px,1.05vw,18px);line-height:1.15;overflow-wrap:anywhere}.er-card-badges{display:flex;gap:6px;flex-wrap:wrap}.er-status-badge{border-radius:999px;padding:4px 8px;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;background:#eef2ff;color:#1d4ed8}.er-status-badge.pending{background:#fffbeb;color:#b45309}.er-status-badge.approved{background:#ecfdf5;color:#047857}.er-status-badge.rejected{background:#fef2f2;color:#b91c1c}.er-detail-list{display:grid;gap:5px;min-height:0;overflow-x:hidden;overflow-y:auto;padding-right:2px}.er-detail-row{display:grid;grid-template-columns:minmax(92px,.42fr) minmax(0,1fr);gap:6px;align-items:start}.er-detail-row dt{color:#475569;font-weight:800;font-size:clamp(10px,.62vw,12px);line-height:1.08;text-transform:uppercase;letter-spacing:.04em}.er-detail-row dd{margin:0;color:#1f2937;overflow-wrap:anywhere;word-break:break-word;font-size:clamp(12px,.8vw,14px);line-height:1.18}.er-card-actions{display:flex;gap:6px;justify-content:flex-end;align-items:center;flex-wrap:nowrap;margin-top:0;padding-top:8px;border-top:1px solid #e2e8f0;position:static}.er-card-actions button{border-radius:999px;flex:0 0 auto;min-width:72px;min-height:34px;padding:0 10px;font-size:clamp(11px,.72vw,13px);white-space:nowrap}@media(min-width:761px){#eventRequestsModal .modal-card>:not(.modal-header){overflow:hidden!important;padding:clamp(8px,1.1vw,14px)!important}.event-request-detail-grid{height:calc(100dvh - clamp(84px,8.5vw,112px) - clamp(18px,2vw,32px))!important;max-height:calc(100dvh - clamp(84px,8.5vw,112px) - clamp(18px,2vw,32px))!important}}@media(max-width:760px){.event-request-filters{grid-template-columns:1fr}.event-request-detail-grid{flex-direction:column!important;flex-wrap:nowrap!important;gap:14px!important;height:auto!important;max-height:none!important;overflow-x:hidden!important;overflow-y:auto!important;padding:2px 2px 20px!important;scroll-snap-type:none!important}.event-request-detail-card{display:flex!important;flex:0 0 auto!important;min-width:0!important;max-width:none!important;width:100%!important;height:auto!important;max-height:none!important;min-height:auto!important;overflow:visible!important;border-radius:20px;padding:16px!important}.er-detail-list{overflow:visible}.er-detail-row{grid-template-columns:1fr;gap:4px}.er-card-actions{justify-content:stretch;flex-wrap:wrap}.er-card-actions button{flex:1 1 120px;min-height:38px}}`; document.head.appendChild(s); }
  function compactEventRequestStyle() {
    if (document.getElementById('event-request-compact-fill-style')) return;
    const s = document.createElement('style');
    s.id = 'event-request-compact-fill-style';
    s.textContent = `
      #eventRequestsModal.admin-tab-page .modal-header{
        align-items:center!important;
        border-bottom:1px solid #2563eb!important;
        gap:10px!important;
        grid-template-columns:54px minmax(260px,.58fr) minmax(520px,1.42fr) 54px!important;
        min-height:58px!important;
        padding:14px 18px 12px!important;
      }
      #eventRequestsModal.admin-tab-page .modal-header>div:not(.admin-tab-header-tools){
        grid-column:2!important;
        justify-self:start!important;
        text-align:left!important;
      }
      #eventRequestsModal.admin-tab-page .modal-header h3{
        font-size:clamp(1rem,1.35vw,1.25rem)!important;
        line-height:1.1!important;
        margin:0!important;
      }
      #eventRequestsModal.admin-tab-page .admin-tab-header-tools{
        grid-column:3!important;
        align-items:center!important;
        min-width:0!important;
      }
      #eventRequestsModal.admin-tab-page .event-request-filters{
        display:grid!important;
        grid-template-columns:minmax(220px,1.25fr) repeat(3,minmax(150px,.85fr))!important;
        gap:8px!important;
        margin:0!important;
        width:100%!important;
      }
      #eventRequestsModal.admin-tab-page .event-request-filters label{
        font-size:.62rem!important;
        gap:3px!important;
        letter-spacing:.04em!important;
      }
      #eventRequestsModal.admin-tab-page .event-request-filters input,
      #eventRequestsModal.admin-tab-page .event-request-filters select{
        font-size:.86rem!important;
        min-height:32px!important;
        padding-inline:12px!important;
        border-radius:999px!important;
      }
      #eventRequestsModal.admin-tab-page.is-active{
        overflow-x:hidden!important;
        overflow-y:hidden!important;
      }
      #eventRequestsModal.admin-tab-page .modal-card{
        display:grid!important;
        grid-template-rows:58px minmax(0,1fr)!important;
        height:100dvh!important;
        min-height:100dvh!important;
        min-width:0!important;
        overflow:hidden!important;
        width:100vw!important;
      }
      #eventRequestsModal.admin-tab-page .modal-card>:not(.modal-header){
        min-height:0!important;
        overflow:hidden!important;
        padding:20px 20px 0!important;
      }
      #eventRequestsModal .event-request-detail-grid{
        align-items:stretch!important;
        box-sizing:border-box!important;
        height:calc(100dvh - 58px)!important;
        max-height:calc(100dvh - 58px)!important;
        min-height:calc(100dvh - 58px)!important;
        max-width:calc(100vw - 40px)!important;
        min-width:0!important;
        width:calc(100vw - 40px)!important;
        overscroll-behavior-x:contain!important;
        overflow-x:scroll!important;
        overflow-y:hidden!important;
        padding-bottom:0!important;
        scrollbar-color:#2563eb #e5edf7!important;
        scrollbar-width:thin!important;
        touch-action:pan-x!important;
        -webkit-overflow-scrolling:touch!important;
      }
      #eventRequestsModal .event-request-detail-grid::-webkit-scrollbar{
        display:block!important;
        height:12px!important;
        width:12px!important;
      }
      #eventRequestsModal .event-request-detail-grid::-webkit-scrollbar-track{
        background:#e5edf7!important;
        display:block!important;
        border-radius:999px!important;
      }
      #eventRequestsModal .event-request-detail-grid::-webkit-scrollbar-thumb{
        background:#2563eb!important;
        border:3px solid #e5edf7!important;
        display:block!important;
        border-radius:999px!important;
      }
      #eventRequestsModal .event-request-detail-card{
        align-self:stretch!important;
        display:grid!important;
        grid-template-rows:auto auto minmax(0,1fr) auto!important;
        height:100%!important;
        min-height:100%!important;
        padding:14px!important;
      }
      #eventRequestsModal .er-card-header{
        display:grid!important;
        gap:8px!important;
        min-height:0!important;
      }
      #eventRequestsModal .er-card-header h3{
        font-size:clamp(1rem,1.15vw,1.22rem)!important;
        line-height:1.12!important;
        margin:0!important;
      }
      #eventRequestsModal .er-card-header p{
        font-size:.92rem!important;
        line-height:1.2!important;
        margin:0!important;
      }
      #eventRequestsModal .status-pill{
        align-items:center!important;
        align-self:start!important;
        display:inline-flex!important;
        font-size:.74rem!important;
        line-height:1!important;
        min-height:24px!important;
        padding:0 10px!important;
        width:max-content!important;
      }
      #eventRequestsModal .er-edit-badge{
        background:#fff7ed!important;
        border:1px solid #fdba74!important;
        border-radius:999px!important;
        color:#9a3412!important;
        display:inline-flex!important;
        font-size:.66rem!important;
        font-weight:800!important;
        line-height:1!important;
        margin-left:6px!important;
        padding:5px 8px!important;
        vertical-align:middle!important;
        white-space:nowrap!important;
      }
      #eventRequestsModal .er-edit-summary{
        background:#fff7ed!important;
        border:1px solid #fed7aa!important;
        border-radius:12px!important;
        display:grid!important;
        gap:5px!important;
        margin:0!important;
        padding:8px!important;
      }
      #eventRequestsModal .er-edit-summary>strong{
        color:#9a3412!important;
        font-size:.7rem!important;
        letter-spacing:.04em!important;
        line-height:1!important;
        text-transform:uppercase!important;
      }
      #eventRequestsModal .er-edit-summary p{
        color:#475569!important;
        font-size:.76rem!important;
        line-height:1.2!important;
        margin:0!important;
      }
      #eventRequestsModal .er-edit-change{
        display:grid!important;
        grid-template-columns:92px minmax(0,1fr) minmax(0,1fr)!important;
        gap:5px!important;
        align-items:start!important;
      }
      #eventRequestsModal .er-edit-change span,
      #eventRequestsModal .er-edit-change del,
      #eventRequestsModal .er-edit-change ins{
        border-radius:8px!important;
        font-size:.72rem!important;
        line-height:1.15!important;
        min-width:0!important;
        overflow-wrap:anywhere!important;
        padding:4px 6px!important;
      }
      #eventRequestsModal .er-edit-change span{
        color:#7c2d12!important;
        font-weight:800!important;
        padding-left:0!important;
      }
      #eventRequestsModal .er-edit-change del{
        background:#fff!important;
        color:#64748b!important;
        text-decoration:line-through!important;
      }
      #eventRequestsModal .er-edit-change ins{
        background:#ffedd5!important;
        color:#0f172a!important;
        font-weight:700!important;
        text-decoration:none!important;
      }
      #eventRequestsModal .er-details-grid{
        display:grid!important;
        gap:3px!important;
        min-height:0!important;
        overflow:auto!important;
        padding-right:4px!important;
      }
      #eventRequestsModal .er-detail-row{
        grid-template-columns:minmax(116px,.42fr) minmax(0,1fr)!important;
        gap:8px!important;
      }
      #eventRequestsModal .er-detail-row dt{
        font-size:.7rem!important;
        line-height:1.08!important;
      }
      #eventRequestsModal .er-detail-row dd{
        font-size:.82rem!important;
        line-height:1.12!important;
      }
      #eventRequestsModal .er-card-actions{
        border-top:0!important;
        box-sizing:border-box!important;
        display:flex!important;
        gap:6px!important;
        justify-content:stretch!important;
        margin-top:auto!important;
        max-width:100%!important;
        min-width:0!important;
        overflow:visible!important;
        padding-top:0!important;
        width:100%!important;
      }
      #eventRequestsModal .er-card-actions button{
        align-items:center!important;
        border-radius:999px!important;
        box-sizing:border-box!important;
        display:inline-flex!important;
        flex:1 1 0!important;
        font-size:clamp(.7rem,.78vw,.82rem)!important;
        justify-content:center!important;
        min-height:32px!important;
        min-width:0!important;
        overflow:hidden!important;
        padding:0 6px!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
        width:auto!important;
      }
      @media(max-width:980px){
        #eventRequestsModal.admin-tab-page .modal-header{
          grid-template-columns:44px minmax(0,1fr) 44px!important;
          min-height:58px!important;
          padding:10px 12px!important;
        }
        #eventRequestsModal.admin-tab-page .modal-header>div:not(.admin-tab-header-tools){
          grid-column:2!important;
          justify-self:center!important;
          text-align:center!important;
        }
        #eventRequestsModal.admin-tab-page .admin-tab-header-tools{
          grid-column:1 / -1!important;
        }
        #eventRequestsModal.admin-tab-page .event-request-filters{
          grid-template-columns:1fr!important;
        }
        #eventRequestsModal .event-request-detail-grid{
          height:auto!important;
          max-height:none!important;
          min-height:0!important;
        }
      }
      @media(max-width:860px){
        #eventRequestsModal.admin-tab-page.is-active{
          overflow-x:hidden!important;
          overflow-y:auto!important;
        }
        #eventRequestsModal.admin-tab-page .modal-card{
          min-width:0!important;
          overflow:hidden!important;
          width:100vw!important;
        }
        #eventRequestsModal.admin-tab-page .modal-card>:not(.modal-header){
          overflow:auto!important;
        }
        #eventRequestsModal #eventRequestsList.event-request-detail-grid,
        #eventRequestsModal .event-request-detail-grid{
          display:flex!important;
          flex-direction:column!important;
          flex-wrap:nowrap!important;
          gap:12px!important;
          overflow-x:hidden!important;
          overflow-y:auto!important;
          padding:2px 2px 20px!important;
          scroll-snap-type:none!important;
          scrollbar-width:auto!important;
          cursor:default!important;
          touch-action:pan-y!important;
          min-width:0!important;
          width:100%!important;
        }
        #eventRequestsModal .event-request-detail-card{
          flex:0 0 auto!important;
          height:auto!important;
          max-width:none!important;
          min-height:auto!important;
          min-width:0!important;
          width:100%!important;
        }
      }
      @media(max-width:760px){
        #eventRequestsModal.admin-tab-page .modal-header{
          display:grid!important;
          grid-template-areas:"back tools"!important;
          grid-template-columns:34px minmax(0,1fr)!important;
          grid-template-rows:36px!important;
          gap:0 6px!important;
          min-height:50px!important;
          padding:7px 8px!important;
        }
        #eventRequestsModal.admin-tab-page .portal-tab-back{
          grid-area:back!important;
          height:34px!important;
          min-height:34px!important;
          min-width:34px!important;
          width:34px!important;
        }
        #eventRequestsModal.admin-tab-page .modal-header>div:not(.admin-tab-header-tools){
          display:none!important;
        }
        #eventRequestsModal.admin-tab-page .modal-header h3{
          display:none!important;
        }
        #eventRequestsModal.admin-tab-page .admin-tab-header-tools{
          grid-area:tools!important;
          align-self:center!important;
          min-width:0!important;
          overflow:hidden!important;
          width:100%!important;
        }
        #eventRequestsModal.admin-tab-page .event-request-filters{
          align-items:center!important;
          display:grid!important;
          grid-template-columns:32px repeat(3,minmax(0,1fr))!important;
          gap:4px!important;
          margin:0!important;
          min-width:0!important;
          overflow:hidden!important;
          width:100%!important;
        }
        #eventRequestsModal.admin-tab-page .event-request-filters label{
          font-size:0!important;
          gap:0!important;
          min-width:0!important;
          overflow:hidden!important;
          width:100%!important;
        }
        #eventRequestsModal.admin-tab-page .event-request-filters input,
        #eventRequestsModal.admin-tab-page .event-request-filters select{
          border-radius:999px!important;
          box-sizing:border-box!important;
          font-size:.66rem!important;
          height:32px!important;
          min-height:32px!important;
          min-width:0!important;
          overflow:hidden!important;
          padding:0 7px!important;
          text-overflow:ellipsis!important;
          width:100%!important;
        }
        #eventRequestsModal.admin-tab-page .event-request-filters label:first-child input{
          color:transparent!important;
          padding:0!important;
        }
        #eventRequestsModal .er-edit-change{
          grid-template-columns:1fr!important;
        }
      }
    `;
    document.head.appendChild(s);
  }
  function responsiveScrollStyle() {
    if (document.getElementById('event-request-responsive-scroll-style')) return;
    const s = document.createElement('style');
    s.id = 'event-request-responsive-scroll-style';
    s.textContent = `
      @media(min-width:861px){
        body.admin-dashboard-shell #eventRequestsModal.admin-tab-page .modal-card>#eventRequestsList.event-request-detail-grid{
          display:flex!important;
          flex-direction:row!important;
          flex-wrap:nowrap!important;
          max-width:100vw!important;
          min-width:0!important;
          overflow-x:auto!important;
          overflow-y:hidden!important;
          overscroll-behavior-x:none!important;
          padding:20px 20px 16px!important;
          scroll-behavior:auto!important;
          scroll-snap-type:none!important;
          scrollbar-color:#2563eb #e5edf7!important;
          scrollbar-gutter:stable!important;
          scrollbar-width:thin!important;
          touch-action:pan-x!important;
          width:100vw!important;
          -webkit-overflow-scrolling:touch!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.admin-tab-page .modal-card>#eventRequestsList.event-request-detail-grid::-webkit-scrollbar{
          display:block!important;
          height:12px!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.admin-tab-page .modal-card>#eventRequestsList.event-request-detail-grid::-webkit-scrollbar-track{
          background:#e5edf7!important;
          border-radius:999px!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.admin-tab-page .modal-card>#eventRequestsList.event-request-detail-grid::-webkit-scrollbar-thumb{
          background:#2563eb!important;
          border:3px solid #e5edf7!important;
          border-radius:999px!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.admin-tab-page .modal-card>#eventRequestsList.event-request-detail-grid>.event-request-detail-card{
          scroll-snap-align:none!important;
        }
      }
      @media(max-width:860px){
        body.admin-dashboard-shell #eventRequestsModal.admin-tab-page .modal-card>#eventRequestsList.event-request-detail-grid{
          display:flex!important;
          flex-direction:column!important;
          flex-wrap:nowrap!important;
          height:auto!important;
          max-height:none!important;
          min-height:0!important;
          min-width:0!important;
          overflow-x:hidden!important;
          overflow-y:auto!important;
          padding:12px!important;
          scroll-snap-type:none!important;
          touch-action:pan-y!important;
          width:100%!important;
        }
      }
    `;
    document.head.appendChild(s);
  }
  function init() { style(); compactEventRequestStyle(); responsiveScrollStyle(); document.addEventListener('click', (event) => { if (event.target.closest('#eventRequestsButton')) setTimeout(() => scheduleRender(true), 0); }, true); window.addEventListener('csc:event-requests-render-requested', () => scheduleRender(true)); const modal = document.getElementById('eventRequestsModal'); if (modal) new MutationObserver(() => scheduleRender(false)).observe(modal, { attributes: true, attributeFilter: ['open', 'class'] }); window.addEventListener('resize', () => scheduleRender(false), { passive: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else queueMicrotask(init);
})();
