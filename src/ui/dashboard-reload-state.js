(() => {
  if (window.__cscDashboardReloadState) return;
  window.__cscDashboardReloadState = true;

  const dashboard = document.body?.dataset?.dashboard || (document.body?.classList.contains('admin-dashboard-shell') ? 'admin' : 'org');
  const activeKey = `csc_active_dashboard_tab_${dashboard}`;
  const mainCalendarValue = 'mainCalendar';
  const transientClass = 'dashboard-session-restoring';
  const earlyClass = 'dashboard-session-restoring-early';
  const tabEarlyClass = 'dashboard-tab-restoring-early';
  let restoredThisLoad = false;
  const tabButtons = [
    'announcementsButton',
    'eventRequestsButton',
    'concernsButton',
    'usersButton',
    'conferenceRoomButton',
    'myCalendarButton',
    'personalCalendarButton',
    'createScheduleButton',
    'activityStatusButton',
    'notificationsButton'
  ];

  function hasStoredSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem('core_supabase_auth_session') || 'null');
      return Boolean(session?.access_token);
    } catch {
      return false;
    }
  }

  function isReloadNavigation() {
    const entry = performance.getEntriesByType?.('navigation')?.[0];
    if (entry?.type) return entry.type === 'reload';
    return performance.navigation?.type === 1;
  }

  function shouldRestoreDashboardTab() {
    return isReloadNavigation();
  }

  function storedRestorableTabId() {
    try {
      const id = sessionStorage.getItem(activeKey) || '';
      return id && id !== mainCalendarValue ? id : '';
    } catch {
      return '';
    }
  }

  function markRestoring() {
    if (!shouldRestoreDashboardTab()) return;
    if (!hasStoredSession()) return;
    const tabId = storedRestorableTabId();
    document.documentElement.classList.add(earlyClass);
    if (tabId) document.documentElement.classList.add(tabEarlyClass);
    document.documentElement.classList.add(transientClass);
    document.body?.classList.add(transientClass);
  }

  function clearRestoring() {
    document.documentElement.classList.remove(earlyClass);
    document.documentElement.classList.remove(tabEarlyClass);
    document.documentElement.classList.remove(transientClass);
    document.body?.classList.remove(transientClass);
  }

  function injectStyle() {
    if (document.getElementById('dashboard-reload-state-style')) return;
    const style = document.createElement('style');
    style.id = 'dashboard-reload-state-style';
    style.textContent = `
      body.${transientClass}.dashboard-login-required #dashboardLoginScreen {
        display: none !important;
      }
      html.${earlyClass} #dashboardLoginScreen {
        display: none !important;
      }
      html.${tabEarlyClass} body.admin-dashboard-shell .app-shell {
        visibility: hidden !important;
      }
      html.${tabEarlyClass} body.admin-dashboard-shell::before {
        content: "Restoring dashboard...";
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        background: #f8fafc;
        color: #0f172a;
        font: 800 18px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body.${transientClass}.dashboard-login-required::before {
        content: "Restoring dashboard...";
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: grid;
        place-items: center;
        background: #f8fafc;
        color: #0f172a;
        font: 800 18px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      html.${earlyClass} body:not(.dashboard-login-ready)::before {
        content: "Restoring dashboard...";
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: grid;
        place-items: center;
        background: #f8fafc;
        color: #0f172a;
        font: 800 18px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body.${transientClass}.dashboard-login-ready::before,
      body.${transientClass}.portal-authenticated::before {
        content: "Restoring dashboard...";
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        background: #f8fafc;
        color: #0f172a;
        font: 800 18px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  function remember(id) {
    if (!id || id === 'notificationsButton') return;
    try { sessionStorage.setItem(activeKey, id); } catch {}
  }

  function rememberMainCalendar() {
    try { sessionStorage.setItem(activeKey, mainCalendarValue); } catch {}
  }

  function restoredTargetId(buttonId) {
    if (buttonId === 'eventRequestsButton') return 'eventRequestsModal';
    if (buttonId === 'announcementsButton') return 'announcementsModal';
    if (buttonId === 'concernsButton') return 'concernsModal';
    if (buttonId === 'usersButton') return 'usersModal';
    if (buttonId === 'conferenceRoomButton') return 'conferenceRoomModal';
    return '';
  }

  function activeRestorableTabPage() {
    return document.querySelector('.admin-tab-page.is-active, .admin-tab-page[open], #concernsModal[open], #conferenceRoomModal.is-active, #conferenceRoomModal[open]');
  }

  function activeRestorableTabButtonId() {
    if (document.body?.classList.contains('personal-calendar-perspective')) return 'personalCalendarButton';
    const active = activeRestorableTabPage();
    if (!active?.id) return '';
    if (active.id === 'eventRequestsModal') return 'eventRequestsButton';
    if (active.id === 'announcementsModal') return 'announcementsButton';
    if (active.id === 'concernsModal') return 'concernsButton';
    if (active.id === 'usersModal') return 'usersButton';
    if (active.id === 'conferenceRoomModal') return 'conferenceRoomButton';
    return '';
  }

  function rememberActiveTabBeforeReload() {
    const activeButtonId = activeRestorableTabButtonId();
    if (activeButtonId) remember(activeButtonId);
  }

  function clearRestoringWhenReady(buttonId) {
    const targetId = restoredTargetId(buttonId);
    if (!targetId) {
      clearRestoring();
      return;
    }
    const deadline = Date.now() + 1200;
    const wait = () => {
      const target = document.getElementById(targetId);
      if (target?.classList.contains('is-active') || target?.open || Date.now() > deadline) {
        clearRestoring();
        return;
      }
      requestAnimationFrame(wait);
    };
    requestAnimationFrame(wait);
  }

  function restore(attempt = 0) {
    if (!shouldRestoreDashboardTab()) return false;
    if (restoredThisLoad) return false;
    const id = storedRestorableTabId();
    if (!id) return false;
    const button = document.getElementById(id);
    if (!button) {
      if (attempt < 80) window.setTimeout(() => restore(attempt + 1), 125);
      return attempt < 80;
    }
    if (button.disabled || button.hidden) {
      if (attempt < 80) window.setTimeout(() => restore(attempt + 1), 125);
      return attempt < 80;
    }
    restoredThisLoad = true;
    button.click();
    clearRestoringWhenReady(id);
    return true;
  }

  function bind() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button[id]');
      if (!button || !tabButtons.includes(button.id)) return;
      remember(button.id);
    }, true);

    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-close], .modal-close, .back-button, .portal-tab-back, [aria-label="Back"], [aria-label="Close"]')) {
        window.setTimeout(() => {
          if (!activeRestorableTabPage()) rememberMainCalendar();
        }, 0);
      }
    }, true);

    const observer = new MutationObserver(() => {
      if (document.body?.classList.contains('portal-authenticated') || document.body?.classList.contains('dashboard-login-ready')) {
        if (!restore()) clearRestoring();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('pageshow', () => {
      if (document.body?.classList.contains('portal-authenticated') || document.body?.classList.contains('dashboard-login-ready')) {
        if (!restore()) clearRestoring();
      }
    });

    window.addEventListener('beforeunload', rememberActiveTabBeforeReload);

    window.setTimeout(() => {
      if (!document.body?.classList.contains('dashboard-login-ready') && !document.body?.classList.contains('portal-authenticated')) clearRestoring();
    }, 4000);
  }

  function init() {
    injectStyle();
    markRestoring();
    bind();
    if (document.body?.classList.contains('dashboard-login-ready') || document.body?.classList.contains('portal-authenticated')) {
      if (!restore()) clearRestoring();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
