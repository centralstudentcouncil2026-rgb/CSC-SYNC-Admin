(() => {
  if (window.__cscScheduleModalFitV6) return;
  window.__cscScheduleModalFitV6 = true;

  const STYLE_ID = 'csc-sync-schedule-modal-fit-style-v6';
  const SCHEDULE_MODAL_SELECTOR = '#eventModal[open], #detailsModal[open], #eventReviewModal[open], #conflictModal[open], #agreementModal[open]';
  const CENTERED_MODAL_SELECTOR = 'body.admin-dashboard-shell dialog.modal[open]:not(.admin-tab-page)';
  const BODY_SELECTOR = [
    '#eventForm .form-grid',
    '#detailsModal .details-list',
    '#eventReviewModal .form-grid',
    '#conflictModal .conflict-body',
    '#agreementModal .agreement-body'
  ].join(', ');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --csc-modal-vh: 100dvh;
        --csc-schedule-modal-body-max: calc(100dvh - 156px);
      }

      body.admin-dashboard-shell dialog.modal[open]:not(.admin-tab-page),
        bottom: auto !important;
        left: 50% !important;
        margin: 0 !important;
        position: fixed !important;
        right: auto !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
      }

      body.admin-dashboard-shell #eventModal[open],
      body.admin-dashboard-shell #detailsModal[open],
      body.admin-dashboard-shell #eventReviewModal[open],
      body.admin-dashboard-shell #conflictModal[open],
      body.admin-dashboard-shell #agreementModal[open],
        border-radius: 18px !important;
        box-sizing: border-box !important;
        max-height: calc(var(--csc-modal-vh) - 16px) !important;
        max-width: min(96vw, 940px) !important;
        overflow: hidden !important;
        padding: 0 !important;
        width: min(96vw, 940px) !important;
      }

      body.admin-dashboard-shell #eventModal[open] > #eventForm.modal-card,
      body.admin-dashboard-shell #detailsModal[open] > .modal-card,
      body.admin-dashboard-shell #eventReviewModal[open] > .modal-card,
      body.admin-dashboard-shell #conflictModal[open] > .modal-card,
      body.admin-dashboard-shell #agreementModal[open] > .modal-card,
        border-radius: 18px !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 0 !important;
        margin: 0 !important;
        max-height: calc(var(--csc-modal-vh) - 16px) !important;
        max-width: min(96vw, 940px) !important;
        min-height: 0 !important;
        min-width: 0 !important;
        overflow: hidden !important;
        padding: 0 !important;
        width: 100% !important;
      }

      body.admin-dashboard-shell #eventModal[open] .modal-header,
      body.admin-dashboard-shell #detailsModal[open] .modal-header,
      body.admin-dashboard-shell #eventReviewModal[open] .modal-header,
      body.admin-dashboard-shell #conflictModal[open] .modal-header,
      body.admin-dashboard-shell #agreementModal[open] .modal-header,
        border-radius: 0 !important;
        box-sizing: border-box !important;
        flex: 0 0 auto !important;
        margin: 0 !important;
        padding: clamp(12px, 2vw, 18px) clamp(14px, 2.2vw, 22px) !important;
      }

      body.admin-dashboard-shell #eventModal[open] #eventForm .form-grid,
      body.admin-dashboard-shell #detailsModal[open] .details-list,
      body.admin-dashboard-shell #eventReviewModal[open] .form-grid,
      body.admin-dashboard-shell #conflictModal[open] .conflict-body,
      body.admin-dashboard-shell #agreementModal[open] .agreement-body,
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        flex: 1 1 auto !important;
        margin: 0 !important;
        max-height: var(--csc-schedule-modal-body-max) !important;
        min-height: 0 !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        padding: clamp(12px, 2vw, 18px) clamp(14px, 2.2vw, 22px) !important;
      }

      body.admin-dashboard-shell #detailsModal[open] .details-list,
        display: grid !important;
        gap: clamp(8px, 1.2vw, 12px) !important;
        grid-template-columns: minmax(0, 1fr) !important;
      }

      body.admin-dashboard-shell #eventModal[open] .modal-actions,
      body.admin-dashboard-shell #detailsModal[open] .modal-actions,
      body.admin-dashboard-shell #eventReviewModal[open] .modal-actions,
      body.admin-dashboard-shell #conflictModal[open] .modal-actions,
      body.admin-dashboard-shell #agreementModal[open] .modal-actions,
      body.admin-dashboard-shell #statusCallUnavailableModal[open] .modal-actions,
        align-items: center !important;
        border-top: 1px solid #e2e8f0 !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex: 0 0 auto !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        gap: clamp(4px, 0.85vw, 10px) !important;
        justify-content: flex-end !important;
        margin: 0 !important;
        min-width: 0 !important;
        overflow: hidden !important;
        padding: clamp(9px, 1.6vw, 16px) clamp(10px, 2vw, 22px) !important;
      }

      body.admin-dashboard-shell #eventModal[open] .split-actions,
        justify-content: space-between !important;
      }

      body.admin-dashboard-shell #eventModal[open] .split-actions > div,
        display: flex !important;
        flex: 1 1 auto !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        gap: clamp(4px, 0.85vw, 10px) !important;
        min-width: 0 !important;
        overflow: hidden !important;
      }

      body.admin-dashboard-shell #eventModal[open] .modal-actions button,
      body.admin-dashboard-shell #detailsModal[open] .modal-actions button,
      body.admin-dashboard-shell #eventReviewModal[open] .modal-actions button,
      body.admin-dashboard-shell #conflictModal[open] .modal-actions button,
      body.admin-dashboard-shell #agreementModal[open] .modal-actions button,
      body.admin-dashboard-shell #statusCallUnavailableModal[open] .modal-actions button,
        flex: 1 1 0 !important;
        font-size: clamp(9px, 1.6vw, 13px) !important;
        line-height: 1.1 !important;
        max-width: 180px !important;
        min-height: clamp(31px, 5vw, 40px) !important;
        min-width: 0 !important;
        overflow: hidden !important;
        padding: 0 clamp(4px, 1.1vw, 12px) !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      body.admin-dashboard-shell #detailsModal[open] .modal-actions button,
        max-width: none !important;
      }

      body.admin-dashboard-shell #eventModal[open] .modal-actions > button,
        flex: 0.85 1 0 !important;
      }

        align-items: center !important;
        background: var(--aup-blue, #2563eb) !important;
        border: 1px solid var(--aup-blue, #2563eb) !important;
        border-radius: 999px !important;
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18) !important;
        color: #ffffff !important;
        cursor: pointer !important;
        display: inline-flex !important;
        font-weight: 800 !important;
        justify-content: center !important;
        margin-top: 10px !important;
        min-height: 38px !important;
        padding: 0 14px !important;
        text-decoration: none !important;
      }

        background: var(--aup-blue, #2563eb) !important;
        border-color: var(--aup-blue, #2563eb) !important;
        color: #ffffff !important;
      }

        opacity: 0.92 !important;
      }

      @media (max-width: 560px) {
        body.admin-dashboard-shell #eventModal[open],
        body.admin-dashboard-shell #detailsModal[open],
        body.admin-dashboard-shell #eventReviewModal[open],
        body.admin-dashboard-shell #conflictModal[open],
        body.admin-dashboard-shell #agreementModal[open],
          border-radius: 14px !important;
          max-height: calc(var(--csc-modal-vh) - 8px) !important;
          max-width: calc(100vw - 8px) !important;
          width: calc(100vw - 8px) !important;
        }

        body.admin-dashboard-shell #eventModal[open] > #eventForm.modal-card,
        body.admin-dashboard-shell #detailsModal[open] > .modal-card,
        body.admin-dashboard-shell #eventReviewModal[open] > .modal-card,
        body.admin-dashboard-shell #conflictModal[open] > .modal-card,
        body.admin-dashboard-shell #agreementModal[open] > .modal-card,
          border-radius: 14px !important;
          max-height: calc(var(--csc-modal-vh) - 8px) !important;
        }
      }

      body.admin-dashboard-shell #eventModal[open] {
        border-radius: 20px !important;
        box-sizing: border-box !important;
        max-height: calc(var(--csc-modal-vh) - 16px) !important;
        max-width: min(96vw, 1080px) !important;
        overflow: hidden !important;
        padding: 0 !important;
        width: min(96vw, 1080px) !important;
      }

      body.admin-dashboard-shell #eventModal[open] > #eventForm.modal-card {
        background: #ffffff !important;
        border-radius: 20px !important;
        box-sizing: border-box !important;
        display: grid !important;
        gap: 0 !important;
        grid-template-rows: auto minmax(0, 1fr) auto !important;
        margin: 0 !important;
        max-height: calc(var(--csc-modal-vh) - 16px) !important;
        min-height: 0 !important;
        overflow: hidden !important;
        padding: 0 !important;
        width: 100% !important;
      }

      body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-header {
        align-items: center !important;
        background: #ffffff !important;
        border-bottom: 1px solid #e2e8f0 !important;
        box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06) !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        min-height: 70px !important;
        padding: 18px 34px 14px !important;
        position: relative !important;
        z-index: 3 !important;
      }

      body.admin-dashboard-shell #eventModal[open] #eventForm > .form-grid {
        background: #ffffff !important;
        border: 0 !important;
        box-shadow: none !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        padding: 22px 34px 28px !important;
      }

      body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-actions {
        align-items: center !important;
        background: #ffffff !important;
        border-top: 1px solid #e2e8f0 !important;
        box-shadow: 0 -10px 24px rgba(15, 23, 42, 0.08) !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex: 0 0 auto !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        gap: 12px !important;
        justify-content: space-between !important;
        margin: 0 !important;
        overflow: visible !important;
        padding: 14px 34px 18px !important;
        position: relative !important;
        z-index: 3 !important;
      }

      body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-actions > div {
        display: flex !important;
        flex: 0 1 auto !important;
        gap: 12px !important;
        min-width: 0 !important;
      }

      body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-actions button {
        flex: 0 0 auto !important;
        font-size: clamp(0.88rem, 1.45vw, 1rem) !important;
        line-height: 1.1 !important;
        min-height: 48px !important;
        min-width: 150px !important;
        padding: 0 24px !important;
        white-space: nowrap !important;
      }

      body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-actions > .primary-button {
        margin-left: auto !important;
        min-width: 178px !important;
      }

      @media (max-width: 720px) {
        body.admin-dashboard-shell #eventModal[open] {
          max-height: calc(var(--csc-modal-vh) - 8px) !important;
          max-width: calc(100vw - 8px) !important;
          width: calc(100vw - 8px) !important;
        }

        body.admin-dashboard-shell #eventModal[open] > #eventForm.modal-card {
          max-height: calc(var(--csc-modal-vh) - 8px) !important;
        }

        body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-header,
        body.admin-dashboard-shell #eventModal[open] #eventForm > .form-grid,
        body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-actions {
          padding-left: 18px !important;
          padding-right: 18px !important;
        }

        body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-actions {
          flex-wrap: wrap !important;
        }

        body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-actions > div {
          flex: 1 1 100% !important;
        }

        body.admin-dashboard-shell #eventModal[open] #eventForm > .modal-actions button {
          flex: 1 1 0 !important;
          min-width: min(100%, 130px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function viewportHeight() {
    return Math.max(320, Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 720));
  }

  function forceCenterModal(modal) {
    if (!modal) return;
    modal.style.setProperty('position', 'fixed', 'important');
    modal.style.setProperty('top', '50%', 'important');
    modal.style.setProperty('left', '50%', 'important');
    modal.style.setProperty('right', 'auto', 'important');
    modal.style.setProperty('bottom', 'auto', 'important');
    modal.style.setProperty('margin', '0', 'important');
    modal.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
  }

  function syncScheduleModalSizes() {
    const vh = viewportHeight();
    document.documentElement.style.setProperty('--csc-modal-vh', `${vh}px`);

    document.querySelectorAll(CENTERED_MODAL_SELECTOR).forEach(forceCenterModal);

    document.querySelectorAll(SCHEDULE_MODAL_SELECTOR).forEach((modal) => {
      forceCenterModal(modal);
      const card = modal.querySelector(':scope > .modal-card, :scope > #eventForm.modal-card');
      if (!card) return;
      const header = card.querySelector(':scope > .modal-header');
      const actions = card.querySelector(':scope > .modal-actions');
      const body = card.querySelector(BODY_SELECTOR);
      const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
      const actionsHeight = actions ? Math.ceil(actions.getBoundingClientRect().height) : 0;
      const buffer = window.matchMedia('(max-width: 560px)').matches ? 24 : 40;
      const available = Math.max(150, vh - headerHeight - actionsHeight - buffer);
      card.style.setProperty('--csc-schedule-modal-body-max', `${available}px`);
      if (body) body.style.maxHeight = `${available}px`;
      if (actions) {
        actions.style.flexDirection = 'row';
        actions.style.flexWrap = 'nowrap';
      }
    });
  }

  function bindResize() {
    const sync = () => window.requestAnimationFrame(syncScheduleModalSizes);
    window.addEventListener('resize', sync, { passive: true });
    window.visualViewport?.addEventListener('resize', sync, { passive: true });
    window.visualViewport?.addEventListener('scroll', sync, { passive: true });
    document.addEventListener('toggle', sync, true);
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-close], button, .fc-event, .fc-daygrid-day, .fc-timegrid-slot')) {
        window.setTimeout(syncScheduleModalSizes, 60);
        window.setTimeout(syncScheduleModalSizes, 240);
      }
    }, true);

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(sync);
      observer.observe(document.documentElement);
      document.querySelectorAll('dialog.modal, .modal-card, .details-list, .form-grid, .modal-actions').forEach((node) => observer.observe(node));
      new MutationObserver(() => {
        document.querySelectorAll('dialog.modal, .modal-card, .details-list, .form-grid, .modal-actions').forEach((node) => observer.observe(node));
        sync();
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'class', 'style', 'hidden'] });
    } else {
      new MutationObserver(sync).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'class', 'style', 'hidden'] });
    }

    syncScheduleModalSizes();
    window.setTimeout(syncScheduleModalSizes, 100);
    window.setTimeout(syncScheduleModalSizes, 400);
  }

  function init() {
    injectStyle();
    bindResize();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
