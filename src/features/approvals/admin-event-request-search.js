(() => {
  if (window.__adminEventRequestSearch) return;
  window.__adminEventRequestSearch = true;

  const EXPANDED_CLASS = 'event-request-search-expanded';

  function injectStyle() {
    if (document.getElementById('admin-event-request-search-style')) return;
    const style = document.createElement('style');
    style.id = 'admin-event-request-search-style';
    style.textContent = `
      @media (max-width: 920px){
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters{
          align-items:end!important;
          display:flex!important;
          flex-direction:row!important;
          flex-wrap:nowrap!important;
          gap:6px!important;
          justify-content:flex-start!important;
          overflow:hidden!important;
          position:relative!important;
          width:100%!important;
        }
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label{
          flex:1 1 0!important;
          max-width:none!important;
          min-width:0!important;
          width:auto!important;
        }
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:first-child{
          align-self:end!important;
          background:#fff!important;
          border:1px solid #cbd5e1!important;
          border-radius:999px!important;
          box-shadow:0 8px 18px rgba(15,23,42,.08)!important;
          color:transparent!important;
          cursor:pointer!important;
          display:block!important;
          flex:0 0 42px!important;
          font-size:0!important;
          height:42px!important;
          line-height:0!important;
          max-width:42px!important;
          min-width:0!important;
          overflow:hidden!important;
          padding:0!important;
          position:relative!important;
          text-indent:-999px!important;
          text-transform:none!important;
          width:42px!important;
        }
        body.admin-dashboard-shell #eventRequestsModal:not(.${EXPANDED_CLASS}) .event-request-filters label:first-child:focus-within,
        body.admin-dashboard-shell #eventRequestsModal:not(.${EXPANDED_CLASS}) .event-request-filters label:first-child:has(input:not(:placeholder-shown)){
          color:transparent!important;
          flex:0 0 42px!important;
          font-size:0!important;
          grid-column:auto!important;
          line-height:0!important;
          max-width:42px!important;
          padding:0!important;
          text-indent:-999px!important;
          width:42px!important;
        }
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:first-child::before{
          align-items:center!important;
          color:#0f172a!important;
          content:''!important;
          display:flex!important;
          height:15px!important;
          justify-content:center!important;
          left:50%!important;
          overflow:hidden!important;
          padding:0!important;
          pointer-events:none!important;
          position:absolute!important;
          top:50%!important;
          transform:translate(-58%,-58%)!important;
          text-indent:0!important;
          text-transform:none!important;
          width:15px!important;
          z-index:2!important;
          border:2px solid #0f172a!important;
          border-radius:999px!important;
          box-sizing:border-box!important;
        }
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:first-child::after{
          background:#0f172a!important;
          border-radius:999px!important;
          content:''!important;
          height:8px!important;
          left:25px!important;
          pointer-events:none!important;
          position:absolute!important;
          top:26px!important;
          transform:rotate(45deg)!important;
          transform-origin:center!important;
          width:2px!important;
          z-index:3!important;
        }
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:first-child input{
          -webkit-text-fill-color:transparent!important;
          appearance:none!important;
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          caret-color:transparent!important;
          color:transparent!important;
          cursor:pointer!important;
          font-size:13px!important;
          height:42px!important;
          min-height:42px!important;
          opacity:0!important;
          overflow:hidden!important;
          padding:0!important;
          position:absolute!important;
          inset:0!important;
          text-indent:0!important;
          text-overflow:ellipsis!important;
          text-shadow:none!important;
          text-transform:none!important;
          white-space:nowrap!important;
          width:100%!important;
          z-index:1!important;
        }
        body.admin-dashboard-shell #eventRequestsModal:not(.${EXPANDED_CLASS}) .event-request-filters label:first-child input::placeholder{
          color:transparent!important;
          opacity:0!important;
        }
        body.admin-dashboard-shell #eventRequestsModal:not(.${EXPANDED_CLASS}) .event-request-filters label:first-child:focus-within input,
        body.admin-dashboard-shell #eventRequestsModal:not(.${EXPANDED_CLASS}) .event-request-filters label:first-child:has(input:not(:placeholder-shown)) input{
          opacity:0!important;
          padding:0!important;
        }
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:not(:first-child) select,
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:not(:first-child) input{
          min-height:42px!important;
          overflow:hidden!important;
          text-overflow:ellipsis!important;
          white-space:nowrap!important;
          width:100%!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.${EXPANDED_CLASS} .event-request-filters label:first-child{
          box-shadow:0 16px 34px rgba(15,23,42,.22)!important;
          color:#334155!important;
          flex:0 0 auto!important;
          grid-column:1/-1!important;
          left:0!important;
          max-width:none!important;
          min-width:0!important;
          position:absolute!important;
          right:0!important;
          text-indent:0!important;
          top:0!important;
          width:100%!important;
          z-index:30!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.${EXPANDED_CLASS} .event-request-filters label:first-child:focus-within,
        body.admin-dashboard-shell #eventRequestsModal.${EXPANDED_CLASS} .event-request-filters label:first-child:has(input:not(:placeholder-shown)){
          padding:0!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.${EXPANDED_CLASS} .event-request-filters label:first-child::before{
          display:none!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.${EXPANDED_CLASS} .event-request-filters label:first-child::after{
          display:none!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.${EXPANDED_CLASS} .event-request-filters label:first-child input{
          -webkit-text-fill-color:#0f172a!important;
          caret-color:auto!important;
          color:#0f172a!important;
          cursor:text!important;
          opacity:1!important;
          padding:0 14px!important;
          position:relative!important;
          text-align:left!important;
        }
        body.admin-dashboard-shell #eventRequestsModal.${EXPANDED_CLASS} .event-request-filters label:first-child input::placeholder{
          color:#64748b!important;
          opacity:1!important;
        }
      }
      @media (max-width: 640px){
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters{gap:4px!important;}
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label{flex:1 1 0!important;max-width:none!important;width:auto!important;}
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:first-child{flex:0 0 34px!important;height:34px!important;max-width:34px!important;width:34px!important;}
        body.admin-dashboard-shell #eventRequestsModal:not(.${EXPANDED_CLASS}) .event-request-filters label:first-child:focus-within,
        body.admin-dashboard-shell #eventRequestsModal:not(.${EXPANDED_CLASS}) .event-request-filters label:first-child:has(input:not(:placeholder-shown)){flex:0 0 34px!important;max-width:34px!important;width:34px!important;}
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:first-child::before{height:14px!important;width:14px!important;}
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:first-child::after{left:20px!important;top:21px!important;}
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:first-child input,
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:not(:first-child) select,
        body.admin-dashboard-shell #eventRequestsModal .event-request-filters label:not(:first-child) input{font-size:10px!important;min-height:34px!important;height:34px!important;padding-inline:6px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function modal() {
    return document.getElementById('eventRequestsModal');
  }

  function searchInput() {
    return modal()?.querySelector('.event-request-filters label:first-child input, .event-request-filters input[type="search"], .event-request-filters input');
  }

  function searchLabel() {
    return searchInput()?.closest('label');
  }

  function compactEnabled() {
    return window.matchMedia?.('(max-width: 920px)').matches;
  }

  function expand() {
    const currentModal = modal();
    const input = searchInput();
    if (!currentModal || !input || !compactEnabled()) return;
    currentModal.classList.add(EXPANDED_CLASS);
    input.placeholder = 'Search event requests';
    input.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
  }

  function collapse() {
    const currentModal = modal();
    const input = searchInput();
    if (!currentModal || !input) return;
    currentModal.classList.remove(EXPANDED_CLASS);
    input.placeholder = 'Search';
    input.setAttribute('aria-expanded', 'false');
  }

  function prepare() {
    const input = searchInput();
    const label = searchLabel();
    if (!input) return;
    if (label && label.dataset.compactSearchTextRemoved !== '1') {
      [...label.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.textContent = '';
      });
      label.dataset.compactSearchTextRemoved = '1';
    }
    if (input.dataset.eventRequestCompactSearch === '1') return;
    input.dataset.eventRequestCompactSearch = '1';
    input.placeholder = compactEnabled() ? 'Search' : input.placeholder || 'Search event requests';
    input.setAttribute('aria-label', input.getAttribute('aria-label') || 'Search event requests');
    input.setAttribute('aria-expanded', 'false');
    input.addEventListener('focus', expand);
    input.addEventListener('click', expand);
    input.addEventListener('blur', () => window.setTimeout(collapse, 100));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        input.blur();
        collapse();
      }
    });
  }

  function init() {
    injectStyle();
    prepare();
    document.addEventListener('click', (event) => {
      if (event.target.closest('#eventRequestsButton')) window.setTimeout(prepare, 160);
    }, true);
    window.addEventListener('resize', () => {
      if (!compactEnabled()) collapse();
    }, { passive: true });
    new MutationObserver(prepare).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
