import { bindCalendarBlocks, calendarBlockValues, saveCalendarSchedule } from "./shared/calendar-blocks.js";
import { calendarOrganizationOptions, matchesCalendarOrganization } from "./shared/calendar-organization-filter.js";
import { renderOrganizerContact, mountOrganizerContacts } from "./shared/organizer-contact.js?v=20261022-dashboard-contact";
import { normalizeMessengerLink } from "./shared/contact-links.js?v=20261022-messenger";
import { calendarScheduleLabel, renderMainCalendarStrip } from "./shared/main-calendar.js?v=20261022-title-first";
import { CONFERENCE_SLOT_COUNT, renderRoomBookingCard } from "./shared/room-booking-card.js";
import { captureFormView, captureSidePanelScroll, deferFormRender } from "./shared/form-view.js?v=20261021-panel-scroll";
import { bindFormDraft, clearFormDraft } from "./shared/form-drafts.js";
import { createCollectionRefresh } from "./shared/collection-refresh.js";
import { loadNotificationTarget, changeRequestSummary } from "./shared/notification-target.js?v=20261021-edit-comparison";
import { createBookingRefresh } from "./shared/booking-refresh.js";
import { mountPersonalRoom } from "./shared/personal-room.js?v=20261022-viewer-contacts";
import { bindSchedulePopupColors } from "./shared/schedule-popups.js";
import { adjacentMonth, bindScheduleValidation, requireValidSchedule } from "./shared/schedule-controls.js";
import { monthSegments, renderMonthRows, bindMonthOverflow } from "./shared/calendar-layout.js?v=20261020-fit-strips";
const SUPABASE_URL = "https://udnyppmvkklcbyylqsxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_d9-iqfjWlUdXUaj1qfwDag_VUp-wheE";
const API_URL = `${SUPABASE_URL}/rest/v1`;
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const SESSION_KEY = "csc-sync-admin-session";
const LOGIN_DRAFT = { name: 'admin-login-in-progress' };
// Discard the old draft that persisted even after a completed login/logout.
clearFormDraft({ name: 'admin-login' });
const UI_KEY = "csc-sync-admin-ui";
const ROOM_SLOT_MINUTES = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const BACK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg>`;
const PREV_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>`;
const NEXT_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>`;
const categories = ["Worship", "Gathering", "Outreach", "Others"];

const root = document.querySelector("#admin-app");
const state = {
  session: loadSession(),
  route: "/calendar",
  selectedDate: manilaDate(new Date().toISOString()),
  calendarView: "month",
  accountFilter: "all",
  selectedAccountId: "",
  modal: null,
  detailEventId: "",
  detailEventStartsAt: "",
  detailEventEndsAt: "",
  detailBookingId: "",
  detailBookingStartsAt: "",
  detailBookingEndsAt: "",
  sidePanelOpen: false,
  draft: {},
  loading: false,
  dataLoadError: "",
  hasLoadedData: false,
  calendarSaving: false,
  bookingsLoading: false,
  bookingsLoadError: "",
  toast: null,
  announcementDraft: { title: "", body: "" },
  announcementPosting: false,
  deletingAnnouncementId: "",
  announcementNotice: null,
  profileDrafts: {},
  profileSavingId: "",
  profileNotices: {},
  authView: 'login',
  authSubmitting: false,
  loginEmail: '',
  adminSignupDraft: loadAdminSignupDraft(),
  adminRegistrationBusy: '',
  adminRegistrationLoadError: '',
  data: emptyData(),
  ...loadAdminUi(),
};

function emptyData() {
  return {
    calendarBlocks: [],
    accounts: [],
    events: [],
    eventRevisions: [],
    bookings: [],
    concerns: [],
    accountRequests: [],
    announcements: [],
    notifications: [],
    adminRegistrations: [],
  };
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") || null;
  } catch {
    return null;
  }
}

function loadAdminSignupDraft() {
  try { return JSON.parse(localStorage.getItem('csc-sync-admin-signup-draft') || '{}') || {}; }
  catch { return {}; }
}

function loadAdminUi() {
  try {
    const saved = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    const allowedRoutes = new Set(["/calendar", "/rooms", "/personal-room", "/concerns", "/profiles", "/announcements"]);
    return {
      route: allowedRoutes.has(saved.route) ? saved.route : "/calendar",
      selectedDate: saved.route === "/rooms" ? manilaDate(new Date().toISOString()) : saved.selectedDate || manilaDate(new Date().toISOString()),
      calendarView: ["month", "year"].includes(saved.calendarView) ? saved.calendarView : "month",
      accountFilter: saved.accountFilter === "selected" ? "selected" : "all",
      selectedAccountId: saved.selectedAccountId || "",
      modal: saved.modal || null,
      dayScheduleDate: saved.dayScheduleDate || saved.selectedDate,
      detailEventId: saved.detailEventId || "",
      detailEventStartsAt: saved.detailEventStartsAt || "",
      detailEventEndsAt: saved.detailEventEndsAt || "",
      detailBookingId: saved.detailBookingId || "",
      detailBookingStartsAt: saved.detailBookingStartsAt || "",
      detailBookingEndsAt: saved.detailBookingEndsAt || "",
      sidePanelOpen: false,
      draft: saved.draft && typeof saved.draft === "object" ? saved.draft : {},
      announcementDraft: saved.announcementDraft && typeof saved.announcementDraft === "object" ? saved.announcementDraft : { title: "", body: "" },
      profileDrafts: saved.profileDrafts && typeof saved.profileDrafts === 'object' ? saved.profileDrafts : {},
      toast: null,
    };
  } catch {
    return {};
  }
}

function saveAdminUi() {
  if (!state.session) return;
  localStorage.setItem(UI_KEY, JSON.stringify({
    route: state.route,
    selectedDate: state.selectedDate,
    calendarView: state.calendarView,
    accountFilter: state.accountFilter,
    selectedAccountId: state.selectedAccountId,
    modal: state.modal,
    dayScheduleDate: state.dayScheduleDate,
    detailEventId: state.detailEventId,
    detailEventStartsAt: state.detailEventStartsAt,
    detailEventEndsAt: state.detailEventEndsAt,
    detailBookingId: state.detailBookingId,
    detailBookingStartsAt: state.detailBookingStartsAt,
    detailBookingEndsAt: state.detailBookingEndsAt,
    draft: state.draft,
    announcementDraft: state.announcementDraft,
    profileDrafts: state.profileDrafts,
  }));
}

function clearAdminUi() {
  localStorage.removeItem(UI_KEY);
}

function saveSession(session) {
  state.session = session;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function supabaseRequest(pathOrUrl, options = {}) {
  const token = state.session?.accessToken || SUPABASE_KEY;
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_URL}${pathOrUrl}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(payload?.msg || payload?.message || payload?.error_description || response.statusText);
    error.code = payload?.code;
    error.details = payload?.details;
    throw error;
  }
  return payload;
}

async function optionalTable(path, options = {}) {
  try {
    return await supabaseRequest(path, options);
  } catch {
    return [];
  }
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatNotificationDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function dateFromIso(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function sortDates(first, second) {
  return first <= second ? [first, second] : [second, first];
}

function addDays(value, days) {
  const date = dateFromIso(value);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function dateParts(value) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function monthTitle(dateString) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "long", year: "numeric" }).format(new Date(`${dateString}T00:00:00+08:00`));
}

function timeToMinutes(value) {
  const [hours = 0, minutes = 0] = String(value || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function roleMap(rows) {
  const ranks = { registered: 0, reviewer: 1, administrator: 2 };
  return rows.reduce((roles, row) => {
    if (!(row.user_id in roles) || (ranks[row.role] ?? -1) > (ranks[roles[row.user_id]] ?? -1)) roles[row.user_id] = row.role;
    return roles;
  }, {});
}

function accountById(id) {
  return state.data.accounts.find((account) => account.id === id);
}

function isAdminCreatedEvent(event) {
  if (!event) return false;
  const creatorId = event.creatorAccountId || event.ownerAccountId;
  return event.adminCreated === true || creatorId === state.session?.accountId || ['administrator', 'admin'].includes(accountById(creatorId)?.role);
}

function isAdminCreatedBooking(booking) {
  if (!booking) return false;
  const creatorId = booking.creatorAccountId || booking.ownerAccountId;
  return creatorId === state.session?.accountId || ['administrator', 'admin'].includes(accountById(creatorId)?.role);
}

function requireAdminBooking(bookingId) {
  const booking = state.data.bookings.find(item => item.id === bookingId);
  if (!booking || booking.status === 'cancelled') throw new Error('This reservation is no longer available.');
  if (!isAdminCreatedBooking(booking)) throw new Error('Organization bookings must use the approval actions.');
  return booking;
}

function requireEventApprovalFlow(eventId) {
  if (isAdminCreatedEvent(state.data.events.find(event => event.id === eventId))) {
    throw new Error('Admin-created schedules do not require approval. Use Edit or Delete.');
  }
}

function selectedOption(value, expected) {
  return value === expected ? "selected" : "";
}

function currentAdminAccount() {
  return accountById(state.session?.accountId) || {
    id: state.session?.accountId || "",
    officerName: "CSC Administrator",
    organizationName: "Central Student Council",
    phone: "",
  };
}

function mapProfile(row, roles) {
  return {
    id: row.account_id,
    officerName: row.officer_name || "",
    organizationName: row.organization_name || "",
    councilName: row.council_name || '',
    phone: row.phone || "",
    messengerUrl: row.messenger_url || '',
    profileImageUrl: row.profile_image_url || "",
    active: row.active !== false,
    role: roles[row.account_id] || "registered",
  };
}

function mapRevision(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    requestType: row.request_type,
    previousValues: row.previous_values || {},
    proposedValues: row.proposed_values || {},
    requesterId: row.requester_id,
    status: row.status || "pending",
  };
}

function mapNotification(row) {
  return {
    id: row.id,
    recipientAccountId: row.recipient_account_id,
    targetType: row.target_type || "",
    targetId: row.target_id || "",
    message: row.message || "",
    createdAt: row.created_at || "",
    readAt: row.read_at || "",
  };
}

function mapEvent(row, occurrence = {}, series = {}, revision = null, roles = {}) {
  const adminCreated = roles[row.creator_account_id] === 'administrator';
  return {
    id: row.id,
    ownerAccountId: row.owner_account_id,
    creatorAccountId: row.creator_account_id,
    adminCreated,
    title: row.title || "",
    category: row.category || "",
    otherCategoryDetail: row.other_category_detail || "",
    venue: row.venue || "",
    startsAt: occurrence.starts_at || row.starts_at || "",
    endsAt: occurrence.ends_at || row.ends_at || "",
    frequency: series.frequency || row.frequency || "none",
    repeatUntil: series.repeat_until || row.repeat_until || "",
    expectedAttendees: row.expected_attendees || "",
    visibility: row.visibility || "internal",
    publicDescription: row.public_description || "",
    purpose: row.purpose || "",
    status: row.status || "pending",
    version: row.version || 1,
    pendingRevision: adminCreated ? null : revision,
    hasPendingRevision: !adminCreated && Boolean(revision),
  };
}

function mapBooking(row) {
  const startTime = manilaTime(row.starts_at);
  const endTime = manilaTime(row.ends_at);
  return {
    id: row.id,
    version: row.version || 1,
    pendingRevision: row.booking_revisions?.find(revision => revision.status === "pending") || null,
    ownerAccountId: row.owner_account_id,
    creatorAccountId: row.creator_account_id,
    selectedDate: row.selected_date || manilaDate(row.starts_at),
    startsAt: row.starts_at || "",
    endsAt: row.ends_at || "",
    startTime,
    endTime,
    frequency: row.frequency || "none",
    repeatUntil: row.repeat_until_resolved || "",
    status: row.status || "pending",
  };
}

function manilaDate(value = "") {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function manilaTime(value = "") {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(new Date(value));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.hour}:${byType.minute}:${byType.second}`;
}

async function loadAdminData(options = {}) {
  const previousAnnouncements = state.data.announcements;
  const previousAccounts = state.data.accounts;
  const previousRegistrations = state.data.adminRegistrations;
  if (options.refreshBookings !== false) void refreshRoomBookings();
  void refreshAdminNotifications();
  const silent = options.silent === true;
  state.loading = !silent;
  if (!silent) render();
  try {
    const [profiles, roles, events, series, occurrences, revisions, concerns, accountRequests, announcements, adminRegistrations, calendarBlocks] = await Promise.all([
      supabaseRequest("/profiles?select=*&order=organization_name.asc"),
      supabaseRequest("/staff_roles?select=user_id,role"),
      supabaseRequest("/events?select=*&order=created_at.desc"),
      supabaseRequest("/event_series?select=*"),
      supabaseRequest("/event_occurrences?select=*&order=starts_at.asc"),
      optionalTable("/event_revisions?select=*&status=eq.pending&order=created_at.desc"),
      optionalTable("/concerns?select=*&order=created_at.desc"),
      optionalTable("/account_change_requests?select=*&status=eq.pending&order=created_at.desc"),
      supabaseRequest("/announcements?select=*&order=created_at.desc").catch(() => state.data.announcements),
      supabaseRequest('/admin_registration_requests?select=*&status=eq.pending&order=created_at.asc').then(rows => {
        state.adminRegistrationLoadError = '';
        return rows;
      }).catch(error => {
        state.adminRegistrationLoadError = `Admin signup requests could not be loaded: ${error.message}. If setup is missing, run 026_admin_registration.sql.`;
        return state.data.adminRegistrations;
      }),
      optionalTable('/calendar_blocks?select=*&order=starts_at.asc'),
    ]);
    const rolesByUser = roleMap(roles);
    const seriesByEvent = Object.fromEntries(series.map((item) => [item.event_id, item]));
    const occurrenceByEvent = occurrences.filter((item) => item.cancelled !== true).reduce((items, item) => {
      if (!items[item.event_id]) items[item.event_id] = item;
      return items;
    }, {});
    const revisionByEvent = revisions.reduce((items, item) => {
      // Rows are newest first; keep the newest request on older databases with duplicates.
      if (!items[item.event_id]) items[item.event_id] = mapRevision(item);
      return items;
    }, {});
    state.data = {
      calendarBlocks,
      accounts: state.data.accounts === previousAccounts ? profiles.map((profile) => mapProfile(profile, rolesByUser)) : state.data.accounts,
      events: events.map((event) => mapEvent(event, occurrenceByEvent[event.id], seriesByEvent[event.id], revisionByEvent[event.id], rolesByUser)).filter((event) => event.startsAt && event.endsAt),
      eventRevisions: revisions.map(mapRevision),
      bookings: state.data.bookings,
      concerns,
      accountRequests,
      notifications: state.data.notifications,
      announcements: state.data.announcements === previousAnnouncements ? announcements : state.data.announcements,
      adminRegistrations: state.data.adminRegistrations === previousRegistrations ? adminRegistrations : state.data.adminRegistrations,
    };
    state.hasLoadedData = true;
    state.dataLoadError = "";
  } catch (error) {
    state.dataLoadError = error.message || "Unable to load calendar data.";
    throw error;
  } finally {
    state.loading = false;
    render();
  }
}

