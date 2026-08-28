(() => {
  if (window.__adminProfileEditor) return;
  window.__adminProfileEditor = true;

  const { url } = window.SUPABASE_CONFIG || {};
  const publishableKey = window.SUPABASE_CONFIG?.publishableKey || window.SUPABASE_CONFIG?.anonKey || window.SUPABASE_CONFIG?.apiKey || window.SUPABASE_CONFIG?.apikey || '';
  const SESSION_KEY = 'core_supabase_auth_session';
  const STORE_SYNC_SIGNAL_KEY = 'csc-sync-store-version';
  const STORE_SYNC_CHANNEL = 'csc-sync-store';
  const CONTACT_CACHE_KEY = 'csc-admin-profile-contact-cache';
  const FIELD_IDS = {
    fullName: 'adminProfileFullName',
    phone: 'adminProfilePhone',
    messenger: 'adminProfileMessenger',
    error: 'adminProfileError',
    save: 'adminProfileSaveButton'
  };

  function session() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }

  function headers() {
    const token = session()?.access_token || publishableKey;
    return {
      apikey: publishableKey,
      Authorization: `Bearer ${token || publishableKey}`,
      'Content-Type': 'application/json'
    };
  }

  function currentStore() {
    return window.CONNECT_STATE?.store || window.CONNECT_BOOTSTRAP_STORE || null;
  }

  function currentUser() {
    const store = currentStore();
    return (store?.users || []).find((user) => user.id === store.currentUserId) || window.CONNECT_AUTHENTICATED_USER || {};
  }

  function accountEmail(user) {
    return String(user?.email || user?.aup_email || user?.username || session()?.user?.email || '').trim().toLowerCase();
  }

  function authenticatedProfileId(user = currentUser()) {
    return String(session()?.user?.id || user?.id || '').trim();
  }

  function contactCacheKey(user = currentUser()) {
    return authenticatedProfileId(user) || accountEmail(user) || 'admin';
  }

  function readContactCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(CONTACT_CACHE_KEY) || '{}');
      return cache[contactCacheKey()] || null;
    } catch {
      return null;
    }
  }

  function writeContactCache(contact) {
    try {
      const cache = JSON.parse(localStorage.getItem(CONTACT_CACHE_KEY) || '{}');
      cache[contactCacheKey()] = contact;
      localStorage.setItem(CONTACT_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }

  function cleanText(value) {
    return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function phoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function initials(name) {
    const parts = cleanText(name).split(/\s+/).filter(Boolean);
    const source = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : (parts[0] || 'A').slice(0, 2);
    return source.toUpperCase();
  }

  function showToast(message, type = 'success') {
    if (window.CSCPortalApi?.showToast) window.CSCPortalApi.showToast(message, type);
    else if (type === 'error') alert(message);
  }

  function style() {
    if (document.getElementById('admin-profile-editor-style')) return;
    const s = document.createElement('style');
    s.id = 'admin-profile-editor-style';
    s.textContent = `
      #sidebarAccountAvatar{border:0!important;cursor:pointer!important;padding:0!important;}
      #sidebarAccountAvatar:focus-visible{outline:3px solid rgba(59,130,246,.45)!important;outline-offset:3px!important;}
      .admin-profile-dialog .modal-card{max-width:min(520px,calc(100vw - 24px))!important;}
      .admin-profile-dialog .modal-header{align-items:center!important;border-bottom:1px solid #e2e8f0!important;display:flex!important;justify-content:space-between!important;padding:20px 24px!important;}
      .admin-profile-dialog .modal-header h3{font-size:1.35rem!important;line-height:1.2!important;margin:0!important;}
      .admin-profile-dialog .modal-body{display:grid!important;gap:14px!important;padding:22px 24px!important;}
      .admin-profile-dialog .form-field{display:grid!important;gap:7px!important;}
      .admin-profile-dialog .form-field span{color:#0f172a!important;font-size:.86rem!important;font-weight:800!important;}
      .admin-profile-dialog input{background:#fff!important;border:1px solid #cbd5e1!important;border-radius:10px!important;color:#0f172a!important;font:inherit!important;font-weight:650!important;min-height:44px!important;padding:0 13px!important;width:100%!important;}
      .admin-profile-dialog input:focus{border-color:#4169f4!important;box-shadow:0 0 0 3px rgba(65,105,244,.18)!important;outline:0!important;}
      .admin-profile-dialog .profile-error{color:#b91c1c!important;font-size:.86rem!important;font-weight:700!important;min-height:1.2em!important;}
      .admin-profile-dialog .modal-footer{align-items:center!important;border-top:1px solid #e2e8f0!important;display:flex!important;gap:10px!important;justify-content:flex-end!important;padding:16px 24px!important;}
      .admin-profile-dialog .modal-footer button{border-radius:999px!important;font-weight:850!important;min-height:42px!important;padding:0 18px!important;}
      .admin-profile-dialog .modal-close{align-items:center!important;background:#fff!important;border:1px solid #dbe4ef!important;border-radius:999px!important;color:#0f172a!important;display:inline-flex!important;height:40px!important;justify-content:center!important;width:40px!important;}
      .admin-profile-dialog .secondary-button{background:#fff!important;border:1px solid #cbd5e1!important;color:#0f172a!important;}
      .admin-profile-dialog .primary-button{background:#4169f4!important;border:1px solid #4169f4!important;color:#fff!important;}
      @media(max-width:560px){.admin-profile-dialog .modal-header,.admin-profile-dialog .modal-body,.admin-profile-dialog .modal-footer{padding-left:18px!important;padding-right:18px!important;}.admin-profile-dialog .modal-footer{align-items:stretch!important;flex-direction:column-reverse!important;}.admin-profile-dialog .modal-footer button{width:100%!important;}}
    `;
    document.head.appendChild(s);
  }

  function ensureDialog() {
    let dialog = document.getElementById('adminProfileDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'adminProfileDialog';
    dialog.className = 'modal admin-profile-dialog';
    dialog.innerHTML = `
      <form class="modal-card" id="adminProfileForm" autocomplete="off">
        <div class="modal-header">
          <h3>Account Profile</h3>
          <button class="modal-close" type="button" id="adminProfileClose" aria-label="Close profile editor">&times;</button>
        </div>
        <div class="modal-body">
          <label class="form-field" for="${FIELD_IDS.fullName}">
            <span>Full Name</span>
            <input id="${FIELD_IDS.fullName}" name="fullName" autocomplete="off" maxlength="120" required>
          </label>
          <label class="form-field" for="${FIELD_IDS.phone}">
            <span>Phone Number</span>
            <input id="${FIELD_IDS.phone}" name="phone" autocomplete="off" inputmode="numeric" maxlength="20" required>
          </label>
          <label class="form-field" for="${FIELD_IDS.messenger}">
            <span>Messenger Account</span>
            <input id="${FIELD_IDS.messenger}" name="messenger" autocomplete="off" maxlength="160" required>
          </label>
          <p class="profile-error" id="${FIELD_IDS.error}" role="alert"></p>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" type="button" id="adminProfileCancel">Cancel</button>
          <button class="primary-button" type="submit" id="${FIELD_IDS.save}">Save Profile</button>
        </div>
      </form>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('#adminProfileForm')?.addEventListener('submit', saveProfile);
    dialog.querySelector('#adminProfileClose')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('#adminProfileCancel')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  function setError(message = '') {
    const error = document.getElementById(FIELD_IDS.error);
    if (error) error.textContent = message;
  }

  function fillDialog() {
    const user = currentUser();
    const cached = readContactCache() || {};
    document.getElementById(FIELD_IDS.fullName).value = cached.full_name || user.full_name || '';
    document.getElementById(FIELD_IDS.phone).value = cached.contact_number || user.contact_number || user.phone_number || '';
    document.getElementById(FIELD_IDS.messenger).value = cached.messenger_account || user.messenger_account || user.messengerAccount || '';
    setError('');
  }

  function openDialog() {
    const dialog = ensureDialog();
    fillDialog();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    setTimeout(() => document.getElementById(FIELD_IDS.fullName)?.focus(), 30);
  }

  function updateLocalUser({ fullName, phone, messenger }) {
    const store = currentStore();
    const user = currentUser();
    const now = new Date().toISOString();
    Object.assign(user, {
      full_name: fullName,
      contact_number: phone,
      phone_number: phone,
      messenger_account: messenger,
      messengerAccount: messenger,
      updated_at: now
    });
    if (window.CONNECT_AUTHENTICATED_USER) Object.assign(window.CONNECT_AUTHENTICATED_USER, user);
    if (store && !store.users?.some?.((item) => item.id === user.id)) {
      store.users = Array.isArray(store.users) ? store.users : [];
      store.users.push(user);
    }
    renderSidebarUser(user);
    writeContactCache({ full_name: fullName, contact_number: phone, messenger_account: messenger });
  }

  function renderSidebarUser(user) {
    const email = accountEmail(user);
    const name = user.full_name || email || 'Account';
    const avatar = document.getElementById('sidebarAccountAvatar');
    const nameElement = document.getElementById('sidebarAccountName');
    const typeElement = document.getElementById('sidebarAccountType');
    if (avatar) avatar.textContent = initials(name);
    if (nameElement) {
      nameElement.textContent = name;
      nameElement.title = email ? `${name} (${email})` : name;
    }
    if (typeElement) typeElement.textContent = 'Admin Account';
  }

  function ensureProfileWriteReady() {
    const user = currentUser();
    if (!url || !publishableKey || !session()?.access_token) throw new Error('Your session expired. Please log in again.');
    return user;
  }

  async function saveProfileToDatabase(payload) {
    const savedContact = await saveContactRecord(payload);
    patchExistingProfileSilently(payload);
    return savedContact;
  }

  async function patchExistingProfileSilently(payload) {
    try {
      const user = ensureProfileWriteReady();
      const email = accountEmail(user);
      const profileId = authenticatedProfileId(user);
      const filters = [
        profileId ? `id=eq.${encodeURIComponent(profileId)}` : '',
        email ? `email=eq.${encodeURIComponent(email)}` : ''
      ].filter(Boolean);
      for (const filter of filters) await patchExistingProfile(filter, payload);
    } catch (error) {
      console.warn('Admin profile mirror update skipped:', error);
    }
  }

  async function saveContactRecord(payload) {
    const user = ensureProfileWriteReady();
    const email = accountEmail(user);
    const profileId = authenticatedProfileId(user);
    if (!profileId) throw new Error('Your session id is missing. Please log in again.');
    const row = {
      id: profileId,
      email,
      full_name: payload.full_name,
      contact_number: payload.contact_number,
      messenger_account: payload.messenger_account || '',
      updated_at: payload.updated_at || new Date().toISOString()
    };
    const response = await fetch(`${url}/rest/v1/admin_profile_contacts?on_conflict=id&select=id`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row)
    });
    if (response.ok) {
      const rows = await response.json().catch(() => []);
      return Array.isArray(rows) ? rows[0] : rows;
    }
    await throwProfileError(response);
  }

  async function patchExistingProfile(filter, payload) {
    const patched = await fetch(`${url}/rest/v1/profiles?${filter}&select=id`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
    if (patched.ok) {
      const rows = await patched.json().catch(() => []);
      if (Array.isArray(rows) && rows.length) return rows[0];
    } else {
      await throwProfileError(patched);
    }
    return null;
  }

  async function throwProfileError(response) {
    const details = await response.json().catch(() => ({}));
    const error = new Error(details?.message || details?.error || `Profile save failed (${response.status})`);
    error.details = details;
    error.status = response.status;
    throw error;
  }

  function missingMessengerColumn(error) {
    const text = `${error?.message || ''} ${JSON.stringify(error?.details || {})}`;
    return /messenger_account|schema cache|column|PGRST204/i.test(text);
  }

  function broadcastProfileChange() {
    try { localStorage.setItem(STORE_SYNC_SIGNAL_KEY, String(Date.now())); } catch {}
    try {
      const channel = new BroadcastChannel(STORE_SYNC_CHANNEL);
      channel.postMessage({ updated_at: Date.now(), source: 'admin-profile-editor' });
      channel.close();
    } catch {}
    window.dispatchEvent(new CustomEvent('csc:store-rendered'));
  }

  async function loadContactRecord() {
    try {
      const user = ensureProfileWriteReady();
      const email = accountEmail(user);
      const profileId = authenticatedProfileId(user);
      const filters = [
        profileId ? `id=eq.${encodeURIComponent(profileId)}` : '',
        email ? `email=eq.${encodeURIComponent(email)}` : ''
      ].filter(Boolean);
      for (const filter of filters) {
        const response = await fetch(`${url}/rest/v1/admin_profile_contacts?${filter}&select=*&limit=1`, { headers: headers() });
        if (!response.ok) continue;
        const rows = await response.json().catch(() => []);
        const row = Array.isArray(rows) ? rows[0] : null;
        if (!row) continue;
        updateLocalUser({
          fullName: row.full_name || user.full_name || '',
          phone: row.contact_number || user.contact_number || user.phone_number || '',
          messenger: row.messenger_account || user.messenger_account || user.messengerAccount || ''
        });
        writeContactCache({
          full_name: row.full_name || user.full_name || '',
          contact_number: row.contact_number || user.contact_number || user.phone_number || '',
          messenger_account: row.messenger_account || user.messenger_account || user.messengerAccount || ''
        });
        broadcastProfileChange();
        return;
      }
    } catch (error) {
      console.warn('Admin profile contact load skipped:', error);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    const fullName = cleanText(document.getElementById(FIELD_IDS.fullName)?.value);
    const phone = phoneDigits(document.getElementById(FIELD_IDS.phone)?.value);
    const messenger = cleanText(document.getElementById(FIELD_IDS.messenger)?.value);
    if (!fullName) return setError('Full name is required.');
    if (!/^\d{11}$/.test(phone)) return setError('Phone number must contain exactly 11 digits.');
    if (!messenger) return setError('Messenger account is required.');
    const saveButton = document.getElementById(FIELD_IDS.save);
    saveButton.disabled = true;
    setError('');
    try {
      const now = new Date().toISOString();
      let savedMessenger = true;
      try {
        await saveProfileToDatabase({ full_name: fullName, contact_number: phone, messenger_account: messenger, updated_at: now });
      } catch (error) {
        if (!missingMessengerColumn(error)) throw error;
        await saveProfileToDatabase({ full_name: fullName, contact_number: phone, updated_at: now });
        savedMessenger = false;
      }
      updateLocalUser({ fullName, phone, messenger });
      broadcastProfileChange();
      document.getElementById('adminProfileDialog')?.close();
      showToast(savedMessenger ? 'Account profile saved.' : 'Profile saved. Add messenger_account to profiles so Messenger can sync too.', savedMessenger ? 'success' : 'error');
    } catch (error) {
      setError(error.message || 'Profile could not be saved.');
    } finally {
      saveButton.disabled = false;
    }
  }

  function ensureAvatarButton() {
    const avatar = document.getElementById('sidebarAccountAvatar');
    if (!avatar || avatar.dataset.profileEditorReady === '1') return;
    avatar.dataset.profileEditorReady = '1';
    if (avatar.tagName !== 'BUTTON') {
      avatar.setAttribute('role', 'button');
      avatar.setAttribute('tabindex', '0');
    }
    avatar.removeAttribute('aria-hidden');
    avatar.setAttribute('aria-label', 'Edit account profile');
    avatar.addEventListener('click', openDialog);
    avatar.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDialog();
      }
    });
  }

  function init() {
    style();
    ensureDialog();
    ensureAvatarButton();
    renderSidebarUser(currentUser());
    loadContactRecord();
    new MutationObserver(ensureAvatarButton).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else queueMicrotask(init);
})();
