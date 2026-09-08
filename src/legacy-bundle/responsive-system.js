(() => {
  if (window.__cscResponsiveSystem) return;
  window.__cscResponsiveSystem = true;

  const STYLE_ID = 'csc-responsive-system-style';
  const BREAKPOINTS = [
    ['compact', '(max-width: 599px)'],
    ['medium', '(min-width: 600px) and (max-width: 839px)'],
    ['wide', '(min-width: 840px) and (max-width: 1199px)'],
    ['xl', '(min-width: 1200px)']
  ];

  let resizeTimer = 0;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --space-xs: 6px;
        --space-sm: 10px;
        --space-md: 16px;
        --space-lg: 24px;
        --font-xs: .72rem;
        --font-sm: .86rem;
        --font-md: 1rem;
        --font-lg: 1.35rem;
        --control-height: 44px;
        --header-height: 72px;
        --calendar-row-height: 52px;
        --border-radius: 14px;
      }

      @media (max-width: 599px) {
        :root {
          --space-xs: 4px;
          --space-sm: 8px;
          --space-md: 12px;
          --space-lg: 16px;
          --font-xs: .66rem;
          --font-sm: .78rem;
          --font-md: .92rem;
          --font-lg: 1.12rem;
          --control-height: 38px;
          --header-height: 58px;
          --calendar-row-height: 48px;
          --border-radius: 12px;
        }
      }

      @media (min-width: 600px) and (max-width: 839px) {
        :root {
          --space-xs: 5px;
          --space-sm: 9px;
          --space-md: 14px;
          --space-lg: 20px;
          --font-xs: .7rem;
          --font-sm: .82rem;
          --font-md: .96rem;
          --font-lg: 1.22rem;
          --control-height: 42px;
          --header-height: 64px;
          --calendar-row-height: 50px;
          --border-radius: 13px;
        }
      }

      @media (min-width: 1200px) {
        :root {
          --space-lg: 28px;
          --font-lg: 1.5rem;
          --control-height: 46px;
          --header-height: 76px;
          --calendar-row-height: 54px;
        }
      }

      html, body {
        max-width: 100%;
        overflow-x: hidden;
      }

      *, *::before, *::after {
        box-sizing: border-box;
      }

      body.portal-shell,
      body.public-shell,
      body.admin-dashboard-shell,
      body.org-dashboard-shell {
        min-width: 0;
      }

      body.portal-shell .app-shell,
      body.admin-dashboard-shell .app-shell,
      body.org-dashboard-shell .app-shell,
      body.public-shell .public-shell,
      body.public-shell .app-shell {
        max-width: 100%;
        min-width: 0;
        overflow-x: clip;
      }

      .portal-topbar,
      .dashboard-header,
      .calendar-toolbar,
      .calendar-controls,
      .admin-tab-header,
      .admin-tab-header-tools,
      .public-header,
      .public-calendar-header,
      .conference-room-header {
        max-width: 100%;
        min-width: 0;
      }

      .portal-topbar,
      .dashboard-header,
      .calendar-toolbar,
      .public-header,
      .public-calendar-header {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
        min-height: var(--header-height);
      }

      .portal-title,
      .dashboard-title,
      .calendar-title,
      .public-brand,
      .public-title,
      .conference-room-header h3 {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      button,
      input,
      select,
      textarea {
        max-width: 100%;
      }

      button,
      .primary-button,
      .secondary-button,
      .danger-button,
      .text-button,
      .sidebar-tab,
      .icon-button,
      select,
      input:not([type="checkbox"]):not([type="radio"]) {
        min-height: var(--control-height);
      }

      .icon-button,
      [aria-label][type="button"] {
        flex: 0 0 auto;
      }

      .calendar-panel,
      .public-calendar-panel,
      .admin-tab-page,
      .dashboard-content,
      .modal-card,
      .form-grid,
      .account-card,
      .activity-item,
      .event-request-detail-card {
        min-width: 0;
      }

      .calendar-panel,
      .public-calendar-panel {
        display: flex;
        flex-direction: column;
        min-height: 0;
        width: 100%;
      }

      body.portal-shell #calendar,
      body.admin-dashboard-shell #calendar,
      body.org-dashboard-shell #calendar,
      body.public-shell #calendar,
      body.public-shell #publicCalendar,
      .public-calendar {
        background: #fff;
        border-color: #cbd5e1;
        display: block;
        flex: 1 1 auto;
        min-height: clamp(520px, calc(100dvh - 156px), 820px);
        min-width: 0;
        overflow: hidden;
        width: 100%;
      }

      body.portal-shell #calendar .fc,
      body.portal-shell #calendar .fc-view-harness,
      body.portal-shell #calendar .fc-view-harness-active,
      body.portal-shell #calendar .fc-scrollgrid,
      body.admin-dashboard-shell #calendar .fc,
      body.admin-dashboard-shell #calendar .fc-view-harness,
      body.admin-dashboard-shell #calendar .fc-view-harness-active,
      body.admin-dashboard-shell #calendar .fc-scrollgrid,
      body.org-dashboard-shell #calendar .fc,
      body.org-dashboard-shell #calendar .fc-view-harness,
      body.org-dashboard-shell #calendar .fc-view-harness-active,
      body.org-dashboard-shell #calendar .fc-scrollgrid,
      body.public-shell #calendar .fc,
      body.public-shell #calendar .fc-view-harness,
      body.public-shell #calendar .fc-view-harness-active,
      body.public-shell #calendar .fc-scrollgrid,
      body.public-shell #publicCalendar .fc,
      body.public-shell #publicCalendar .fc-view-harness,
      body.public-shell #publicCalendar .fc-view-harness-active,
      body.public-shell #publicCalendar .fc-scrollgrid {
        height: 100% !important;
        max-height: 100% !important;
        max-width: 100% !important;
        min-height: 0 !important;
        min-width: 0 !important;
        visibility: visible !important;
        width: 100% !important;
      }

      body.portal-shell #calendar .fc-col-header,
      body.portal-shell #calendar .fc-daygrid-body,
      body.portal-shell #calendar .fc-daygrid-body table,
      body.portal-shell #calendar .fc-scrollgrid-sync-table,
      body.admin-dashboard-shell #calendar .fc-col-header,
      body.admin-dashboard-shell #calendar .fc-daygrid-body,
      body.admin-dashboard-shell #calendar .fc-daygrid-body table,
      body.admin-dashboard-shell #calendar .fc-scrollgrid-sync-table,
      body.org-dashboard-shell #calendar .fc-col-header,
      body.org-dashboard-shell #calendar .fc-daygrid-body,
      body.org-dashboard-shell #calendar .fc-daygrid-body table,
      body.org-dashboard-shell #calendar .fc-scrollgrid-sync-table,
      body.public-shell #calendar .fc-col-header,
      body.public-shell #calendar .fc-daygrid-body,
      body.public-shell #calendar .fc-daygrid-body table,
      body.public-shell #calendar .fc-scrollgrid-sync-table,
      body.public-shell #publicCalendar .fc-col-header,
      body.public-shell #publicCalendar .fc-daygrid-body,
      body.public-shell #publicCalendar .fc-daygrid-body table,
      body.public-shell #publicCalendar .fc-scrollgrid-sync-table {
        height: 100% !important;
        table-layout: fixed !important;
        width: 100% !important;
      }

      #calendar .fc-daygrid-day,
      #publicCalendar .fc-daygrid-day {
        background: #fff !important;
        border-color: #cbd5e1 !important;
        opacity: 1 !important;
        visibility: visible !important;
      }

      #calendar .fc-daygrid-day-frame,
      #publicCalendar .fc-daygrid-day-frame {
        min-height: clamp(74px, 11dvh, 132px) !important;
        padding: var(--space-xs) !important;
      }

      #calendar .fc-daygrid-day-number,
      #publicCalendar .fc-daygrid-day-number {
        color: #0f172a !important;
        display: inline-flex !important;
        font-size: var(--font-sm) !important;
        font-weight: 800 !important;
        line-height: 1 !important;
        opacity: 1 !important;
        padding: 3px 5px !important;
        visibility: visible !important;
        z-index: 2 !important;
      }

      #calendar .fc-day-other,
      #publicCalendar .fc-day-other {
        background: #f8fafc !important;
      }

      #calendar .fc-day-other .fc-daygrid-day-number,
      #publicCalendar .fc-day-other .fc-daygrid-day-number {
        color: #94a3b8 !important;
      }

      #calendar .fc-day-today .fc-daygrid-day-frame,
      #publicCalendar .fc-day-today .fc-daygrid-day-frame {
        background: rgba(250, 204, 21, .18) !important;
        box-shadow: inset 0 0 0 2px rgba(37, 99, 235, .25) !important;
      }

      #calendar .fc-daygrid-event,
      #calendar .fc-more-link,
      #publicCalendar .fc-daygrid-event,
      #publicCalendar .fc-more-link {
        border-radius: 7px !important;
        font-size: var(--font-xs) !important;
        line-height: 1.15 !important;
        margin: 1px 2px !important;
        max-width: calc(100% - 4px) !important;
        overflow: hidden !important;
        padding: 2px 4px !important;
        text-overflow: ellipsis !important;
      }

      #calendar .fc-event-title,
      #calendar .fc-event-time,
      #publicCalendar .fc-event-title,
      #publicCalendar .fc-event-time {
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #conferenceRoomCalendar {
        height: calc(100dvh - var(--header-height) - 18px) !important;
        min-height: 320px !important;
      }

      #conferenceRoomCalendar .fc-timegrid-slot {
        height: calc(var(--calendar-row-height) / 2) !important;
      }

      #conferenceRoomCalendar .fc-timegrid-slot-label,
      #conferenceRoomCalendar .fc-event-time,
      #conferenceRoomCalendar .fc-event-title {
        font-size: var(--font-xs) !important;
        line-height: 1.08 !important;
      }

      #conferenceRoomCalendar .fc-timegrid-event .fc-event-main-frame {
        padding: 3px 4px !important;
      }

      dialog,
      .modal,
      .public-announcement-popup,
      .conference-room-dialog {
        max-width: calc(100vw - (var(--space-md) * 2)) !important;
      }

      dialog[open],
      .modal[open],
      .modal.is-open {
        max-height: calc(100dvh - (var(--space-md) * 2)) !important;
      }

      .modal-card,
      dialog .modal-card,
      .conference-room-dialog form {
        max-height: calc(100dvh - (var(--space-md) * 2)) !important;
        overflow: hidden;
      }

      .modal-card > :not(.modal-header):not(.modal-actions),
      dialog form,
      .conference-room-dialog form {
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .form-grid,
      .form-grid.two,
      .modal-form-grid,
      .admin-tab-form-grid {
        display: grid;
        gap: var(--space-md);
        grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
      }

      .modal-actions,
      .form-actions,
      .inline-actions,
      .admin-tab-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
        min-width: 0;
      }

      table {
        max-width: 100%;
      }

      .table-scroll,
      .admin-table-wrap,
      .accounts-table-wrap,
      .activity-list,
      .ui-card-list,
      #notificationsList {
        max-width: 100%;
        min-width: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      @media (max-width: 839px) {
        .portal-topbar,
        .dashboard-header,
        .calendar-toolbar,
        .public-header,
        .public-calendar-header {
          gap: var(--space-xs);
          min-height: var(--header-height);
          padding-inline: var(--space-sm);
        }

        .portal-title,
        .dashboard-title,
        .calendar-title,
        .public-title {
          font-size: var(--font-lg) !important;
          line-height: 1.08 !important;
        }

        .calendar-controls,
        .admin-tab-header-tools {
          display: grid !important;
          gap: var(--space-sm) !important;
          grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr)) !important;
          width: 100% !important;
        }

        .calendar-controls select,
        .calendar-controls input,
        .admin-tab-header-tools select,
        .admin-tab-header-tools input {
          width: 100% !important;
        }

        body.portal-shell #calendar,
        body.admin-dashboard-shell #calendar,
        body.org-dashboard-shell #calendar,
        body.public-shell #calendar,
        body.public-shell #publicCalendar,
        .public-calendar {
          min-height: min(720px, calc(100dvh - 138px)) !important;
          overflow-x: hidden !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch !important;
        }

        body.portal-shell #calendar .fc-scrollgrid,
        body.admin-dashboard-shell #calendar .fc-scrollgrid,
        body.org-dashboard-shell #calendar .fc-scrollgrid,
        body.public-shell #calendar .fc-scrollgrid,
        body.public-shell #publicCalendar .fc-scrollgrid {
          min-width: 0 !important;
          width: 100% !important;
        }

        #calendar .fc-daygrid-day-frame,
        #publicCalendar .fc-daygrid-day-frame {
          min-height: 84px !important;
        }

        .conference-room-detail-list,
        .conference-room-dialog .form-grid.two {
          grid-template-columns: 1fr !important;
        }
      }

      @media (max-width: 599px) {
        .brand-subtitle,
        .public-brand-subtitle,
        .header-secondary,
        .secondary-label {
          display: none !important;
        }

        .portal-topbar,
        .dashboard-header,
        .public-header,
        .conference-room-header {
          flex-wrap: nowrap;
        }

        .modal-actions,
        .form-actions,
        .admin-tab-actions,
        .conference-room-dialog footer {
          align-items: stretch;
          flex-direction: column;
        }

        .modal-actions button,
        .form-actions button,
        .admin-tab-actions button,
        .conference-room-dialog footer button {
          width: 100%;
        }

        #conferenceRoomModal .conference-room-header {
          grid-template-columns: 40px minmax(0, 1fr) auto !important;
          min-height: var(--header-height) !important;
          padding: var(--space-sm) !important;
        }

        .conference-room-tools {
          gap: var(--space-xs) !important;
        }

        .conference-room-nav-button,
        .conference-room-notifications {
          flex-basis: 36px !important;
          height: 36px !important;
          max-width: 36px !important;
          min-height: 36px !important;
          min-width: 36px !important;
          width: 36px !important;
        }

        #conferenceRoomCalendar .fc-col-header-cell-cushion {
          font-size: .7rem !important;
          padding: 3px 1px !important;
        }

        #conferenceRoomCalendar .fc-timegrid-event .fc-event-main-frame {
          padding: 2px 3px !important;
        }
      }

      body.personal-calendar-perspective #personalCalendarHost,
      body.personal-calendar-perspective #personalCalendarHost .fc,
      body.personal-calendar-perspective #personalCalendarHost .fc-view-harness,
      body.personal-calendar-perspective #personalCalendarHost .fc-view-harness-active,
      body.personal-calendar-perspective #personalCalendarHost .fc-scrollgrid,
      body.personal-calendar-perspective #personalCalendarHost .fc-scrollgrid table,
      body.personal-calendar-perspective #personalCalendarHost .fc-col-header,
      body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-body,
      body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-body table,
      body.personal-calendar-perspective #personalCalendarHost .fc-scrollgrid-sync-table {
        max-width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
        width: 100% !important;
      }

      body.personal-calendar-perspective #personalCalendarHost {
        overflow: hidden !important;
      }

      body.personal-calendar-perspective #personalCalendarHost .fc-col-header-cell,
      body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-day {
        min-width: 0 !important;
        width: 14.2857% !important;
      }

      body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-day-frame {
        align-items: stretch !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: clamp(58px, 10.8dvh, 112px) !important;
        overflow: hidden !important;
        padding: clamp(1px, .7vw, 5px) !important;
      }

      body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-day-number {
        color: #0f172a !important;
        font-size: clamp(.68rem, 1.7vw, .86rem) !important;
        font-weight: 800 !important;
        line-height: 1 !important;
        min-width: 0 !important;
        padding: 2px 3px !important;
      }

      body.personal-calendar-perspective #personalCalendarHost .fc-day-other .fc-daygrid-day-number {
        color: #94a3b8 !important;
      }

      body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-day-events,
      body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-event-harness {
        min-width: 0 !important;
      }

      body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-event {
        border-radius: 6px !important;
        font-size: clamp(.56rem, 1.5vw, .72rem) !important;
        line-height: 1.08 !important;
        margin: 1px !important;
        max-width: calc(100% - 2px) !important;
        min-width: 0 !important;
        padding: 1px 3px !important;
        width: calc(100% - 2px) !important;
      }

      body.personal-calendar-perspective #personalCalendarHost .fc-event-title,
      body.personal-calendar-perspective #personalCalendarHost .fc-event-time {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #conferenceRoomModal .conference-room-header {
        display: grid !important;
        grid-template-columns: clamp(38px, 4.6vw, 52px) minmax(0, 1fr) auto !important;
        gap: clamp(6px, 1.4vw, 12px) !important;
        min-height: var(--header-height) !important;
        padding: clamp(8px, 1.6vw, 14px) clamp(10px, 2vw, 18px) !important;
      }

      #conferenceRoomModal .conference-room-header h3 {
        font-size: clamp(1rem, 2.6vw, 1.35rem) !important;
        line-height: 1.08 !important;
        min-width: 0 !important;
        overflow: hidden !important;
        text-align: center !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #conferenceRoomModal .conference-room-tools {
        align-items: center !important;
        display: flex !important;
        flex-wrap: nowrap !important;
        gap: clamp(5px, 1.2vw, 10px) !important;
        justify-content: flex-end !important;
        min-width: 0 !important;
      }

      #conferenceRoomModal .conference-room-nav-button,
      #conferenceRoomModal .conference-room-notifications,
      #conferenceRoomModal #conferenceRoomBack {
        flex: 0 0 clamp(36px, 4.8vw, 44px) !important;
        height: clamp(36px, 4.8vw, 44px) !important;
        max-width: clamp(36px, 4.8vw, 44px) !important;
        min-height: clamp(36px, 4.8vw, 44px) !important;
        min-width: clamp(36px, 4.8vw, 44px) !important;
        padding: 0 !important;
        width: clamp(36px, 4.8vw, 44px) !important;
      }

      #conferenceRoomModal .conference-room-body {
        height: calc(100dvh - var(--header-height)) !important;
        padding: clamp(6px, 1.4vw, 12px) !important;
      }

      #conferenceRoomCalendar {
        height: calc(100dvh - var(--header-height) - clamp(12px, 2.4vw, 24px)) !important;
        max-height: calc(100dvh - var(--header-height) - clamp(12px, 2.4vw, 24px)) !important;
      }

      #eventRequestsModal.admin-tab-page .modal-header {
        align-items: center !important;
        display: grid !important;
        gap: clamp(8px, 1.5vw, 14px) !important;
        grid-template-columns: auto minmax(0, auto) minmax(260px, 1fr) !important;
        min-width: 0 !important;
        padding-inline: clamp(10px, 2vw, 20px) !important;
      }

      #eventRequestsModal.admin-tab-page .modal-header > div:not(.admin-tab-header-tools) {
        min-width: 0 !important;
      }

      #eventRequestsModal.admin-tab-page .modal-header h3,
      #eventRequestsModal.admin-tab-page .modal-header h2 {
        font-size: clamp(1.05rem, 2.2vw, 1.6rem) !important;
        line-height: 1.05 !important;
        margin: 0 !important;
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #eventRequestsModal.admin-tab-page .admin-tab-header-tools,
      #eventRequestsModal.admin-tab-page .event-request-filters {
        min-width: 0 !important;
        width: 100% !important;
      }

      #eventRequestsModal.admin-tab-page .event-request-filters {
        align-items: end !important;
        display: grid !important;
        gap: clamp(6px, 1.2vw, 10px) !important;
        grid-template-columns: minmax(150px, 1.15fr) repeat(3, minmax(112px, .85fr)) !important;
        margin: 0 !important;
        overflow: hidden !important;
      }

      #eventRequestsModal.admin-tab-page .event-request-filters label {
        min-width: 0 !important;
      }

      #eventRequestsModal.admin-tab-page .event-request-filters input,
      #eventRequestsModal.admin-tab-page .event-request-filters select {
        border-radius: 999px !important;
        font-size: clamp(.72rem, 1.6vw, .9rem) !important;
        min-height: clamp(32px, 4vw, 40px) !important;
        min-width: 0 !important;
        overflow: hidden !important;
        padding-inline: clamp(8px, 1.5vw, 12px) !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        width: 100% !important;
      }

      #eventRequestsModal .event-request-detail-grid {
        max-width: 100% !important;
        min-width: 0 !important;
      }

      #eventRequestsModal .event-request-detail-card {
        max-width: 100% !important;
        min-width: 0 !important;
        overflow: hidden !important;
      }

      #eventRequestsModal .er-detail-row {
        display: grid !important;
        grid-template-columns: minmax(112px, .36fr) minmax(0, 1fr) !important;
      }

      #eventRequestsModal .er-detail-row dd,
      #eventRequestsModal .er-detail-row dt,
      #eventRequestsModal .er-card-header h3,
      #eventRequestsModal .er-card-header p {
        min-width: 0 !important;
        overflow-wrap: anywhere !important;
      }

      #eventRequestsModal .er-card-actions {
        display: grid !important;
        gap: clamp(6px, 1vw, 10px) !important;
        grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr)) !important;
      }

      #eventRequestsModal .er-card-actions button {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      @media (min-width: 761px) and (max-width: 1040px) {
        #eventRequestsModal.admin-tab-page .modal-header {
          grid-template-columns: auto minmax(160px, auto) minmax(0, 1fr) !important;
          min-height: clamp(64px, 8vw, 84px) !important;
        }

        #eventRequestsModal.admin-tab-page .event-request-filters {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 760px) {
        #eventRequestsModal.admin-tab-page .modal-header {
          grid-template-columns: clamp(34px, 9vw, 40px) minmax(0, 1fr) !important;
          grid-template-rows: auto !important;
          min-height: clamp(50px, 13vw, 58px) !important;
          padding: clamp(6px, 2vw, 8px) !important;
        }

        #eventRequestsModal.admin-tab-page .event-request-filters {
          grid-template-columns: clamp(32px, 8.5vw, 38px) repeat(3, minmax(0, 1fr)) !important;
        }

        #eventRequestsModal .er-detail-row {
          grid-template-columns: minmax(104px, .42fr) minmax(0, 1fr) !important;
        }

        #eventRequestsModal .er-card-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 420px) {
        body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-day-frame {
          min-height: clamp(46px, 12vw, 58px) !important;
        }

        body.personal-calendar-perspective #personalCalendarHost .fc-daygrid-event {
          font-size: .54rem !important;
          padding-inline: 2px !important;
        }

        #eventRequestsModal .er-detail-row {
          grid-template-columns: 1fr !important;
          gap: 2px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function calendarCandidates() {
    return [
      window.CONNECT_STATE?.calendar,
      window.__conferenceRoomCalendar,
      window.calendar,
      window.mainCalendar,
      window.publicCalendar
    ].filter(Boolean);
  }

  function refreshCalendarSizes() {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      for (const calendar of calendarCandidates()) {
        try { calendar.updateSize?.(); } catch (error) { console.warn('Calendar resize failed:', error); }
      }
      cleanMojibakeText();
      document.dispatchEvent(new CustomEvent('csc-responsive-size-refresh'));
    }, 40);
  }

  function cleanMojibakeText() {
    if (!document.body || !window.NodeFilter) return;
    const scope = document.querySelector('#personalCalendarHost') || document.body;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const value = node.nodeValue || '';
      if (value.trim() === 'Â') node.nodeValue = '';
      else if (value.includes('Â ')) node.nodeValue = value.replace(/\u00c2(?=\s)/g, '');
    }
  }

  function applyBreakpointClass() {
    const active = BREAKPOINTS.find(([, query]) => window.matchMedia(query).matches)?.[0] || 'wide';
    document.documentElement.dataset.cscViewport = active;
    document.body.dataset.cscViewport = active;
  }

  function observeLayout() {
    const targets = [
      document.body,
      document.getElementById('calendar'),
      document.getElementById('publicCalendar'),
      document.getElementById('conferenceRoomCalendar'),
      document.querySelector('.calendar-panel'),
      document.querySelector('.public-calendar-panel'),
      document.querySelector('.sidebar')
    ].filter(Boolean);

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(refreshCalendarSizes);
      targets.forEach((target) => observer.observe(target));
      window.__cscResponsiveObserver = observer;
    }

    new MutationObserver(refreshCalendarSizes).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'open', 'style']
    });
    new MutationObserver(cleanMojibakeText).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function bindResizeEvents() {
    const run = () => {
      applyBreakpointClass();
      refreshCalendarSizes();
    };
    window.addEventListener('resize', run, { passive: true });
    window.visualViewport?.addEventListener('resize', run, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(run, 120), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) run();
    });
    document.addEventListener('csc:calendar-data-refreshed', refreshCalendarSizes);
    document.addEventListener('conference-room-bookings-updated', refreshCalendarSizes);
  }

  function init() {
    injectStyle();
    applyBreakpointClass();
    cleanMojibakeText();
    observeLayout();
    bindResizeEvents();
    refreshCalendarSizes();
    setTimeout(refreshCalendarSizes, 250);
    setTimeout(refreshCalendarSizes, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else queueMicrotask(init);
})();