async function login(formData) {
  const email = formData.userAccount.trim().toLowerCase();
  const auth = await supabaseRequest(`${AUTH_URL}/token?grant_type=password`, {
    method: "POST",
    body: JSON.stringify({ email, password: formData.password }),
  });
  const headers = { Authorization: `Bearer ${auth.access_token}` };
  const roleRows = await supabaseRequest(`/staff_roles?user_id=eq.${encodeURIComponent(auth.user.id)}&select=role`, { headers });
  if (!roleRows.some((row) => row.role === "administrator")) {
    saveSession(null);
    const requests = await supabaseRequest(`/admin_registration_requests?account_id=eq.${encodeURIComponent(auth.user.id)}&select=status`, { headers }).catch(() => []);
    if (requests[0]?.status === 'pending') throw new Error('Your admin account is awaiting approval from an existing administrator.');
    if (requests[0]?.status === 'rejected') throw new Error('Your admin account request was not approved. Contact an existing administrator.');
    throw new Error("This account does not have administrator access yet.");
  }
  const profiles = await supabaseRequest(`/profiles?account_id=eq.${encodeURIComponent(auth.user.id)}&select=*`, { headers });
  if (!profiles?.[0] || profiles[0].active === false) throw new Error('This admin profile is missing or blocked. Contact an existing administrator.');
  saveSession({ accessToken: auth.access_token, refreshToken: auth.refresh_token, accountId: auth.user.id, email });
  clearFormDraft(LOGIN_DRAFT);
  state.loginEmail = '';
  state.sidePanelOpen = false;
  state.modal = null;
  state.detailEventId = "";
  state.draft = {};
  await loadAdminData();
}

async function createAdminAccount(values) {
  if (values.password !== values.confirmPassword) throw new Error('Passwords do not match.');
  const officerName = String(values.officerName || '').trim();
  const councilName = String(values.councilName || '').trim();
  const phone = String(values.phone || '').trim();
  if (!officerName || !councilName || !phone) throw new Error('Enter your officer name, Council Name, and phone number.');
  if (officerName.length > 200 || councilName.length > 200 || phone.length > 80) throw new Error('Officer and Council names must be 200 characters or fewer; phone must be 80 characters or fewer.');
  try {
    const ready = await supabaseRequest('/rpc/admin_registration_ready', { method: 'POST', body: '{}' });
    if (ready !== true) throw new Error('Setup could not be confirmed.');
  } catch {
    throw new Error('Admin signup is not set up yet. Apply 026_admin_registration.sql, then retry. Your form details are preserved.');
  }
  const auth = await supabaseRequest(`${AUTH_URL}/signup`, {
    method: 'POST',
    body: JSON.stringify({
      email: values.userAccount.trim().toLowerCase(), password: values.password,
      data: { officer_name: officerName, organization_name: 'Central Student Council', council_name: councilName, csc_council: councilName, phone, account_type: 'administrator' },
    }),
  });
  if (!auth.user?.id && !auth.id) throw new Error('Account creation was not confirmed. Please try again.');
  const createdUser = auth.user || auth;
  if (Array.isArray(createdUser.identities) && !createdUser.identities.length) throw new Error('This email already has an account. Log in or contact an existing administrator.');
  return auth.access_token
    ? 'Account created. An existing administrator must approve your admin access before you can log in.'
    : 'Account created. Confirm your email, then wait for an existing administrator to approve your admin access.';
}

function logout() {
  clearFormDraft(LOGIN_DRAFT);
  state.loginEmail = '';
  saveSession(null);
  clearAdminUi();
  state.data = emptyData();
  state.route = "/calendar";
  state.sidePanelOpen = false;
  state.modal = null;
  state.detailEventId = "";
  state.draft = {};
  state.profileDrafts = {};
  state.profileSavingId = "";
  state.profileNotices = {};
  state.toast = null;
  render();
}

async function conferenceRoomId() {
  const rows = await supabaseRequest(`/rooms?select=id&name=eq.${encodeURIComponent("CSC Conference Room")}&limit=1`);
  if (!rows?.[0]?.id) throw new Error("CSC Conference Room does not exist in the rooms table.");
  return rows[0].id;
}

async function createAdminEvent(formData) {
  requireValidSchedule(formData);
  await saveCalendarSchedule(supabaseRequest, formData, currentAdminAccount());
}
async function updateAdminEvent(eventId, formData) {
  requireValidSchedule(formData);
  const original = state.data.events.find(event => event.id === eventId);
  if (!original) throw new Error('Schedule unavailable.');
  await saveCalendarSchedule(supabaseRequest, formData, currentAdminAccount(), original);
}

async function deleteAdminEvent(eventId) {
  const event = state.data.events.find(item => item.id === eventId);
  if (!event) throw new Error('Schedule unavailable. Refresh and try again.');
  if (event.pendingRevision) throw new Error('Review the pending change request first.');
  const result = await supabaseRequest('/rpc/delete_calendar_schedule', {
    method: 'POST', body: JSON.stringify({ p_id: eventId, p_version: event.version || 1 }),
  });
  if (result?.id !== eventId || result.deleted !== true) throw new Error('The schedule was not deleted. Refresh and try again.');
  state.data.events = state.data.events.filter(item => item.id !== eventId);
}

async function createAdminBooking(formData) {
  adminBookingValues(formData);
  const account = currentAdminAccount();
  const roomId = await conferenceRoomId();
  if (timeToMinutes(formData.endTime) <= timeToMinutes(formData.startTime)) {
    throw new Error("End time must be later than start time.");
  }
  const repeatUntil = formData.frequency === "none" ? "" : formData.repeatUntil || "";
  const [repeatUntilYear = "", repeatUntilMonth = ""] = repeatUntil.split("-");
  const candidate = {
    id: `admin-booking-${Date.now()}`,
    ownerAccountId: account.id,
    selectedDate: formData.selectedDate,
    startsAt: `${formData.selectedDate}T${formData.startTime}:00+08:00`,
    endsAt: `${formData.selectedDate}T${formData.endTime}:00+08:00`,
    startTime: `${formData.startTime}:00`,
    endTime: `${formData.endTime}:00`,
    frequency: formData.frequency,
    repeatUntil,
    status: "approved",
  };
  if (hasBookingConflict(candidate)) {
    throw new Error("This booking overlaps an approved reservation.");
  }
  const rows = await supabaseRequest("/room_bookings", {
    headers: { Prefer: "return=representation" },
    method: "POST",
    body: JSON.stringify({
      room_id: roomId,
      owner_account_id: account.id,
      creator_account_id: account.id,
      selected_date: formData.selectedDate,
      starts_at: `${formData.selectedDate}T${formData.startTime}:00+08:00`,
      ends_at: `${formData.selectedDate}T${formData.endTime}:00+08:00`,
      frequency: formData.frequency,
      repeat_until_month: repeatUntilMonth ? Number(repeatUntilMonth) : null,
      repeat_until_year: repeatUntilYear ? Number(repeatUntilYear) : null,
      repeat_until_resolved: repeatUntil || null,
      status: "approved",
    }),
  });
  if (!rows?.[0]) throw new Error("The booking was not saved. Please try again.");
  const booking = mapBooking(rows[0]);
  state.data = { ...state.data, bookings: [booking, ...state.data.bookings.filter((item) => item.id !== booking.id)] };
  state.selectedDate = booking.selectedDate;
}

function adminBookingValues(values) {
  const date = String(values.selectedDate || '');
  const start = String(values.startTime || '');
  const end = String(values.endTime || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end)) throw new Error('Select a valid date and time.');
  const startMinutes = timeToMinutes(start), endMinutes = timeToMinutes(end);
  if (startMinutes < 420 || startMinutes > 1290 || endMinutes > 1320 || endMinutes <= startMinutes || startMinutes % 30 || endMinutes % 30) throw new Error('Choose half-hour time slots between 7:00 AM and 10:00 PM, with the end after the start.');
  const frequency = values.frequency || 'none';
  if (!['none', 'weekly', 'monthly', 'yearly'].includes(frequency)) throw new Error('Select a valid repeat frequency.');
  const repeatUntil = frequency === 'none' ? '' : String(values.repeatUntil || '');
  if (frequency !== 'none' && (!/^\d{4}-\d{2}-\d{2}$/.test(repeatUntil) || repeatUntil < date)) throw new Error('Repeat Until must be on or after the selected date.');
  return {
    selected_date: date, starts_at: `${date}T${start}:00+08:00`, ends_at: `${date}T${end}:00+08:00`,
    frequency, repeat_until_resolved: repeatUntil || null,
    repeat_until_month: repeatUntil ? Number(repeatUntil.slice(5, 7)) : null,
    repeat_until_year: repeatUntil ? Number(repeatUntil.slice(0, 4)) : null,
    status: 'approved',
  };
}

async function updateAdminBooking(bookingId, values) {
  const original = requireAdminBooking(bookingId);
  const payload = adminBookingValues(values);
  const candidate = mapBooking({ ...payload, id: bookingId, owner_account_id: original.ownerAccountId, creator_account_id: original.creatorAccountId });
  if (hasBookingConflict(candidate, bookingId)) throw new Error('This booking overlaps an approved reservation.');
  // Recheck current reservations before writing; ignore this reservation's own series.
  const currentRows = await supabaseRequest('/room_bookings?select=*&status=eq.approved');
  if (hasBookingConflict(candidate, bookingId, currentRows.map(mapBooking))) throw new Error('This booking overlaps an approved reservation.');
  const rows = await supabaseRequest(`/room_bookings?id=eq.${encodeURIComponent(bookingId)}&version=eq.${original.version || 1}&status=neq.cancelled`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...payload, version: (original.version || 1) + 1, updated_at: new Date().toISOString() }),
  });
  if (!rows?.[0] || rows[0].id !== bookingId) throw new Error('The reservation changed or was not saved. Refresh and review it before retrying. Your draft is saved.');
  const updated = mapBooking(rows[0]);
  state.data = { ...state.data, bookings: state.data.bookings.map(item => item.id === bookingId ? updated : item) };
  state.selectedDate = updated.selectedDate;
  return updated;
}

async function deleteAdminBooking(bookingId) {
  const original = requireAdminBooking(bookingId);
  // Retain the cancelled record so existing notification links remain usable.
  const rows = await supabaseRequest(`/room_bookings?id=eq.${encodeURIComponent(bookingId)}&version=eq.${original.version || 1}&status=neq.cancelled`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status: 'cancelled', version: (original.version || 1) + 1, updated_at: new Date().toISOString() }),
  });
  if (!rows?.[0] || rows[0].id !== bookingId || rows[0].status !== 'cancelled') throw new Error('The reservation changed or was not deleted. Refresh and try again.');
  const deleted = mapBooking(rows[0]);
  state.data = { ...state.data, bookings: state.data.bookings.map(item => item.id === bookingId ? deleted : item) };
}

async function approveEvent(eventId) {
  requireEventApprovalFlow(eventId);
  const event = state.data.events.find((item) => item.id === eventId);
  if (event?.pendingRevision) {
    await approveEventRevision(event);
    return;
  }
  if (!event || !['pending', 'draft', 'changes_requested'].includes(event.status)) throw new Error('Only pending schedules can be approved or rejected. Use Cancel Schedule for an approved schedule.');
  const rows = await supabaseRequest(`/events?id=eq.${encodeURIComponent(eventId)}&status=eq.${event.status}&version=eq.${event.version || 1}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: "approved", updated_at: new Date().toISOString() }),
  });
  if (!rows?.some(row => row.id === eventId)) throw new Error("The schedule decision was not saved. Refresh and try again.");
}

async function rejectEvent(eventId) {
  requireEventApprovalFlow(eventId);
  const event = state.data.events.find((item) => item.id === eventId);
  if (event?.pendingRevision) {
    await reviewScheduleChange("event", event.pendingRevision.id, false);
    return;
  }
  if (!event || !['pending', 'draft', 'changes_requested'].includes(event.status)) throw new Error('Only pending schedules can be approved or rejected. Use Cancel Schedule for an approved schedule.');
  const rows = await supabaseRequest(`/events?id=eq.${encodeURIComponent(eventId)}&status=eq.${event.status}&version=eq.${event.version || 1}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: "rejected", updated_at: new Date().toISOString() }),
  });
  if (!rows?.some(row => row.id === eventId)) throw new Error("The schedule decision was not saved. Refresh and try again.");
}

