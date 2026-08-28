// Extracted from the embedded moduleSources object inside legacy/original-compacted/admin-dashboard.html.
// This copy is placed by responsibility for Codex readability.
// NOTE: Because it was moved into a feature folder, relative imports may need adjustment before this specific copy is runnable.

(() => {
  if (window.__adminTabsInline) return;
  window.__adminTabsInline = true;

  const TAB_IDS = ['eventRequestsModal', 'announcementsModal', 'usersModal'];
  let timer = 0;

  function style() {
    if (document.getElementById('admin-tabs-inline-style')) return;
    const css = document.createElement('style');
    css.id = 'admin-tabs-inline-style';
    css.textContent = `
      .admin-tab-page,
      .admin-tab-page .modal-card{
        border-radius:0!important;
        margin:0!important;
        max-width:none!important;
        width:100vw!important;
      }
      .admin-tab-page.is-active{overflow:hidden!important;}
      #eventRequestsModal.admin-tab-page.is-active{
        overflow-x:hidden!important;
        overflow-y:hidden!important;
      }
      .admin-tab-page .modal-card{
        height:100dvh!important;
        min-height:100dvh!important;
        overflow:hidden!important;
        padding:0!important;
      }
      #eventRequestsModal.admin-tab-page .modal-card{
        min-width:0!important;
        overflow:hidden!important;
        width:100vw!important;
      }
      #eventRequestsModal.admin-tab-page .modal-card > :not(.modal-header){
        overflow:hidden!important;
      }
      .admin-tab-page .modal-header{
        grid-template-columns:auto minmax(180px,1fr) auto!important;
        align-items:center!important;
        gap:10px!important;
        background:linear-gradient(135deg,#facc15 0%,#eab308 62%,#ca8a04 100%)!important;
        border-bottom:1px solid #2563eb!important;
        border-radius:0!important;
        box-shadow:0 8px 18px rgba(7,28,61,.1)!important;
        box-sizing:border-box!important;
        margin:0!important;
        max-width:none!important;
        overflow:hidden!important;
        min-height:58px!important;
        padding:14px 18px 12px!important;
        position:sticky!important;
        text-align:center!important;
        top:0!important;
        width:100vw!important;
        z-index:20!important;
      }
      #announcementsModal .modal-header,#usersModal .modal-header{
        grid-template-columns:minmax(54px,auto) minmax(0,1fr) minmax(54px,auto)!important;
        min-height:58px!important;
      }
      #announcementsModal .modal-header .portal-tab-back,#usersModal .modal-header .portal-tab-back{
        margin:0!important;
        justify-self:start!important;
      }
      #announcementsModal .modal-header>div:not(.admin-tab-header-tools),#usersModal .modal-header>div:not(.admin-tab-header-tools){
        grid-column:2!important;
        justify-self:center!important;
        text-align:center!important;
      }
      .admin-tab-page .modal-header>div{min-width:0!important;}
      .admin-tab-page .modal-header h3{font-size:clamp(1.05rem,1.6vw,1.35rem)!important;line-height:1.1!important;margin:0!important;}
      .admin-tab-page .modal-header .icon-button[data-close]{display:none!important;}
      .admin-tab-page .portal-tab-back{
        align-items:center!important;
        aspect-ratio:1/1!important;
        border-radius:999px!important;
        display:inline-flex!important;
        flex:0 0 40px!important;
        font-size:0!important;
        height:40px!important;
        justify-content:center!important;
        min-height:40px!important;
        min-width:40px!important;
        padding:0!important;
        width:40px!important;
      }
      .admin-tab-page .portal-tab-back::before{
        color:#0f172a!important;
        content:'←'!important;
        font-size:1.1rem!important;
        font-weight:700!important;
        line-height:1!important;
      }
      .admin-tab-page .modal-card > :not(.modal-header){min-height:0!important;overflow:auto!important;}
      .admin-tab-header-tools{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:10px!important;flex-wrap:wrap!important;min-width:0!important;}

      #announcementsModal .modal-card>form#announcementForm{
        display:grid!important;
        grid-template-columns:minmax(280px,.9fr) minmax(320px,1.1fr)!important;
        gap:18px!important;
        align-items:start!important;
        margin:0 auto!important;
        max-width:1120px!important;
        width:100%!important;
        padding:clamp(16px,2.4vw,30px)!important;
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
      }
      #announcementsModal .announcement-preview-card,#announcementsModal .announcement-input-card{
        width:100%!important;
        background:#fff!important;
        border:1px solid #dbe4ef!important;
        border-radius:24px!important;
        box-shadow:0 16px 42px rgba(15,23,42,.08)!important;
        padding:18px!important;
      }
      #announcementsModal .announcement-preview-card{position:sticky!important;top:18px!important;}
      #announcementsModal .announcement-preview-card .announcement-live-preview{display:block!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;}
      #announcementsModal .announcement-input-card{display:grid!important;gap:16px!important;}
      #announcementsModal .announcement-input-card label{display:flex!important;flex-direction:column!important;gap:8px!important;}
      #announcementsModal .announcement-input-card input,#announcementsModal .announcement-input-card textarea{border:1px solid #cbd5e1!important;border-radius:14px!important;padding:12px!important;background:#f8fafc!important;}
      #announcementsModal .modal-actions.split-actions{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex-wrap:wrap!important;margin-top:2px!important;padding-top:14px!important;border-top:1px solid #e2e8f0!important;}
      #announcementsModal .modal-actions.split-actions>div{display:flex!important;gap:10px!important;flex-wrap:wrap!important;}
      #announcementsModal .modal-actions button{min-height:42px!important;border-radius:999px!important;padding-inline:16px!important;}

      #usersModal #usersList{display:flex!important;flex-direction:column!important;gap:14px!important;overflow-y:auto!important;overflow-x:hidden!important;}
      #usersModal #usersList>.activity-item,#usersModal #accountRequestsList>.activity-item{width:100%!important;max-width:none!important;min-height:unset!important;height:auto!important;max-height:none!important;overflow:visible!important;white-space:normal!important;overflow-wrap:anywhere!important;}
      #usersModal #usersList>.activity-item *{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;max-width:100%!important;overflow-wrap:anywhere!important;}
      #usersModal #usersList>.activity-item p,#usersModal #usersList>.activity-item strong{display:block!important;line-height:1.45!important;margin-bottom:8px!important;}
      #usersModal .ui-card-list{display:flex!important;flex-direction:column!important;}

      .notification-target-highlight{outline:4px solid rgba(37,99,235,.35)!important;box-shadow:0 0 0 8px rgba(37,99,235,.12),0 18px 46px rgba(15,23,42,.14)!important;}

      @media(max-width:860px){
        #eventRequestsModal.admin-tab-page.is-active{overflow-x:hidden!important;overflow-y:auto!important;}
        #eventRequestsModal.admin-tab-page .modal-card{min-width:0!important;overflow:hidden!important;width:100vw!important;}
        #eventRequestsModal.admin-tab-page .modal-card > :not(.modal-header){overflow:auto!important;}
        .admin-tab-page .modal-header{grid-template-columns:44px minmax(0,1fr) 44px!important;align-items:center!important;min-height:58px!important;padding:10px 12px!important;}
        #announcementsModal .modal-header,#usersModal .modal-header{grid-template-columns:minmax(46px,auto) minmax(0,1fr) minmax(46px,auto)!important;}
        .admin-tab-header-tools{justify-content:stretch!important;}
        #announcementsModal .modal-card>form#announcementForm{grid-template-columns:1fr!important;padding:12px!important;}
        #announcementsModal .announcement-preview-card{position:static!important;}
      }
    `;
    document.head.appendChild(css);
  }

  function closePage(page) {
    try { sessionStorage.setItem('csc_active_dashboard_tab_admin', 'mainCalendar'); } catch {}
    if (page?.id && typeof window.closeDialog === 'function') window.closeDialog(page.id);
    else {
      page.hidden = true;
      page.classList.remove('is-active');
      document.body.classList.remove('admin-tab-page-open');
      window.CONNECT_STATE?.calendar?.updateSize?.();
    }
  }

  function ensurePage(page) {
    if (!page) return;
    const header = page.querySelector('.modal-header');
    if (!header) return;
    header.querySelectorAll('.icon-button[data-close]').forEach((button) => {
      button.hidden = true;
      button.setAttribute('aria-hidden', 'true');
    });
    let back = header.querySelector('.portal-tab-back');
    if (!back) {
      back = document.createElement('button');
      back.type = 'button';
      back.className = 'secondary-button portal-tab-back';
      back.textContent = '←';
      back.setAttribute('aria-label', 'Back to Calendar View');
      back.title = 'Back to Calendar View';
      back.addEventListener('click', () => closePage(page));
      header.prepend(back);
    }
    if (!header.querySelector('.admin-tab-header-tools')) {
      const tools = document.createElement('div');
      tools.className = 'admin-tab-header-tools';
      header.appendChild(tools);
    }
  }

  function moveEventFiltersToHeader() {
    const filters = document.getElementById('eventRequestFilters');
    const modal = document.getElementById('eventRequestsModal');
    let tools = modal?.querySelector('.admin-tab-header-tools');
    if (!tools) {
      const header = modal?.querySelector('.modal-header');
      if (header) {
        tools = document.createElement('div');
        tools.className = 'admin-tab-header-tools';
        const closeButton = header.querySelector('.icon-button[data-close]');
        header.insertBefore(tools, closeButton || null);
      }
    }
    if (filters && tools && filters.parentElement !== tools) tools.appendChild(filters);
  }

  function splitAnnouncementCards() {
    const form = document.getElementById('announcementForm');
    const preview = form?.querySelector('.announcement-live-preview');
    if (!form || !preview) return;
    let inputCard = form.querySelector('.announcement-input-card');
    if (!inputCard) {
      inputCard = document.createElement('div');
      inputCard.className = 'announcement-input-card';
      [...form.children].forEach((child) => {
        if (child !== preview && child.tagName !== 'INPUT') inputCard.appendChild(child);
      });
      form.appendChild(inputCard);
    }
    if (!form.querySelector('.announcement-preview-card')) {
      const previewCard = document.createElement('div');
      previewCard.className = 'announcement-preview-card';
      previewCard.appendChild(preview);
      form.prepend(previewCard);
    }
  }

  function addEventCardShortcutButtons() {
    document.querySelectorAll('#eventRequestsList .event-request-detail-card').forEach((card) => {
      const actions = card.querySelector('.er-card-actions');
      const id = card.dataset.requestId;
      if (!actions || !id || actions.dataset.finalButtons === '1') return;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary-button';
      remove.dataset.action = 'event-remove';
      remove.dataset.id = id;
      remove.textContent = 'Remove';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'secondary-button';
      edit.dataset.action = 'event-edit';
      edit.dataset.id = id;
      edit.textContent = 'Edit';
      actions.prepend(edit);
      actions.prepend(remove);
      actions.dataset.finalButtons = '1';
    });
  }

  function restoreNotificationRedirect() {
    const list = document.getElementById('notificationsList');
    if (!list || list.dataset.redirectReady === '1') return;
    list.dataset.redirectReady = '1';
    list.addEventListener('click', (event) => {
      const card = event.target.closest('.activity-item');
      if (!card || event.target.closest('button,[data-action]')) return;
      const openButton = card.querySelector('[data-action="notification-open"]');
      if (openButton) openButton.click();
    });
  }

  function enhanceNotificationTargets() {
    document.querySelectorAll('#notificationsList .activity-item').forEach((card) => {
      if (card.dataset.clickHint === '1') return;
      if (card.querySelector('[data-action="notification-open"]')) {
        card.dataset.clickHint = '1';
        card.style.cursor = 'pointer';
        card.title = 'Click to open related schedule';
      }
    });
  }

  function run() {
    TAB_IDS.forEach((id) => ensurePage(document.getElementById(id)));
    moveEventFiltersToHeader();
    splitAnnouncementCards();
    addEventCardShortcutButtons();
    restoreNotificationRedirect();
    enhanceNotificationTargets();
  }

  function scheduleRun() {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  }

  function init() {
    style();
    run();
    new MutationObserver(scheduleRun).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    document.addEventListener('click', (event) => {
      if (event.target.closest('#eventRequestsButton,#announcementsButton,#usersButton,#notificationsButton,[data-close]')) {
        setTimeout(run, 180);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else queueMicrotask(init);
})();