async function cancelEvent(eventId) {
  requireEventApprovalFlow(eventId);
  const event = state.data.events.find(item => item.id === eventId);
  if (!event || event.status !== 'approved' || event.pendingRevision) throw new Error('Only approved schedules without a pending request can be cancelled. Refresh and try again.');
  const rows = await supabaseRequest(`/events?id=eq.${encodeURIComponent(eventId)}&status=eq.approved&version=eq.${event.version || 1}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status: 'cancelled', updated_at: new Date().toISOString() }),
  });
  const saved = rows?.find(row => row.id === eventId && row.status === 'cancelled');
  if (!saved) throw new Error('The schedule changed or cancellation was not saved. Refresh and try again.');
  state.data.events = state.data.events.map(item => item.id === eventId ? { ...item, status: 'cancelled', version: saved.version || item.version } : item);
}

async function approveEventRevision(event) {
  await reviewScheduleChange("event", event.pendingRevision.id, true);
}

async function reviewScheduleChange(kind, revisionId, approve) {
  const result = await supabaseRequest("/rpc/review_schedule_change", {
    method: "POST", body: JSON.stringify({ p_kind: kind, p_revision_id: revisionId, p_approve: approve }),
  });
  if (!result?.id) throw new Error("The review was not saved. Refresh and try again.");
  return result;
}

async function updateBookingStatus(bookingId, status) {
  if (isAdminCreatedBooking(state.data.bookings.find(item => item.id === bookingId))) throw new Error('Admin-created reservations do not require approval. Use Edit or Delete.');
  const booking = state.data.bookings.find(item => item.id === bookingId);
  if (booking?.pendingRevision) {
    if (!["approved", "rejected"].includes(status)) throw new Error("Review the pending change request first.");
    await reviewScheduleChange("booking", booking.pendingRevision.id, status === "approved");
    await refreshRoomBookings();
    return;
  }

  const rows = await supabaseRequest(`/room_bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
  if (!rows?.[0]) throw new Error("The booking status could not be saved.");
  const updated = mapBooking(rows[0]);
  state.data = { ...state.data, bookings: state.data.bookings.map((booking) => booking.id === bookingId ? updated : booking) };
}

async function updateConcernStatus(concernId, status) {
  await supabaseRequest(`/concerns?id=eq.${encodeURIComponent(concernId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
}

function adminNotifications() {
  return state.data.notifications.filter((notification) => notification.recipientAccountId === state.session?.accountId);
}

function unreadNotificationCount() {
  return adminNotifications().filter((notification) => !notification.readAt).length;
}

async function markNotificationRead(notificationId) {
  const rows = await supabaseRequest(`/notifications?id=eq.${encodeURIComponent(notificationId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ read_at: new Date().toISOString() }),
  });
  if (!rows?.[0]) throw new Error("The notification could not be marked as read.");
  const updated = mapNotification(rows[0]);
  state.data.notifications = state.data.notifications.map((notification) => notification.id === notificationId ? updated : notification);
}

async function updateAccount(accountId, formData) {
  const account = accountById(accountId);
  const councilAccount = account?.role === 'administrator' || Boolean(account?.councilName);
  const body = {
    officer_name: String(formData.officerName || '').trim(),
    organization_name: councilAccount ? 'Central Student Council' : String(formData.organizationName || '').trim(),
    phone: String(formData.phone || '').trim(),
    messenger_url: normalizeMessengerLink(formData.messengerUrl),
    updated_at: new Date().toISOString(),
  };
  if (councilAccount) {
    body.council_name = String(formData.councilName || '').trim();
    if (!body.council_name || body.council_name.length > 200) throw new Error('Enter a Council Name of 200 characters or fewer.');
  }
  if (!body.officer_name || !body.organization_name) throw new Error('Enter an officer name and organization name.');
  const rows = await supabaseRequest(`/profiles?account_id=eq.${encodeURIComponent(accountId)}`, {
    method: "PATCH",
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  const updated = rows?.find(row => row.account_id === accountId);
  if (!updated) throw new Error('The database did not update this account. Apply 024_admin_profile_edits.sql and retry. Your draft is preserved.');
  return updated;
}

async function setAccountBlocked(accountId, blocked) {
  await supabaseRequest(`/profiles?account_id=eq.${encodeURIComponent(accountId)}`, {
    method: "PATCH",
    body: JSON.stringify({ active: !blocked, updated_at: new Date().toISOString() }),
  });
}

async function deleteAccount(accountId) {
  await supabaseRequest(`/profiles?account_id=eq.${encodeURIComponent(accountId)}`, {
    method: "DELETE",
  });
  await optionalTable(`/staff_roles?user_id=eq.${encodeURIComponent(accountId)}`, {
    method: "DELETE",
  });
}

async function approveAccountRequest(requestId, status) {
  await supabaseRequest(`/account_change_requests?id=eq.${encodeURIComponent(requestId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status, reviewer_id: state.session.accountId, decided_at: new Date().toISOString() }),
  });
}

function eventOccurrencesBetween(startDate, endDate, sourceEvents = state.data.events) {
  const occurrences = [];
  const seen = new Set();
  sourceEvents.forEach((event) => {
    if (event.status === "cancelled") return;
    const spanDays = eventSpanDays(event);
    const firstAnchorDate = addDays(startDate, -spanDays);
    for (let anchorDate = firstAnchorDate; anchorDate <= endDate; anchorDate = addDays(anchorDate, 1)) {
      if (!anchorOccursOn(event, anchorDate)) continue;
      const occurrenceFullStartsAt = eventOccurrenceDateTime(event, anchorDate, "startsAt");
      const occurrenceFullEndsAt = eventOccurrenceDateTime(event, addDays(anchorDate, spanDays), "endsAt");
      for (let offset = 0; offset <= spanDays; offset += 1) {
        const date = addDays(anchorDate, offset);
        if (date < startDate || date > endDate) continue;
        const startsAt = multiDayOccurrenceDateTime(event, date, offset, spanDays, "startsAt");
        const endsAt = multiDayOccurrenceDateTime(event, date, offset, spanDays, "endsAt");
        const key = `${event.id}:${anchorDate}:${date}`;
        const duplicateScheduleKey = [
          event.ownerAccountId,
          event.title.trim().toLowerCase(),
          startsAt.slice(11, 19),
          endsAt.slice(11, 19),
          date,
        ].join("|");
        if (seen.has(key)) continue;
        if (seen.has(duplicateScheduleKey)) continue;
        seen.add(key);
        seen.add(duplicateScheduleKey);
        occurrences.push({
          ...event,
          baseStartsAt: event.startsAt,
          baseEndsAt: event.endsAt,
          occurrenceFullStartsAt,
          occurrenceFullEndsAt,
          occurrenceAnchorDate: anchorDate,
          occurrenceDate: date,
          startsAt,
          endsAt,
        });
      }
    }
  });
  return occurrences;
}

function visibleAdminEvents() {
  if (state.accountFilter === "selected" && state.selectedAccountId) {
    return state.data.events.filter((event) => matchesCalendarOrganization(event, state.selectedAccountId, state.data.accounts));
  }
  return state.data.events;
}

function daysBetween(first, second) {
  return Math.round((dateFromIso(second) - dateFromIso(first)) / DAY_MS);
}

function baseStartDate(event) {
  return manilaDate(event.startsAt);
}

function baseEndDate(event) {
  return manilaDate(event.endsAt);
}

function eventSpanDays(event) {
  return Math.max(0, daysBetween(baseStartDate(event), baseEndDate(event)));
}

function eventRepeatUntilDate(event) {
  return event.frequency === "none" ? baseStartDate(event) : event.repeatUntil || baseStartDate(event);
}

function anchorOccursOn(event, date) {
  const startDate = baseStartDate(event);
  if (date < startDate) return false;
  if (date > eventRepeatUntilDate(event)) return false;
  if (event.frequency === "none") return date === startDate;

  const diff = daysBetween(startDate, date);
  if (event.frequency === "daily") return diff >= 0;
  if (event.frequency === "weekly") return diff % 7 === 0;
  if (event.frequency === "monthly") return date.slice(8, 10) === startDate.slice(8, 10);
  if (event.frequency === "yearly") return date.slice(5, 10) === startDate.slice(5, 10);
  return date === startDate;
}

function eventOccurrenceDateTime(event, date, field) {
  const time = manilaTime(event[field]) || event[field].slice(11, 19);
  return `${date}T${time}+08:00`;
}

function multiDayOccurrenceDateTime(event, date, offset, spanDays, field) {
  if (field === "startsAt") {
    return offset === 0 ? eventOccurrenceDateTime(event, date, "startsAt") : `${date}T00:00:00+08:00`;
  }
  return offset === spanDays ? eventOccurrenceDateTime(event, date, "endsAt") : `${date}T23:59:59+08:00`;
}

function bookingOccurrencesBetween(startDate, endDate, sourceBookings = state.data.bookings) {
  const occurrences = [];
  sourceBookings.forEach((booking) => {
    if (booking.status === "cancelled") return;
    for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
      if (!bookingOccursOn(booking, date)) continue;
      occurrences.push({
        ...booking,
        occurrenceDate: date,
        occurrenceStartsAt: occurrenceDateTime(booking, date, "startsAt"),
        occurrenceEndsAt: occurrenceDateTime(booking, date, "endsAt"),
      });
    }
  });
  return occurrences;
}

function hasBookingConflict(candidate, ignoredBookingId = "", sourceBookings = state.data.bookings) {
  const candidateDates = bookingOccurrencesBetween(candidate.selectedDate, repeatUntilDate(candidate), [candidate]);
  return sourceBookings.some((booking) => {
    if (booking.id === ignoredBookingId) return false;
    if (booking.status !== "approved") return false;
    const bookingStart = booking.selectedDate || booking.startsAt.slice(0, 10);
    const overlapStart = candidate.selectedDate > bookingStart ? candidate.selectedDate : bookingStart;
    const overlapEnd = repeatUntilDate(candidate) > repeatUntilDate(booking) ? repeatUntilDate(booking) : repeatUntilDate(candidate);
    if (overlapEnd < overlapStart) return false;
    const bookingDates = bookingOccurrencesBetween(overlapStart, overlapEnd, [booking]);
    return candidateDates.some((candidateOccurrence) => bookingDates.some((bookingOccurrence) => {
      if (candidateOccurrence.occurrenceDate !== bookingOccurrence.occurrenceDate) return false;
      const candidateStart = new Date(candidateOccurrence.occurrenceStartsAt).getTime();
      const candidateEnd = new Date(candidateOccurrence.occurrenceEndsAt).getTime();
      const start = new Date(bookingOccurrence.occurrenceStartsAt).getTime();
      const end = new Date(bookingOccurrence.occurrenceEndsAt).getTime();
      return candidateStart < end && candidateEnd > start;
    }));
  });
}

function bookingOccursOn(booking, date) {
  const startDate = booking.selectedDate || booking.startsAt.slice(0, 10);
  if (date < startDate) return false;
  if (booking.frequency === "none") return date === startDate;
  if (date > repeatUntilDate(booking)) return false;
  const diff = Math.round((dateFromIso(date) - dateFromIso(startDate)) / DAY_MS);
  if (booking.frequency === "weekly") return diff % 7 === 0;
  if (booking.frequency === "monthly") return date.slice(8, 10) === startDate.slice(8, 10);
  if (booking.frequency === "yearly") return date.slice(5, 10) === startDate.slice(5, 10);
  return date === startDate;
}

function repeatUntilDate(booking) {
  return booking.repeatUntil || booking.selectedDate || booking.startsAt.slice(0, 10);
}

function occurrenceDateTime(booking, date, field) {
  const localTime = field === "startsAt" ? booking.startTime : booking.endTime;
  return `${date}T${(localTime || booking[field].slice(11, 19))}+08:00`;
}

function calendarView() {
  const selected = dateParts(state.selectedDate);
  const firstDay = new Date(Date.UTC(selected.year, selected.month - 1, 1));
  const startOffset = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(selected.year, selected.month, 0)).getUTCDate();
  const monthStart = `${selected.year}-${String(selected.month).padStart(2, "0")}-01`;
  const monthEnd = `${selected.year}-${String(selected.month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const events = eventOccurrencesBetween(monthStart, monthEnd, visibleAdminEvents());
  const today = manilaDate(new Date().toISOString());
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const rowCount = totalCells / 7;
  const spanBars = renderMonthRows(monthSegments(events, selected.year, selected.month, startOffset, manilaDate), rowCount, monthSpanBar);
  const cells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    const day = dayNumber >= 1 && dayNumber <= daysInMonth ? String(dayNumber) : "";
    const cellDate = day ? `${selected.year}-${String(selected.month).padStart(2, "0")}-${day.padStart(2, "0")}` : "";
    
    return `
      <div class="month-cell ${cellDate === today ? "today" : ""}" ${day ? `data-calendar-date="${cellDate}" role="button" tabindex="0"` : ""}>
        ${day ? `<strong class="month-date-number">${day}</strong>` : ""}
        
      </div>
    `;
  });
  return `
    <section class="calendar-shell main-calendar">
      <div class="calendar-weekdays">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<b>${day}</b>`).join("")}</div>
      <div class="calendar-month rows-${rowCount}">${cells.join("")}${spanBars}</div>
    </section>
  `;
}

function calendarYear() {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const selected = dateParts(state.selectedDate);
  const events = eventOccurrencesBetween(`${selected.year}-01-01`, `${selected.year}-12-31`, visibleAdminEvents());
  return `
    <section class="year-grid">
      ${months.map((month, index) => miniMonthCalendar(month, index + 1, selected, events)).join("")}
    </section>
  `;
}

function miniMonthCalendar(monthName, month, selected, events) {
  const firstDay = new Date(Date.UTC(selected.year, month - 1, 1));
  const startOffset = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(selected.year, month, 0)).getUTCDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return `<span class="mini-day empty"></span>`;
    const date = `${selected.year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    const dayEvents = events.filter((event) => manilaDate(event.startsAt) === date);
    const eventTitle = dayEvents.map((event) => `${formatTime(event.startsAt)} ${event.title}`).join("\n");
    return `
      <span class="mini-day ${dayEvents.length ? "has-events" : ""}" title="${escapeHtml(eventTitle)}">
        <span class="mini-day-number">${dayNumber}</span>
        ${
          dayEvents.length
            ? `<span class="mini-event-strips">${dayEvents.slice(0, 2).map((event) => `<i class="${eventColorClass(event)}" data-event-detail="${event.id}" data-event-starts-at="${escapeHtml(event.occurrenceFullStartsAt || event.startsAt)}" data-event-ends-at="${escapeHtml(event.occurrenceFullEndsAt || event.endsAt)}" title="${escapeHtml(calendarScheduleLabel(event, accountById(event.ownerAccountId)))}">${escapeHtml(calendarScheduleLabel(event, accountById(event.ownerAccountId)))}</i>`).join("")}${dayEvents.length > 2 ? "<em>+</em>" : ""}</span>`
            : ""
        }
      </span>
    `;
  });
  return `
    <button class="${month === selected.month ? "mini-month active" : "mini-month"}" data-year-month="${selected.year}-${String(month).padStart(2, "0")}-01" type="button">
      <span class="mini-month-title"><strong>${monthName}</strong><small>${selected.year}</small></span>
      <span class="mini-weekdays">${["S", "M", "T", "W", "T", "F", "S"].map((day) => `<b>${day}</b>`).join("")}</span>
      <span class="mini-calendar-grid">${cells.join("")}</span>
    </button>
  `;
}

function eventChip(event) {
  const owner = accountById(event.ownerAccountId);
  const status = event.hasPendingRevision ? "edit pending" : event.status;
  return `<button class="event-chip ${eventColorClass(event)}" data-event-detail="${event.id}" data-event-starts-at="${escapeHtml(event.occurrenceFullStartsAt || event.startsAt)}" data-event-ends-at="${escapeHtml(event.occurrenceFullEndsAt || event.endsAt)}" type="button">${escapeHtml(calendarScheduleLabel(event, owner))} <em>${formatTime(event.startsAt)} · ${escapeHtml(status)}</em></button>`;
}

function eventColorClass(event) {
  const owner = accountById(event.ownerAccountId);
  if (event.status === "rejected") return "rejected";
  if (owner?.role === "administrator" || owner?.role === "admin" || event.ownerAccountId === state.session?.accountId) return "admin-schedule";
  if (event.status === "approved" && !event.hasPendingRevision) return "approved";
  return "pending";
}

function monthSpanBar(event, row, columnStart, columnEnd, lane, rowCount) {
  return renderMainCalendarStrip(event, row, columnStart, columnEnd, lane, rowCount, accountById(event.ownerAccountId), { escapeHtml, formatTime, color: eventColorClass(event) });
}

function roomView() {
  const today = manilaDate(new Date().toISOString());
  const selected = dateFromIso(state.selectedDate);
  const weekStart = new Date(selected);
  weekStart.setUTCDate(selected.getUTCDate() - selected.getUTCDay());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);
    const value = isoDate(date);
    return { label: `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index]} ${date.getUTCDate()}`, value, selected: value === today };
  });
  const times = Array.from({ length: CONFERENCE_SLOT_COUNT }, (_, index) => 7 * 60 + index * ROOM_SLOT_MINUTES);
  const weekEnd = days[6].value;
  const bookings = bookingOccurrencesBetween(days[0].value, weekEnd);
  return `
    <section class="conference-week conference-room-calendar">
      ${state.bookingsLoadError ? `<div class="room-refresh-notice" role="alert">${escapeHtml(state.bookingsLoadError)} <button type="button" data-retry-bookings>Retry</button></div>` : state.bookingsLoading ? `<div class="room-refresh-notice" role="status">Updating reservations…</div>` : ""}
      <div class="week-head"><div></div>${days.map((day) => `<strong class="${day.selected ? "selected-day" : ""}">${day.label}</strong>`).join("")}</div>
      <div class="week-grid">
        ${times.map((minutes, rowIndex) => `
          <div class="time-label ${minutes % 60 ? "half-hour" : ""}" style="grid-row:${rowIndex + 1};grid-column:1;">${minutes % 60 ? "" : formatClock(minutes)}</div>
          ${days.map((day, dayIndex) => `<button class="week-slot room-slot ${minutes % 60 ? "half-hour" : ""} ${day.selected ? "selected-day" : ""}" style="grid-row:${rowIndex + 1};grid-column:${dayIndex + 2};" data-room-date="${day.value}" data-room-start="${minutesToTime(minutes)}" data-room-end="${minutesToTime(Math.min(minutes + ROOM_SLOT_MINUTES, 22 * 60))}" aria-label="${day.label} ${formatClock(minutes)}"></button>`).join("")}
        `).join("")}
        ${bookings.map((booking) => bookingBlock(booking, days)).join("")}
      </div>
    </section>
  `;
}

function formatClock(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${suffix}`;
}

function inputDate(value) {
  return value ? manilaDate(value) : "";
}

function inputTime(value) {
  return value ? manilaTime(value).slice(0, 5) : "";
}

function formatDateRange(event) {
  const startDate = inputDate(event.startsAt);
  const endDate = inputDate(event.endsAt);
  const dateText = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  return `${dateText} · ${formatTime(event.startsAt)}-${formatTime(event.endsAt)}`;
}

function bookingBlock(booking, days) {
  return renderRoomBookingCard(booking, days, accountById(booking.ownerAccountId), { escape: escapeHtml, formatTime });
}

function bookingStatusLabel(status = "pending") {
  if (status === "cancelled") return "cancelled";
  if (status === "rejected") return "reject";
  if (status === "approved") return "approved";
  return "pending";
}

function adminBookingActions(booking) {
  return booking.status === 'cancelled' ? '' : `<button class="blue-pill" type="button" data-edit-booking="${escapeHtml(booking.id)}">Edit</button><button class="danger-pill" type="button" data-delete-booking="${escapeHtml(booking.id)}">Delete</button>`;
}

function bookingCard(booking) {
  const owner = accountById(booking.ownerAccountId);
  return `
    <article class="admin-card">
      <span>${escapeHtml(booking.pendingRevision ? `${booking.pendingRevision.request_type === "cancellation" ? "deletion" : "edit"} pending` : bookingStatusLabel(booking.status))}</span>
      <h3>CSC Conference Room</h3>
      <p>${escapeHtml(owner?.organizationName || "Unknown organization")} · ${formatDate(booking.startsAt)} · ${formatTime(booking.startsAt)}-${formatTime(booking.endsAt)}</p>
      <div class="card-actions">
        ${isAdminCreatedBooking(booking) ? adminBookingActions(booking) : booking.pendingRevision ? `<button class="blue-pill" type="button" data-booking-detail="${booking.id}">Review Changes</button>` : `
        ${booking.status !== "pending" ? `<button class="white-pill" data-action-button="pending-booking" data-id="${booking.id}">Pending</button>` : ""}
        ${booking.status !== "cancelled" && (booking.pendingRevision || booking.status !== "approved") ? `<button class="blue-pill" data-action-button="approve-booking" data-id="${booking.id}">${booking.pendingRevision ? `Approve ${booking.pendingRevision.request_type === "cancellation" ? "Deletion" : "Edit"}` : "Approve"}</button>` : ""}
        ${booking.status !== "cancelled" && (booking.pendingRevision || booking.status !== "rejected") ? `<button class="white-pill" data-action-button="reject-booking" data-id="${booking.id}">${booking.pendingRevision ? `Reject ${booking.pendingRevision.request_type === "cancellation" ? "Deletion" : "Edit"}` : "Reject"}</button>` : ""}
        `}
      </div>
    </article>
  `;
}

function concernsView() {
  return `<section class="admin-grid">${state.data.concerns.map((concern) => {
    const owner = accountById(concern.submitter_account_id);
    return `
      <article class="admin-card">
        <span>${escapeHtml(concern.status)}</span>
        <h3>${escapeHtml(concern.title)}</h3>
        <p>${escapeHtml(owner?.organizationName || "Unknown organization")} · ${escapeHtml(concern.category)}</p>
        <p>${escapeHtml(concern.description)}</p>
        <select class="input" data-concern-status="${concern.id}">
          ${["open", "in_progress", "awaiting_response", "resolved"].map((status) => `<option value="${status}" ${concern.status === status ? "selected" : ""}>${status.replaceAll("_", " ")}</option>`).join("")}
        </select>
      </article>
    `;
  }).join("") || emptyState("No concerns submitted.")}</section>`;
}

function profilesView() {
  const requests = state.data.accountRequests.map(accountRequestCard).join("");
  return `
    <h2 class="section-title">Admin Account Requests</h2>
    ${state.adminRegistrationLoadError ? `<p class="profile-save-notice error" role="alert">${escapeHtml(state.adminRegistrationLoadError)} <button type="button" class="white-pill" data-refresh>Retry</button></p>` : ''}
    <section class="admin-grid">${state.data.adminRegistrations.map(request => `<article class="admin-card" data-admin-registration="${escapeHtml(request.account_id)}"><span>Admin access requested</span><h3>${escapeHtml(request.officer_name)}</h3><p>${escapeHtml(request.email)}</p><p><strong>Organization:</strong> Central Student Council</p><p><strong>Council Name:</strong> ${escapeHtml(request.csc_council)}</p><p><strong>Phone:</strong> ${escapeHtml(request.phone)}</p><div class="card-actions"><button class="blue-pill" data-review-admin="${escapeHtml(request.account_id)}" data-approve="true" ${state.adminRegistrationBusy ? 'disabled' : ''}>Approve Admin</button><button class="white-pill" data-review-admin="${escapeHtml(request.account_id)}" data-approve="false" ${state.adminRegistrationBusy ? 'disabled' : ''}>Reject</button></div></article>`).join('') || emptyState('No admin account requests.')}</section>
    <h2 class="section-title">Account Edit Requests</h2>
    <section class="admin-grid">${requests || emptyState("No account edit requests.")}</section>
    <h2 class="section-title">Profile Accounts</h2>
    <section class="profile-admin-list">
      ${state.data.accounts.map(profileCard).join("") || emptyState("No profiles loaded.")}
    </section>
  `;
}

function profileCard(account) {
  const isCurrentAdmin = account.id === state.session?.accountId;
  const values = state.profileDrafts[account.id] || account;
  const saving = state.profileSavingId === account.id;
  const notice = state.profileNotices[account.id];
  const councilAccount = account.role === 'administrator' || Boolean(account.councilName);
  return `
    <article class="admin-card profile-row-card ${account.active ? "" : "blocked"}">
      <div class="profile-row-summary">
        <span>${escapeHtml(account.role)}</span>
        <h3>${escapeHtml(account.councilName || account.organizationName || "Unnamed organization")}</h3>
        ${councilAccount ? '<p>Central Student Council</p>' : ''}
        <p>${escapeHtml(account.active ? "Active" : "Blocked")}</p>
      </div>
      <form class="admin-profile-form" data-profile-form="${account.id}">
        <label>Officer<input class="input" name="officerName" value="${escapeHtml(values.officerName)}" required ${saving ? 'readonly' : ''}></label>
        <label>Organization<input class="input" name="organizationName" value="${escapeHtml(councilAccount ? 'Central Student Council' : values.organizationName)}" required ${saving || councilAccount ? 'readonly' : ''}></label>
        ${councilAccount ? `<label>Council Name<input class="input" name="councilName" maxlength="200" value="${escapeHtml(values.councilName ?? account.councilName)}" required ${saving ? 'readonly' : ''}></label>` : ''}
        <label>Phone<input class="input" name="phone" type="tel" value="${escapeHtml(values.phone)}" ${saving ? 'readonly' : ''}></label>
        <label>Messenger link<input class="input" name="messengerUrl" type="url" maxlength="500" placeholder="https://m.me/your.username" value="${escapeHtml(values.messengerUrl ?? account.messengerUrl ?? '')}" ${saving ? 'readonly' : ''}></label>
        <div class="profile-row-actions">
          <button class="blue-pill" type="submit" ${state.profileSavingId ? 'disabled' : ''}>${saving ? 'Saving…' : 'Save Edit'}</button>
          <button class="white-pill" type="button" data-block-account="${account.id}" data-block-state="${account.active ? "block" : "unblock"}" ${isCurrentAdmin ? "disabled" : ""}>${account.active ? "Block" : "Unblock"}</button>
          <button class="danger-pill" type="button" data-delete-account="${account.id}" ${isCurrentAdmin ? "disabled" : ""}>Delete</button>
        </div>
        ${notice ? `<p class="profile-save-notice ${notice.type}" role="${notice.type === 'error' ? 'alert' : 'status'}">${escapeHtml(notice.message)}</p>` : ''}
      </form>
    </article>
  `;
}

function accountRequestCard(request) {
  const account = accountById(request.account_id);
  const before = request.previous_values?.profile || {};
  const after = request.proposed_values?.profile || {};
  const changes = [['officer_name', 'Officer'], ['organization_name', 'Organization'], ['phone', 'Phone'], ['messenger_url', 'Messenger link']]
    .filter(([key]) => key in after && String(before[key] || '') !== String(after[key] || ''))
    .map(([key, label]) => `<div><dt>${label}</dt><dd>${escapeHtml(before[key] || 'Not set')} → <strong>${escapeHtml(after[key] || 'Not set')}</strong></dd></div>`).join('');
  return `
    <article class="admin-card">
      <span>${escapeHtml(request.status)}</span>
      <h3>${escapeHtml(account?.organizationName || "Account update")}</h3>
      <p>${escapeHtml(request.previous_login_identifier || "Previous value")} to ${escapeHtml(request.proposed_login_identifier || "new value")}</p>
      ${changes ? `<dl class="profile-change-review">${changes}</dl>` : ""}
      <div class="card-actions">
        <button class="blue-pill" data-action-button="approve-account-request" data-id="${request.id}">Approve Change</button>
        <button class="white-pill" data-action-button="reject-account-request" data-id="${request.id}">Reject</button>
      </div>
    </article>
  `;
}

async function postAnnouncement(formData) {
  const title = String(formData.title || "").trim();
  const body = String(formData.body || "").trim();
  if (!title || !body) throw new Error("Enter an announcement title and message.");
  if (title.length > 200 || body.length > 10000) throw new Error("The announcement title or message is too long.");
  let rows;
  try {
    rows = await supabaseRequest("/rpc/publish_announcement", { method: "POST", body: JSON.stringify({ p_title: title, p_body: body }) });
  } catch (error) {
    if (error.code === "PGRST202" && /publish_announcement/i.test(error.message)) {
      throw new Error(`The announcement function could not be found in Supabase project udnyppmvkklcbyylqsxp. Apply 018_announcement_notifications.sql in that project and reload its schema cache. Your draft is saved. Database error [${error.code}]: ${error.message}`);
    }
    throw new Error(`Announcement could not be posted. Your draft is saved. Database error${error.code ? ` [${error.code}]` : ""}: ${error.message}${error.details ? ` Details: ${error.details}` : ""}`);
  }
  if (!rows?.[0]) throw new Error("The announcement was not posted. Please try again.");
  return rows[0];
}

function announcementsView() {
  const posting = state.announcementPosting;
  return `<section class="announcements-page">
    <form class="admin-card announcement-form" data-announcement-form>
      <h2>Create announcement</h2>
      <label>Title<input class="input" name="title" maxlength="200" value="${escapeHtml(state.announcementDraft.title || "")}" required ${posting ? "readonly" : ""}></label>
      <label>Message<textarea class="input" name="body" maxlength="10000" rows="5" required ${posting ? "readonly" : ""}>${escapeHtml(state.announcementDraft.body || "")}</textarea></label>
      <p>Posted announcements appear in active organization accounts’ notifications.</p>
      <button class="blue-pill" type="submit" ${posting ? "disabled" : ""}>${posting ? "Posting…" : "Post Announcement"}</button>
      ${state.announcementNotice ? `<p class="announcement-notice ${state.announcementNotice.type}" role="${state.announcementNotice.type === "error" ? "alert" : "status"}">${escapeHtml(state.announcementNotice.message)}</p>` : ""}
    </form>
    <section class="announcement-history"><h2>Announcements</h2><div class="admin-grid">${state.data.announcements.map((item) => `<article class="admin-card"><span>${escapeHtml(item.status)}</span><h3>${escapeHtml(item.title)}</h3><p class="announcement-body">${escapeHtml(item.body)}</p>${item.publish_starts_at || item.created_at ? `<small>${escapeHtml(formatDate(item.publish_starts_at || item.created_at))}</small>` : ""}<div class="card-actions"><button class="white-pill" data-remove-announcement="${escapeHtml(item.id)}" ${state.deletingAnnouncementId ? "disabled" : ""}>${state.deletingAnnouncementId === item.id ? "Removing…" : "Remove"}</button></div></article>`).join("") || emptyState("No announcements posted yet.")}</div></section>
  </section>`;
}

function eventDetail() {
  const event = state.data.events.find((item) => item.id === state.detailEventId);
  if (!event) return `<div class="detail-list">${emptyState("Schedule not found.")}</div>`;
  const owner = accountById(event.ownerAccountId);
  const adminCreated = isAdminCreatedEvent(event);
  const revision = adminCreated ? null : event.pendingRevision;
  return `
    <div class="detail-list schedule-detail-list">
      <article><span>Organization</span><strong>${escapeHtml(owner?.organizationName || "Unknown organization")}</strong></article>
      <article><span>Status</span><strong>${escapeHtml(revision ? `${revision.requestType === "cancellation" ? "deletion" : "edit"} pending` : event.status)}</strong></article>
      ${changeRequestSummary(revision, escapeHtml, event)}
      <article><span>Category</span><strong>${escapeHtml(event.category || "Not set")}</strong></article>
      <article><span>Venue</span><strong>${escapeHtml(event.venue || "Not set")}</strong></article>
      <article><span>Date and time</span><strong>${escapeHtml(formatDateRange({ ...event, startsAt: state.detailEventStartsAt || event.startsAt, endsAt: state.detailEventEndsAt || event.endsAt }))}</strong></article>
      <article><span>Expected attendees</span><strong>${escapeHtml(event.expectedAttendees || "Not set")}</strong></article>
      <article class="wide compact-text"><span>Short public description</span><strong>${escapeHtml(event.publicDescription || "No description.")}</strong></article>
      <article class="wide compact-text"><span>Purpose</span><strong>${escapeHtml(event.purpose || "No purpose provided.")}</strong></article>
        ${event.frequency !== "none" ? `<p class="series-edit-note">Edit applies to the entire recurring schedule.</p>` : ""}
      ${(event.creatorAccountId || event.ownerAccountId) !== state.session?.accountId ? renderOrganizerContact(owner, 'event', event.id) : ''}
      <div class="detail-actions">
        ${!adminCreated && revision ? `<button class="blue-pill" data-action-button="approve-event" data-id="${event.id}">Approve ${revision.requestType === 'cancellation' ? 'Deletion' : 'Edit'}</button><button class="white-pill" data-action-button="reject-event" data-id="${event.id}">Reject ${revision.requestType === 'cancellation' ? 'Deletion' : 'Edit'}</button>` : ''}
        ${!adminCreated && !revision && ['pending', 'draft', 'changes_requested'].includes(event.status) ? `<button class="blue-pill" data-action-button="approve-event" data-id="${event.id}">Approve</button><button class="white-pill" data-action-button="reject-event" data-id="${event.id}">Reject</button>` : ''}
        ${!adminCreated && !revision && event.status === 'approved' ? `<button class="white-pill" data-action-button="cancel-event" data-id="${event.id}">Cancel Schedule</button>` : ''}
        ${!revision && (adminCreated || event.status === 'approved') ? `<button class="white-pill" data-edit-event="${event.id}">${!adminCreated && event.frequency !== 'none' ? 'Edit Series' : 'Edit'}</button>` : ''}
        ${!revision && (adminCreated || ['approved', 'rejected', 'cancelled'].includes(event.status)) ? `<button class="danger-pill" data-delete-event="${event.id}">Delete</button>` : ''}
      </div>
    </div>
  `;
}

function eventForm() {
  const editing = state.draft.editEventId ? state.data.events.find((event) => event.id === state.draft.editEventId) : null;
  const formDraft = state.draft.formData || {};
  const date = formDraft.startDate || state.draft.date || inputDate(editing?.startsAt) || state.selectedDate;
  const endDate = formDraft.endDate || state.draft.endDate || inputDate(editing?.endsAt) || date;
  const startTime = formDraft.startTime || inputTime(editing?.startsAt) || "08:00";
  const endTime = formDraft.endTime || inputTime(editing?.endsAt) || "09:00";
  const frequency = formDraft.frequency || editing?.frequency || "none";
  const duration = formDraft.duration || (date === endDate ? "single" : "multiple");
  const account = currentAdminAccount();
  return `
    <form class="stack-form schedule-form ${duration === "multiple" ? "is-multiple" : ""}" data-admin-event-form>
      ${!editing ? `<label>Entry type<select class="input" name="entryType"><option value="schedule">Create schedule</option><option value="block" ${formDraft.entryType === 'block' ? 'selected' : ''}>Block date / time</option></select></label><label hidden><span><input type="checkbox" name="blockAllDay" ${formDraft.blockAllDay === 'on' ? 'checked' : ''}> All day</span></label><label hidden>Block reason<input class="input" name="blockReason" maxlength="200" value="${escapeHtml(formDraft.blockReason || '')}"></label><p data-block-help hidden>Org users and other admins cannot create or move schedules into this range. You can still schedule here. Existing schedules stay unchanged. Only you can remove your block.</p>` : ''}
      <label>Organization name<input class="input" value="${escapeHtml(account.organizationName || "Central Student Council")}" disabled></label>
      <label>Event title<input class="input" name="title" value="${escapeHtml(formDraft.title ?? editing?.title ?? "")}" required></label>
      <label>Category<select class="input" name="category">${categories.map((item) => `<option ${selectedOption(formDraft.category || editing?.category || "Worship", item)}>${item}</option>`).join("")}</select></label>
      <label>Venue<input class="input" name="venue" value="${escapeHtml(formDraft.venue ?? editing?.venue ?? "")}" required></label>
      <label>Duration<select class="input" name="duration" data-duration-control><option value="single" ${duration === "single" ? "selected" : ""}>Single day</option><option value="multiple" ${duration === "multiple" ? "selected" : ""}>Multiple days</option></select></label>
      <label>Frequency<select class="input" name="frequency" data-repeat-control>
        <option value="none" ${selectedOption(frequency, "none")}>None</option>
        <option value="daily" ${selectedOption(frequency, "daily")}>Daily</option>
        <option value="weekly" ${selectedOption(frequency, "weekly")}>Weekly</option>
        <option value="monthly" ${selectedOption(frequency, "monthly")}>Monthly</option>
        <option value="yearly" ${selectedOption(frequency, "yearly")}>Yearly</option>
      </select></label>
      <label class="repeat-until-field" hidden>Repeat Until<input class="input" name="repeatUntil" type="date" min="${date}" value="${escapeHtml(formDraft.repeatUntil ?? editing?.repeatUntil ?? "")}"></label>
      <div class="form-grid date-time-grid">
        <label>Start date<input class="input" name="startDate" type="date" value="${date}" required></label>
        <label class="multiple-day-field">End date<input class="input" name="endDate" type="date" value="${endDate}" required></label>
        <label>Start time<input class="input" name="startTime" type="time" value="${startTime}" required></label>
        <label>End time<input class="input" name="endTime" type="time" value="${endTime}" required></label>
      </div>
      <label>Expected attendees<input class="input" name="expectedAttendees" type="number" min="1" value="${escapeHtml(formDraft.expectedAttendees ?? editing?.expectedAttendees ?? 1)}"></label>
      <label class="visibility-field">Visibility<select class="input" name="visibility">
        <option value="internal" ${selectedOption(formDraft.visibility || editing?.visibility || "internal", "internal")}>Internal</option>
        <option value="public" ${selectedOption(formDraft.visibility || editing?.visibility, "public")}>Public</option>
      </select></label>
      <div class="form-grid schedule-textarea-grid">
        <label>Short public description<textarea class="input" name="publicDescription" required>${escapeHtml(formDraft.publicDescription ?? editing?.publicDescription ?? "")}</textarea></label>
        <label>Purpose<textarea class="input" name="purpose" required>${escapeHtml(formDraft.purpose ?? editing?.purpose ?? "")}</textarea></label>
      </div>
      <input type="hidden" name="otherCategoryDetail" value="${escapeHtml(formDraft.otherCategoryDetail ?? editing?.otherCategoryDetail ?? "")}">
      <button class="blue-pill" type="submit" ${state.calendarSaving ? "disabled" : ""}>${editing ? "Save Changes" : "Create Approved Schedule"}</button>
    </form>
  `;
}

function bookingForm() {
  const editing = state.draft.editBookingId ? state.data.bookings.find(item => item.id === state.draft.editBookingId) : null;
  if (state.draft.editBookingId && (!editing || !isAdminCreatedBooking(editing) || editing.status === 'cancelled')) return '<div class="empty-state">Reservation unavailable for editing. Refresh and reopen it.</div>';
  const formDraft = state.draft.formData || {};
  const date = formDraft.selectedDate || editing?.selectedDate || state.draft.date || state.selectedDate;
  const startTime = formDraft.startTime || editing?.startTime?.slice(0, 5) || state.draft.startTime || "07:00";
  const endTime = formDraft.endTime || editing?.endTime?.slice(0, 5) || state.draft.endTime || minutesToTime(Math.min(timeToMinutes(startTime) + 60, 22 * 60));
  const frequency = formDraft.frequency || editing?.frequency || "none";
  return `
    <form class="modal-form" data-admin-booking-form data-booking-id="${escapeHtml(editing?.id || '')}">
      <label>Selected date<input class="input" name="selectedDate" type="date" value="${date}" required></label>
      <div class="form-grid">
        <label>Start time<input class="input" name="startTime" type="time" value="${startTime}" min="07:00" max="21:30" step="1800" required></label>
        <label>End time<input class="input" name="endTime" type="time" value="${endTime}" min="07:30" max="22:00" step="1800" required></label>
      </div>
      <label>Frequency<select class="input" name="frequency" data-repeat-control><option value="none" ${selectedOption(frequency, "none")}>Does not repeat</option><option value="weekly" ${selectedOption(frequency, "weekly")}>Weekly</option><option value="monthly" ${selectedOption(frequency, "monthly")}>Monthly</option><option value="yearly" ${selectedOption(frequency, "yearly")}>Yearly</option></select></label>
      <label class="repeat-until-field" hidden>Repeat until<input class="input" name="repeatUntil" type="date" min="${date}" value="${escapeHtml(formDraft.repeatUntil ?? editing?.repeatUntil ?? "")}"></label>
      ${editing?.frequency !== 'none' && editing ? '<p class="field-note">Changes apply to the entire recurring reservation.</p>' : ''}
      <button class="blue-pill" type="submit" ${state.bookingSaving ? 'Saving...' : ''}>${state.bookingSaving ? 'Saving...' : editing ? 'Save Changes' : 'Create Approved Reservation'}</button>
    </form>
  `;
}

function bookingDetail() {
  const booking = state.data.bookings.find((item) => item.id === state.detailBookingId);
  if (!booking) return `<div class="empty-state">Booking unavailable.</div>`;
  const owner = accountById(booking.ownerAccountId);
  const startsAt = state.detailBookingStartsAt || booking.startsAt;
  const endsAt = state.detailBookingEndsAt || booking.endsAt;
  const repeatLabel = booking.frequency === "none" ? "Does not repeat" : `${booking.frequency} until ${booking.repeatUntil || "not set"}`;
  return `
    <section class="event-detail-modal">
      <div class="detail-list schedule-detail-list">
        <article><span>Room</span><strong>CSC Conference Room</strong></article>
        <article><span>Status</span><strong>${escapeHtml(bookingStatusLabel(booking.status))}</strong></article>
        ${changeRequestSummary(isAdminCreatedBooking(booking) ? null : booking.pendingRevision, escapeHtml, booking)}
        <article><span>Organization</span><strong>${escapeHtml(owner?.organizationName || "Unknown organization")}</strong></article>
        <article><span>Frequency</span><strong>${escapeHtml(repeatLabel)}</strong></article>
        <article class="wide"><span>Date and time</span><strong>${escapeHtml(inputDate(startsAt))} · ${formatTime(startsAt)}-${formatTime(endsAt)}</strong></article>
      ${renderOrganizerContact(owner, 'booking', booking.id)}
        <div class="detail-actions">
          ${isAdminCreatedBooking(booking) ? adminBookingActions(booking) : `
          ${!booking.pendingRevision && booking.status !== "cancelled" && booking.status !== "pending" ? `<button class="white-pill" data-action-button="pending-booking" data-id="${booking.id}">Pending</button>` : ""}
          ${booking.status !== "cancelled" && (booking.pendingRevision || booking.status !== "approved") ? `<button class="blue-pill" data-action-button="approve-booking" data-id="${booking.id}">${booking.pendingRevision ? `Approve ${booking.pendingRevision.request_type === "cancellation" ? "Deletion" : "Edit"}` : "Approve"}</button>` : ""}
          ${booking.status !== "cancelled" && (booking.pendingRevision || booking.status !== "rejected") ? `<button class="white-pill" data-action-button="reject-booking" data-id="${booking.id}">${booking.pendingRevision ? `Reject ${booking.pendingRevision.request_type === "cancellation" ? "Deletion" : "Edit"}` : "Reject"}</button>` : ""}
          `}
        </div>
      </div>
    </section>
  `;
}

function notificationsModal() {
  const notifications = adminNotifications();
  const unreadNotifications = notifications.filter((notification) => !notification.readAt);
  return `
    <section class="notifications-modal">
      ${state.notificationsLoadError ? `<p role="alert">${escapeHtml(state.notificationsLoadError)} <button type="button" data-retry-notifications>Retry</button></p>` : ""}
      ${unreadNotifications.length ? `<button class="white-pill notification-mark-all" type="button" data-mark-all-notifications>Mark all as read</button>` : ""}
      ${
        notifications.length
          ? notifications.map((notification) => `
              <article class="${notification.readAt ? "" : "unread"}">
                <div class="notification-row">
                  <span>${notification.readAt ? "Read" : "Unread"}</span>
                  ${notification.readAt ? "" : `<button type="button" data-mark-notification-read="${notification.id}">Mark as read</button>`}
                </div>
                <strong>${escapeHtml(notification.message)}</strong>
                <small>${escapeHtml(formatNotificationDate(notification.createdAt))}</small>
                ${["event", "booking"].includes(notification.targetType) ? `<button class="blue-pill" type="button" data-open-schedule-notification="${notification.id}">Open ${notification.targetType === "booking" ? "booking" : "schedule"}</button>` : ""}
              </article>
            `).join("")
          : `<div class="empty-state">${state.notificationsLoading ? "Loading notifications�" : "No notifications yet."}</div>`
      }
    </section>
  `;
}

function modal() {
  if (!state.modal) return "";
  const isCalendar = ['day-schedules', 'event', 'event-detail'].includes(state.modal);
  const isRoom = ['booking', 'booking-detail'].includes(state.modal);
  const event = state.data.events.find(item => item.id === (state.modal === 'event' ? state.draft.editEventId : state.detailEventId));
  const booking = state.data.bookings.find(item => item.id === state.detailBookingId);
  const popupAttributes = isCalendar || isRoom ? `data-popup-kind="${isRoom ? 'room' : 'calendar'}" data-popup-category="${escapeHtml(event?.category || '')}" data-popup-status="${escapeHtml(state.modal === 'booking-detail' ? booking?.status || '' : '')}"` : '';
  const title = state.modal === "day-schedules" ? `Schedules · ${escapeHtml(state.dayScheduleDate)}` : state.modal === "notifications" ? "Notifications" : state.modal === "booking-detail" ? "Conference Room Booking" : state.modal === "event-detail" ? "Schedule Details" : state.modal === "event" ? (state.draft.editEventId ? "Edit Schedule" : "Create Schedule") : (state.draft.editBookingId ? "Edit Admin Reservation" : "Create Admin Reservation");
  const body = state.modal === "day-schedules" ? daySchedules() : state.modal === "notifications" ? notificationsModal() : state.modal === "booking-detail" ? bookingDetail() : state.modal === "event-detail" ? eventDetail() : state.modal === "event" ? eventForm() : bookingForm();
  return `
    <div class="modal-backdrop" data-close-modal>
      <section class="modal-card ${state.modal === "event-detail" ? "detail-modal-card main-schedule-detail-card" : ""} ${isCalendar || isRoom ? 'schedule-popup-card' : ''}" ${popupAttributes}>
        <div class="modal-topline"><strong>${title}</strong><button class="white-pill" data-close-modal>Close</button></div>
        ${body}
      </section>
    </div>
  `;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function content() {
  if (state.route === '/personal-room') return '<div data-personal-room></div>';
  if (state.route === "/rooms") return roomView();
  if (state.route === "/concerns") return concernsView();
  if (state.route === "/profiles") return profilesView();
  if (state.route === "/announcements") return announcementsView();
  if (state.calendarView === "year") return calendarYear();
  return calendarView();
}

function pageTitle() {
  const titles = {
    "/calendar": "Admin Calendar",
    "/rooms": "Conference Room",
    "/personal-room": "Personal Room",
    "/concerns": "Organization Concerns",
    "/profiles": "Profile Accounts",
    "/announcements": "Announcements",
  };
  return titles[state.route] || "Admin Calendar";
}

function navButton(path, label) {
  return `<button class="${state.route === path ? "active" : ""}" data-route="${path}">${label}</button>`;
}

function header() {
  const isCalendar = state.route === "/calendar";
  const isRoom = state.route === "/rooms";
  const organizationOptions = calendarOrganizationOptions(state.data.accounts, state.session?.accountId)
    .map((option) => `<option value="${escapeHtml(option.id)}" ${state.selectedAccountId === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
    .join("");
  return `
    <header class="admin-org-header ${isCalendar ? "main-calendar-header" : ""} ${isCalendar || isRoom || state.route === "/personal-room" ? "schedule-calendar-header" : ""}">
      <div class="admin-org-brand">
        ${
          isCalendar
            ? `<button class="hamburger" type="button" data-toggle-panel aria-label="Open side panel">☰</button>`
            : `<button class="hamburger back-button" type="button" data-route="/calendar" aria-label="Back to Main Calendar" title="Back to Main Calendar">${BACK_ICON}</button>`
        }
        <img class="seal" src="./src/assets/csc-logo.png" alt="CSC S.Y.N.C. logo">
        <div>
          <strong>CSC S.Y.N.C.</strong>
          <small>Systemized Year-round Network Calendar</small>
        </div>
      </div>
      <h1 ${state.route === '/personal-room' ? 'data-personal-room-title' : ''}>${isCalendar || isRoom || state.route === '/personal-room' ? monthTitle(state.selectedDate) : pageTitle()}</h1>
      <div class="admin-header-controls">
        ${state.route === '/personal-room' ? '<div data-personal-room-controls></div>' : ''}
        ${isCalendar ? `
          <select class="top-pill" data-account-filter aria-label="Organization filter">
            <option value="all" ${state.accountFilter !== "selected" ? "selected" : ""}>Organizations</option>
            ${organizationOptions}
            ${organizationOptions ? "" : `<option value="" disabled>No organizations found</option>`}
          </select>
          <select class="top-pill" data-calendar-view aria-label="Calendar view">
            ${["Month", "Year"].map((view) => `<option value="${view.toLowerCase()}" ${state.calendarView === view.toLowerCase() ? "selected" : ""}>${view}</option>`).join("")}
          </select>
          <button class="round-button" type="button" data-month-step="-1" aria-label="Previous month" title="Previous month">${PREV_ICON}</button>
          <button class="round-button" type="button" data-month-step="1" aria-label="Next month" title="Next month">${NEXT_ICON}</button>
        ` : ""}
        ${isRoom ? `
          <button class="round-button" type="button" data-week-step="-1" aria-label="Previous week" title="Previous week">${PREV_ICON}</button>
          <button class="round-button" type="button" data-week-step="1" aria-label="Next week" title="Next week">${NEXT_ICON}</button>
        ` : ""}
        ${state.loading ? `<span class="loading">Loading...</span>` : ""}
        <button class="round-button bell" type="button" data-open-notifications aria-label="Notifications" title="Notifications">🔔${unreadNotificationCount() ? `<i>${unreadNotificationCount()}</i>` : ""}</button>
      </div>
    </header>
  `;
}

function sidePanel() {
  return `
    ${state.sidePanelOpen ? `<button class="side-panel-scrim" data-close-panel aria-label="Close side panel"></button>` : ""}
    <aside class="admin-side-panel ${state.sidePanelOpen ? "open" : ""}">
      <div class="side-panel-scroll">
        <section class="side-section">
          <h2>Scheduling Actions</h2>
          <button class="blue-pill" data-open-event-form>Create Schedule</button>
        </section>
        <section class="side-section">
          <h2>Admin Navigation</h2>
          ${navButton("/rooms", "Conference Room")}
          ${navButton("/personal-room", "Personal Room")}
          ${navButton("/concerns", "Concerns")}
          ${navButton("/profiles", "Profiles")}
          ${navButton("/announcements", "Announcements")}
        </section>
      </div>
      <section class="account-strip">
        <h2>Admin Account</h2>
        <div class="account-row">
          <div class="avatar">AD</div>
          <div>
            <strong>${escapeHtml(currentAdminAccount().councilName || 'CSC Administrator')}</strong>
            <small>${escapeHtml(state.session.email)}</small>
          </div>
          <button class="logout-red" data-logout>Logout</button>
        </div>
      </section>
    </aside>
  `;
}

function renderLogin() {
  const signup = state.authView === 'signup';
  const draft = state.adminSignupDraft;
  return `
    <main class="admin-login">
      <section class="login-card ${signup ? 'admin-signup-card' : ''}">
        <img src="./src/assets/csc-logo.png" alt="CSC S.Y.N.C. logo">
        <h1>${signup ? 'Create Admin Account' : 'CSC SYNC Admin'}</h1>
        <p>${signup ? 'Create your CSC Council account. An existing administrator must approve your admin access.' : 'Sign in with your administrator account.'}</p>
        ${signup ? `<form data-admin-signup-form>
          <label>Officer name<input class="input" name="officerName" autocomplete="name" value="${escapeHtml(draft.officerName || '')}" required></label>
          <label>User account<input class="input" name="userAccount" type="email" autocomplete="username" value="${escapeHtml(draft.userAccount || '')}" required></label>
          <label>Organization<input class="input" value="Central Student Council" readonly></label>
          <label>Council Name<input class="input" name="councilName" maxlength="200" value="${escapeHtml(draft.councilName || '')}" required></label>
          <label>Phone number<input class="input" name="phone" type="tel" autocomplete="tel" value="${escapeHtml(draft.phone || '')}" required></label>
          <label>Password<input class="input" name="password" type="password" autocomplete="new-password" minlength="6" required></label>
          <label>Confirm password<input class="input" name="confirmPassword" type="password" autocomplete="new-password" minlength="6" required></label>
          <button class="blue-pill" type="submit" ${state.authSubmitting ? 'disabled' : ''}>${state.authSubmitting ? 'Creating account…' : 'Create Admin Account'}</button>
        </form>` : `<form data-login-form autocomplete="off">
          <label>Admin account<input class="input" name="userAccount" type="email" value="${escapeHtml(state.loginEmail)}" autocomplete="off" required></label>
          <label>Password<input class="input" name="password" type="password" autocomplete="current-password" required></label>
          <button class="blue-pill" type="submit" ${state.authSubmitting ? 'disabled' : ''}>${state.authSubmitting ? 'Signing in…' : 'Admin Login'}</button>
        </form>`}
        ${state.toast ? `<p class="toast ${state.toast.type}">${escapeHtml(state.toast.message)}</p>` : ""}
        <button class="white-pill" type="button" data-admin-auth-view="${signup ? 'login' : 'signup'}" ${state.authSubmitting ? 'disabled' : ''}>${signup ? 'Back to Login' : 'Create Admin Account'}</button>
      </section>
    </main>
  `;
}

function renderDashboard() {
  return `
    <div class="admin-shell">
      ${header()}
      ${sidePanel()}
      <main class="admin-main">
        ${content()}
      </main>
      ${modal()}
      ${state.toast ? `<aside class="admin-toast toast ${state.toast.type}" role="${state.toast.type === 'error' ? 'alert' : 'status'}"><span>${escapeHtml(state.toast.message)}</span><button type="button" data-dismiss-toast aria-label="Dismiss notification">×</button></aside>` : ''}
      ${state.dataLoadError ? `<aside class="admin-load-error" role="alert"><span>${state.hasLoadedData ? "Schedules could not be refreshed. Your last loaded schedules are still shown." : "Schedules could not be loaded. Check your connection and try again."}</span><button class="white-pill" data-retry-calendar>Retry</button></aside>` : ""}
    </div>
  `;
}

function render() {
  if (deferFormRender(root, render)) return;
  const restoreSidePanelScroll = captureSidePanelScroll(root);
  const restoreFormView = captureFormView(root, JSON.stringify([
    state.session?.accountId, state.route, state.modal, state.authView,
    state.draft.editEventId, state.draft.editBookingId, state.draft.date, state.draft.endDate,
  ]));
  saveAdminUi();
  root.innerHTML = state.session ? renderDashboard() : renderLogin();
  bind();
  mountOrganizerContacts(root, supabaseRequest);
  bindCalendarBlocks(root, { blocks: state.data.calendarBlocks, accountId: state.session?.accountId, request: supabaseRequest, admin: true, onChange: loadAdminData });
  bindSchedulePopupColors(root);
  mountPersonalRoom(root.querySelector('[data-personal-room]'), {
    accountId: state.session?.accountId, token: state.session?.accessToken,
    request: supabaseRequest,
    variant: 'admin',
    profile: currentAdminAccount,
  });
  restoreFormView();
  restoreSidePanelScroll();
}

function setToast(type, message) {
  state.toast = { type, message };
  render();
}

function bind() {
  const loginDraftForm = root.querySelector('[data-login-form]');
  if (loginDraftForm) bindFormDraft(loginDraftForm, LOGIN_DRAFT);
  root.querySelector('[data-dismiss-toast]')?.addEventListener('click', () => { state.toast = null; render(); });
  root.querySelector('[data-admin-auth-view]')?.addEventListener('click', event => {
    if (state.authSubmitting) return;
    state.authView = event.currentTarget.dataset.adminAuthView;
    state.toast = null;
    render();
  });
  const signupForm = root.querySelector('[data-admin-signup-form]');
  const saveSignupDraft = () => {
    const values = Object.fromEntries(new FormData(signupForm).entries());
    state.adminSignupDraft = Object.fromEntries(['officerName', 'userAccount', 'councilName', 'phone'].map(key => [key, values[key] || '']));
    localStorage.setItem('csc-sync-admin-signup-draft', JSON.stringify(state.adminSignupDraft));
  };
  signupForm?.addEventListener('input', saveSignupDraft);
  signupForm?.addEventListener('change', saveSignupDraft);
  signupForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (state.authSubmitting) return;
    saveSignupDraft();
    const values = Object.fromEntries(new FormData(signupForm).entries());
    state.authSubmitting = true;
    state.toast = null;
    render();
    try {
      const message = await createAdminAccount(values);
      state.adminSignupDraft = {};
      localStorage.removeItem('csc-sync-admin-signup-draft');
      state.loginEmail = '';
      clearFormDraft(LOGIN_DRAFT);
      state.authView = 'login';
      state.toast = { type: 'success', message };
    } catch (error) { state.toast = { type: 'error', message: error.message }; }
    finally { state.authSubmitting = false; render(); }
  });
  root.querySelectorAll('[data-review-admin]').forEach(button => button.addEventListener('click', async () => {
    if (state.adminRegistrationBusy) return;
    const accountId = button.dataset.reviewAdmin;
    const approve = button.dataset.approve === 'true';
    const request = state.data.adminRegistrations.find(item => item.account_id === accountId);
    if (!request || !window.confirm(`${approve ? 'Approve administrator access for' : 'Reject the admin request from'} ${request.email}?`)) return;
    const token = state.session?.accessToken;
    state.adminRegistrationBusy = accountId;
    render();
    try {
      const row = await supabaseRequest('/rpc/review_admin_registration', { method: 'POST', body: JSON.stringify({ p_account_id: accountId, p_approve: approve }) });
      if (state.session?.accessToken !== token) return;
      if (row?.account_id !== accountId || row.status !== (approve ? 'approved' : 'rejected')) throw new Error('The admin access decision was not confirmed. Refresh and retry.');
      state.data.adminRegistrations = state.data.adminRegistrations.filter(item => item.account_id !== accountId);
      state.data.accounts = state.data.accounts.map(account => account.id === accountId ? {
        ...account, active: approve,
        ...(approve ? { role: 'administrator', officerName: row.officer_name, organizationName: 'Central Student Council', councilName: row.csc_council, phone: row.phone } : {}),
      } : account);
      state.toast = { type: 'success', message: approve ? 'Admin account approved. The user can now sign in after confirming their email.' : 'Admin account request rejected.' };
    } catch (error) {
      if (state.session?.accessToken === token) state.toast = { type: 'error', message: error.message };
    } finally {
      if (state.session?.accessToken === token) { state.adminRegistrationBusy = ''; render(); }
    }
  }));
  root.querySelectorAll("[data-remove-announcement]").forEach((button) => button.addEventListener("click", async () => {
    if (state.deletingAnnouncementId) return;
    if (!window.confirm("Remove this announcement and its organization notifications? This cannot be undone.")) return;
    const id = button.dataset.removeAnnouncement;
    const token = state.session?.accessToken;
    state.deletingAnnouncementId = id;
    state.announcementNotice = null;
    render();
    try {
      const removedId = await supabaseRequest("/rpc/remove_announcement", { method: "POST", body: JSON.stringify({ p_announcement_id: id }) });
      if (state.session?.accessToken !== token) return;
      if (removedId !== id) throw new Error("Removal could not be confirmed. Please refresh and retry.");
      state.data.announcements = state.data.announcements.filter((item) => item.id !== id);
      state.data.notifications = state.data.notifications.filter((item) => !(item.targetType === "announcement" && item.targetId === id));
      state.announcementNotice = { type: "success", message: "Announcement and its organization notifications removed." };
    } catch (error) {
      if (state.session?.accessToken !== token) return;
      state.announcementNotice = { type: "error", message: error.code === "PGRST202" ? "Apply database migration 020_remove_announcements.sql to enable removal. Your draft is saved." : `Announcement could not be removed: ${error.message}` };
    } finally {
      state.deletingAnnouncementId = "";
      render();
    }
  }));
  const announcementForm = root.querySelector("[data-announcement-form]");
  const saveAnnouncementDraft = () => {
    state.announcementDraft = Object.fromEntries(new FormData(announcementForm).entries());
    saveAdminUi();
  };
  announcementForm?.addEventListener("input", saveAnnouncementDraft);
  announcementForm?.addEventListener("change", saveAnnouncementDraft);
  announcementForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.announcementPosting) return;
    const values = Object.fromEntries(new FormData(announcementForm).entries());
    const accountId = state.session?.accountId;
    state.announcementDraft = values;
    state.announcementPosting = true;
    state.announcementNotice = null;
    render();
    try {
      const announcement = await postAnnouncement(values);
      if (state.session?.accountId !== accountId) return;
      state.data.announcements = [announcement, ...state.data.announcements.filter((item) => item.id !== announcement.id)];
      state.announcementDraft = { title: "", body: "" };
      state.announcementNotice = { type: "success", message: "Announcement posted and delivered to organization notifications." };
    } catch (error) {
      if (state.session?.accountId !== accountId) return;
      state.announcementNotice = { type: "error", message: error.message };
    } finally {
      state.announcementPosting = false;
      render();
    }
  });
  root.querySelector("[data-retry-bookings]")?.addEventListener("click", refreshRoomBookings);
  root.querySelector("[data-retry-calendar]")?.addEventListener("click", () => loadAdminData().catch(() => {}));
  root.querySelectorAll("[data-admin-event-form], [data-admin-booking-form]").forEach((form) => {
    if (form.matches("[data-admin-booking-form]") && state.bookingSaving) form.querySelectorAll("input, select").forEach(field => { field.disabled = true; });
    const saveDraft = () => {
      state.draft = {
        ...state.draft,
        formData: Object.fromEntries(new FormData(form).entries()),
      };
      saveAdminUi();
    };
    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);
  });

  root.querySelector("[data-login-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.authSubmitting) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    state.loginEmail = values.userAccount;
    state.authSubmitting = true;
    state.toast = null;
    render();
    try {
      await login(values);
    } catch (error) {
      state.toast = { type: 'error', message: error.message };
    } finally {
      state.authSubmitting = false;
      render();
    }
  });

  root.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => {
    state.route = button.dataset.route;
    if (state.route === "/rooms") state.selectedDate = manilaDate(new Date().toISOString());
    state.sidePanelOpen = false;
    render();
    if (state.route === "/rooms") void refreshRoomBookings();
  }));

  root.querySelectorAll("[data-refresh]").forEach((button) => button.addEventListener("click", () => loadAdminData().catch((error) => setToast("error", error.message))));
  root.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", logout));
  root.querySelector("[data-toggle-panel]")?.addEventListener("click", () => {
    state.sidePanelOpen = !state.sidePanelOpen;
    render();
  });
  root.querySelector("[data-open-notifications]")?.addEventListener("click", () => {
    state.modal = "notifications";
    void refreshAdminNotifications();
    state.detailEventId = "";
    state.draft = {};
    state.sidePanelOpen = false;
    render();
  });
  root.querySelectorAll("[data-close-panel]").forEach((button) => button.addEventListener("click", () => {
    state.sidePanelOpen = false;
    render();
  }));
  root.querySelector("[data-open-event-form]")?.addEventListener("click", () => {
    state.modal = "event";
    state.detailEventId = "";
    state.sidePanelOpen = false;
    state.draft = { date: state.selectedDate, endDate: state.selectedDate };
    render();
  });
  root.querySelector("[data-open-booking-form]")?.addEventListener("click", () => {
    state.modal = "booking";
    state.detailEventId = "";
    state.sidePanelOpen = false;
    state.draft = { date: state.selectedDate, startTime: "07:00" };
    render();
  });

  root.querySelectorAll("[data-event-detail]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    state.detailEventId = button.dataset.eventDetail;
    state.detailEventStartsAt = button.dataset.eventStartsAt || "";
    state.detailEventEndsAt = button.dataset.eventEndsAt || "";
    state.modal = "event-detail";
    state.draft = {};
    render();
  }));
  root.querySelectorAll("[data-booking-detail]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    state.detailBookingId = button.dataset.bookingDetail;
    state.detailBookingStartsAt = button.dataset.bookingStartsAt;
    state.detailBookingEndsAt = button.dataset.bookingEndsAt;
    state.modal = "booking-detail";
    state.draft = {};
    render();
  }));
  root.querySelectorAll('[data-edit-booking]').forEach(button => button.addEventListener('click', () => {
    if (state.bookingSaving) return;
    try {
      const booking = requireAdminBooking(button.dataset.editBooking);
      state.modal = 'booking';
      state.draft = { editBookingId: booking.id };
      state.detailBookingStartsAt = state.detailBookingEndsAt = '';
      render();
    } catch (error) { setToast('error', error.message); }
  }));
  root.querySelectorAll('[data-delete-booking]').forEach(button => button.addEventListener('click', async () => {
    if (state.bookingSaving) return;
    const booking = state.data.bookings.find(item => item.id === button.dataset.deleteBooking);
    if (!window.confirm(booking?.frequency !== 'none' ? 'Delete this reservation and all its recurring dates?' : 'Delete this Conference Room reservation?')) return;
    state.bookingSaving = true;
    button.disabled = true;
    try {
      await deleteAdminBooking(button.dataset.deleteBooking);
      state.modal = null;
      state.detailBookingId = '';
      state.detailBookingStartsAt = state.detailBookingEndsAt = '';
      state.draft = {};
      setToast('success', 'Conference Room reservation deleted.');
    } catch (error) { setToast('error', error.message); }
    finally { state.bookingSaving = false; render(); }
  }));
  root.querySelectorAll("[data-edit-event]").forEach((button) => button.addEventListener("click", () => {
    state.modal = "event";
    state.draft = { editEventId: button.dataset.editEvent };
    render();
  }));
  root.querySelectorAll("[data-delete-event]").forEach((button) => button.addEventListener("click", async () => {
    const confirmed = window.confirm("Delete this schedule from the database? This cannot be undone.");
    if (!confirmed) return;
    button.disabled = true;
    try {
      await deleteAdminEvent(button.dataset.deleteEvent);
      state.modal = null;
      state.detailEventId = "";
      state.detailBookingId = "";
      state.detailBookingStartsAt = "";
      state.detailBookingEndsAt = "";
      state.draft = {};
      await loadAdminData();
      setToast("success", "Schedule deleted from the database.");
    } catch (error) {
      setToast("error", error.message);
    } finally {
      button.disabled = false;
    }
  }));
  root.querySelector("[data-day-create]")?.addEventListener("click", () => {
    state.modal = "event";
    render();
  });
  bindMonthOverflow(root);
  bindScheduleValidation(root.querySelector("[data-admin-event-form]"));
  bindCalendarDateSelection();
  bindConferenceRoomSelection();
  root.querySelectorAll("[data-month-step]").forEach((button) => button.addEventListener("click", () => {
    state.selectedDate = adjacentMonth(state.selectedDate, Number(button.dataset.monthStep));
    render();
  }));
  root.querySelector("[data-account-filter]")?.addEventListener("change", (event) => {
    const value = event.currentTarget.value;
    state.accountFilter = value === "all" ? "all" : "selected";
    state.selectedAccountId = value === "all" ? "" : value;
    render();
  });
  root.querySelector("[data-calendar-view]")?.addEventListener("change", (event) => {
    state.calendarView = event.currentTarget.value;
    render();
  });
  root.querySelectorAll("[data-year-month]").forEach((button) => button.addEventListener("click", (event) => {
    if (event.target.closest("[data-event-detail]")) return;
    state.selectedDate = button.dataset.yearMonth;
    state.calendarView = "month";
    render();
  }));
  root.querySelectorAll("[data-week-step]").forEach((button) => button.addEventListener("click", () => {
    state.selectedDate = addDays(state.selectedDate, Number(button.dataset.weekStep) * 7);
    render();
  }));
  root.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", (event) => {
    if (state.bookingSaving && ["booking", "booking-detail"].includes(state.modal)) return;
    if (event.target === button || button.classList.contains("white-pill")) {
      state.modal = null;
      state.detailEventId = "";
      state.detailBookingId = "";
      state.detailBookingStartsAt = "";
      state.detailBookingEndsAt = "";
      state.draft = {};
      render();
    }
  }));
  root.querySelectorAll("[data-repeat-control]").forEach((control) => {
    const form = control.closest("form");
    const field = form?.querySelector(".repeat-until-field");
    const input = field?.querySelector("[name='repeatUntil']");
    const startDate = form?.querySelector("[name='startDate'], [name='selectedDate']");
    const sync = () => {
      const repeats = control.value !== "none";
      field?.toggleAttribute("hidden", !repeats);
      if (input) {
        input.required = repeats;
        if (startDate?.value) input.min = startDate.value;
        if (!repeats) input.value = "";
      }
    };
    control.addEventListener("change", sync);
    startDate?.addEventListener("change", sync);
    sync();
  });
  root.querySelectorAll("[data-duration-control]").forEach((control) => {
    const form = control.closest("form");
    const startDate = form?.querySelector("[name='startDate']");
    const endDate = form?.querySelector("[name='endDate']");
    const syncDuration = () => {
      const isMultiple = control.value === "multiple";
      form?.classList.toggle("is-multiple", isMultiple);
      if (!isMultiple && startDate && endDate) endDate.value = startDate.value;
    };
    control.addEventListener("change", syncDuration);
    startDate?.addEventListener("change", () => {
      if (control.value !== "multiple" && endDate) endDate.value = startDate.value;
    });
    syncDuration();
  });
  bindBookingTimeGuards();
  root.querySelector("[data-admin-event-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.calendarSaving) return;
    state.calendarSaving = true;
    event.currentTarget.querySelector("[type=submit]").disabled = true;
    try {
      const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (formData.duration !== "multiple") formData.endDate = formData.startDate;
      const editEventId = state.draft.editEventId;
      if (editEventId) await updateAdminEvent(editEventId, formData);
      else if (formData.entryType === 'block') {
        const rows = await supabaseRequest('/calendar_blocks', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(calendarBlockValues(formData, state.session.accountId)) });
        if (!rows?.[0]?.id) throw new Error('The block was not saved. Apply 042_calendar_time_blocks.sql if setup is missing.');
      } else await createAdminEvent(formData);
      state.modal = null;
      state.detailEventId = "";
      state.detailBookingId = "";
      state.detailBookingStartsAt = "";
      state.detailBookingEndsAt = "";
      state.draft = {};
      await loadAdminData();
      setToast("success", editEventId ? "Schedule updated." : formData.entryType === "block" ? "Date/time blocked." : "Admin schedule created and approved.");
    } catch (error) {
      setToast("error", error.message);
    } finally {
      state.calendarSaving = false;
      const submit = root.querySelector("[data-admin-event-form] [type=submit]");
      if (submit) submit.disabled = false;
    }
  });
  root.querySelector("[data-admin-booking-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.bookingSaving) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const editBookingId = state.draft.editBookingId;
    state.bookingSaving = true;
    render();
    try {
      if (editBookingId) await updateAdminBooking(editBookingId, values);
      else await createAdminBooking(values);
      state.modal = null;
      state.detailBookingId = '';
      state.detailBookingStartsAt = state.detailBookingEndsAt = '';
      state.draft = {};
      setToast("success", editBookingId ? "Conference Room reservation updated." : "Admin reservation created and approved.");
    } catch (error) { setToast("error", error.message); }
    finally { state.bookingSaving = false; render(); }
  });
  root.querySelectorAll('[data-profile-form]').forEach(form => {
    const accountId = form.dataset.profileForm;
    const saveDraft = () => {
      state.profileDrafts[accountId] = Object.fromEntries(new FormData(form).entries());
      saveAdminUi();
    };
    form.addEventListener('input', saveDraft);
    form.addEventListener('change', saveDraft);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (state.profileSavingId) return;
      saveDraft();
      const values = { ...state.profileDrafts[accountId] };
      const token = state.session?.accessToken;
      state.profileSavingId = accountId;
      delete state.profileNotices[accountId];
      render();
      try {
        const row = await updateAccount(accountId, values);
        if (state.session?.accessToken !== token) return;
        const updated = mapProfile(row, { [accountId]: accountById(accountId)?.role || 'registered' });
        state.data.accounts = state.data.accounts.map(account => account.id === accountId ? updated : account);
        delete state.profileDrafts[accountId];
        state.profileNotices[accountId] = { type: 'success', message: 'Account changes saved to the database.' };
      } catch (error) {
        if (state.session?.accessToken !== token) return;
        state.profileNotices[accountId] = { type: 'error', message: error.message };
      } finally {
        if (state.session?.accessToken === token) {
          state.profileSavingId = '';
          render();
        }
      }
    });
  });
  root.querySelectorAll("[data-block-account]").forEach((button) => button.addEventListener("click", async () => {
    const shouldBlock = button.dataset.blockState === "block";
    const confirmed = window.confirm(`${shouldBlock ? "Block" : "Unblock"} this organization account?`);
    if (!confirmed) return;
    button.disabled = true;
    try {
      await setAccountBlocked(button.dataset.blockAccount, shouldBlock);
      await loadAdminData();
      setToast("success", shouldBlock ? "Account blocked." : "Account unblocked.");
    } catch (error) {
      setToast("error", error.message);
    } finally {
      button.disabled = false;
    }
  }));
  root.querySelectorAll("[data-delete-account]").forEach((button) => button.addEventListener("click", async () => {
    const confirmed = window.confirm("Delete this account profile from CSC SYNC? This removes app access for this account.");
    if (!confirmed) return;
    button.disabled = true;
    try {
      await deleteAccount(button.dataset.deleteAccount);
      await loadAdminData();
      setToast("success", "Account profile deleted.");
    } catch (error) {
      setToast("error", error.message);
    } finally {
      button.disabled = false;
    }
  }));
  root.querySelectorAll("[data-concern-status]").forEach((select) => select.addEventListener("change", async () => {
    try {
      await updateConcernStatus(select.dataset.concernStatus, select.value);
      await loadAdminData();
      setToast("success", "Concern status updated.");
    } catch (error) {
      setToast("error", error.message);
    }
  }));
  root.querySelectorAll("[data-open-schedule-notification]").forEach(button => button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const notification = adminNotifications().find(item => item.id === button.dataset.openScheduleNotification);
      const session = state.session;
      const target = await loadNotificationTarget(notification, path => supabaseRequest(path));
      if (state.session !== session) return;
      if (!notification.readAt) await markNotificationRead(notification.id);
      const item = target.kind === "event" ? mapEvent(target.row, target.occurrence, target.series, target.revision ? mapRevision(target.revision) : null, roleMap(state.data.accounts.map(account => ({ user_id: account.id, role: account.role })))) : mapBooking(target.row);
      const key = target.kind === "event" ? "events" : "bookings";
      state.data[key] = [item, ...state.data[key].filter(row => row.id !== item.id)];
      state.route = target.kind === "event" ? "/calendar" : "/rooms";
      state.selectedDate = target.date;
      state.calendarView = "month";
      state.accountFilter = "all";
      state.selectedAccountId = "";
      state.sidePanelOpen = false;
      state.detailEventId = target.kind === "event" ? item.id : "";
      state.detailBookingId = target.kind === "booking" ? item.id : "";
      state.detailEventStartsAt = state.detailEventEndsAt = state.detailBookingStartsAt = state.detailBookingEndsAt = "";
      state.modal = target.kind === "event" ? "event-detail" : "booking-detail";
      render();
    } catch (error) { setToast("error", error.message); }
    finally { button.disabled = false; }
  }));
  root.querySelector("[data-retry-notifications]")?.addEventListener("click", refreshAdminNotifications);
  root.querySelectorAll("[data-mark-notification-read]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await markNotificationRead(button.dataset.markNotificationRead);
      render();
    } catch (error) {
      setToast("error", error.message);
    } finally {
      button.disabled = false;
    }
  }));
  root.querySelectorAll("[data-mark-all-notifications]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const unreadNotifications = adminNotifications().filter((notification) => !notification.readAt);
      await Promise.all(unreadNotifications.map((notification) => markNotificationRead(notification.id)));
      render();
    } catch (error) {
      setToast("error", error.message);
    } finally {
      button.disabled = false;
    }
  }));
  root.querySelectorAll("[data-action-button]").forEach((button) => button.addEventListener("click", async () => {
    if (state.actionSaving) return;
    if (button.dataset.actionButton === 'cancel-event') {
      const event = state.data.events.find(item => item.id === button.dataset.id);
      if (!window.confirm(event?.frequency !== 'none' ? 'Cancel this schedule and all recurring dates? The record will be kept and the organization notified.' : 'Cancel this schedule? The record will be kept and the organization notified.')) return;
    }
    state.actionSaving = true;
    button.disabled = true;
    try {
      const action = button.dataset.actionButton;
      if (action === "approve-event") await approveEvent(button.dataset.id);
      if (action === "cancel-event") await cancelEvent(button.dataset.id);
      if (action === "reject-event") await rejectEvent(button.dataset.id);
      if (action === "pending-booking") await updateBookingStatus(button.dataset.id, "pending");
      if (action === "approve-booking") await updateBookingStatus(button.dataset.id, "approved");
      if (action === "reject-booking") await updateBookingStatus(button.dataset.id, "rejected");
      if (action === "approve-account-request") await approveAccountRequest(button.dataset.id, "approved");
      if (action === "reject-account-request") await approveAccountRequest(button.dataset.id, "rejected");
      state.modal = null;
      state.detailEventId = "";
      state.detailBookingId = "";
      state.detailBookingStartsAt = "";
      state.detailBookingEndsAt = "";
      state.draft = {};
      await loadAdminData();
      setToast("success", "Admin action saved.");
    } catch (error) {
      setToast("error", error.message);
    } finally {
      state.actionSaving = false;
      button.disabled = false;
    }
  }));
}

function openDay(date) {
  state.dayScheduleDate = date;
  state.selectedDate = date;
  state.draft = { date, endDate: date };
  state.detailEventId = "";
  state.modal = eventOccurrencesBetween(date, date, visibleAdminEvents()).length ? "day-schedules" : "event";
  render();
}

function daySchedules() {
  const date = state.dayScheduleDate;
  const events = eventOccurrencesBetween(date, date, visibleAdminEvents());
  return `<div class="day-schedules-body"><section class="day-schedule-list">${events.length ? events.map(eventChip).join("") : "<p>No schedules for this date.</p>"}</section><button class="blue-pill" data-day-create>Create Schedule</button></div>`;
}

function bindCalendarDateSelection() {
  const cells = [...root.querySelectorAll("[data-calendar-date]")].filter((cell) => cell.dataset.calendarDate);
  let dragStart = "";
  let dragEnd = "";
  let didDrag = false;

  function clearPreview() {
    cells.forEach((cell) => cell.classList.remove("range-preview"));
  }

  function previewRange(start, end) {
    clearPreview();
    const [from, to] = sortDates(start, end);
    cells.forEach((cell) => {
    cell.addEventListener("keydown", (event) => {
      if (event.target !== cell || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openDay(cell.dataset.calendarDate);
    });
      const date = cell.dataset.calendarDate;
      if (date >= from && date <= to) cell.classList.add("range-preview");
    });
  }

  function openRange(start, end) {
    const [from, to] = sortDates(start, end);
    state.selectedDate = from;
    state.modal = "event";
    state.detailEventId = "";
    state.draft = { date: from, endDate: to };
    render();
  }

  cells.forEach((cell) => {
    cell.addEventListener("keydown", (event) => {
      if (event.target !== cell || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openDay(cell.dataset.calendarDate);
    });
    cell.addEventListener("pointerdown", (event) => {
      if (event.target.closest("[data-event-detail]")) return;
      
      dragStart = cell.dataset.calendarDate;
      dragEnd = dragStart;
      didDrag = false;
      previewRange(dragStart, dragEnd);
    });

    cell.addEventListener("pointerenter", () => {
      if (!dragStart) return;
      dragEnd = cell.dataset.calendarDate;
      didDrag = dragEnd !== dragStart;
      previewRange(dragStart, dragEnd);
    });

    cell.addEventListener("pointerup", () => {
      if (!dragStart) return;
      const start = dragStart;
      const end = dragEnd || dragStart;
      dragStart = "";
      dragEnd = "";
      clearPreview();
      if (start !== end) openRange(start, end);
    });

    cell.addEventListener("pointercancel", () => {
      dragStart = "";
      dragEnd = "";
      didDrag = false;
      clearPreview();
    });

    cell.addEventListener("click", (event) => {
      if (event.target.closest("[data-event-detail]")) return;
      if (didDrag) {
        event.preventDefault();
        didDrag = false;
        return;
      }
      openDay(cell.dataset.calendarDate);
    });
  });
}

function bindConferenceRoomSelection() {
  const slots = [...root.querySelectorAll("[data-room-date]")];
  let dragDate = "";
  let dragStart = null;
  let dragEnd = null;
  let didDrag = false;

  function clearPreview() {
    slots.forEach((slot) => slot.classList.remove("range-preview"));
  }

  function previewRange(date, startMinutes, endMinutes) {
    clearPreview();
    const from = Math.min(startMinutes, endMinutes);
    const to = Math.max(startMinutes, endMinutes);
    slots.forEach((slot) => {
      if (slot.dataset.roomDate !== date) return;
      const slotStart = timeToMinutes(slot.dataset.roomStart);
      if (slotStart >= from && slotStart <= to) slot.classList.add("range-preview");
    });
  }

  function openBookingRange(date, startMinutes, endMinutes) {
    const from = Math.min(startMinutes, endMinutes);
    const to = Math.max(startMinutes, endMinutes) + ROOM_SLOT_MINUTES;
    state.selectedDate = date;
    state.modal = "booking";
    state.detailEventId = "";
    state.sidePanelOpen = false;
    state.draft = {
      date,
      startTime: minutesToTime(from),
      endTime: minutesToTime(Math.min(to, 22 * 60)),
    };
    render();
  }

  slots.forEach((slot) => {
    slot.addEventListener("pointerdown", () => {
      dragDate = slot.dataset.roomDate;
      dragStart = timeToMinutes(slot.dataset.roomStart);
      dragEnd = dragStart;
      didDrag = false;
      previewRange(dragDate, dragStart, dragEnd);
    });

    slot.addEventListener("pointerenter", () => {
      if (!dragDate || slot.dataset.roomDate !== dragDate) return;
      dragEnd = timeToMinutes(slot.dataset.roomStart);
      didDrag = dragEnd !== dragStart;
      previewRange(dragDate, dragStart, dragEnd);
    });

    slot.addEventListener("pointerup", () => {
      if (!dragDate) return;
      const date = dragDate;
      const start = dragStart;
      const end = dragEnd ?? dragStart;
      dragDate = "";
      dragStart = null;
      dragEnd = null;
      clearPreview();
      openBookingRange(date, start, end);
    });

    slot.addEventListener("pointercancel", () => {
      dragDate = "";
      dragStart = null;
      dragEnd = null;
      didDrag = false;
      clearPreview();
    });

    slot.addEventListener("click", (event) => {
      if (didDrag) {
        event.preventDefault();
        didDrag = false;
      }
    });
  });
}

function bindBookingTimeGuards() {
  root.querySelectorAll("[data-admin-booking-form]").forEach((form) => {
    const start = form.querySelector("[name='startTime']");
    const end = form.querySelector("[name='endTime']");
    if (!start || !end) return;

    const syncTimes = () => {
      let startMinutes = Math.min(Math.max(timeToMinutes(start.value), 7 * 60), 21 * 60 + ROOM_SLOT_MINUTES);
      let endMinutes = Math.min(Math.max(timeToMinutes(end.value), 7 * 60 + ROOM_SLOT_MINUTES), 22 * 60);
      if (endMinutes <= startMinutes) endMinutes = Math.min(startMinutes + ROOM_SLOT_MINUTES, 22 * 60);
      if (endMinutes <= startMinutes) startMinutes = Math.max(endMinutes - ROOM_SLOT_MINUTES, 7 * 60);
      start.value = minutesToTime(startMinutes);
      end.value = minutesToTime(endMinutes);
    };

    start.addEventListener("change", syncTimes);
    end.addEventListener("change", syncTimes);
  });
}

const refreshAdminNotifications = createCollectionRefresh({
  load: async () => (await supabaseRequest(`/notifications?select=*&recipient_account_id=eq.${encodeURIComponent(state.session.accountId)}&order=created_at.desc`)).map(mapNotification),
  sessionKey: () => state.session?.accessToken ? `${state.session.accountId}:${state.session.accessToken}` : "",
  items: () => state.data.notifications,
  apply: notifications => { state.data = { ...state.data, notifications }; },
  status: ({ loading, error }) => { state.notificationsLoading = loading; state.notificationsLoadError = error; render(); },
  errorMessage: "Notifications could not be refreshed. Please retry.",
});

const refreshRoomBookings = createBookingRefresh({
  load: async () => (await supabaseRequest("/room_bookings?select=*,booking_revisions(*)&order=starts_at.asc")).map(mapBooking),
  sessionKey: () => state.session?.accessToken ? `${state.session.accountId}:${state.session.accessToken}` : "",
  bookings: () => state.data.bookings,
  apply: (bookings) => { state.data = { ...state.data, bookings }; },
  status: ({ loading, error }) => {
    state.bookingsLoading = loading;
    state.bookingsLoadError = error;
    render();
  },
});

let adminRefreshInFlight = null;
let adminLastRefreshAt = 0;

async function refreshAdminData(force = false) {
  if (!state.session) return;
  const now = Date.now();
  if (!force && now - adminLastRefreshAt < 8000) return;
  void refreshRoomBookings();
  if (adminRefreshInFlight) return adminRefreshInFlight;
  adminLastRefreshAt = now;
  adminRefreshInFlight = loadAdminData({ silent: true, refreshBookings: false })
    .catch((error) => {
      if (String(error.message).toLowerCase().includes("jwt")) logout();
    })
    .finally(() => {
      adminRefreshInFlight = null;
    });
  return adminRefreshInFlight;
}

if (state.session) clearFormDraft(LOGIN_DRAFT);
render();
if (state.session) loadAdminData().catch((error) => {
  if (String(error.message).toLowerCase().includes("jwt")) logout();
  else setToast("error", error.message);
});
window.addEventListener("focus", () => refreshAdminData(true));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshAdminData(true);
});
window.setInterval(() => refreshAdminData(true), 8000);
