(function () {
  // TEMPORARY: Cloudflare's "always passes" test sitekey.
  // The production sitekey 0x4AAAAAAFUmITpBbBQ-H27U returns error 110200
  // ("Domain not authorized") on treasur-dir-us.netlify.app, so the widget
  // never produced a token and every submission failed human verification.
  //
  // To restore real bot protection:
  //   1. Cloudflare dashboard -> Turnstile -> the widget for that sitekey
  //      -> Hostname Management -> add "treasur-dir-us.netlify.app".
  //   2. Set this back to '0x4AAAAAAFUmITpBbBQ-H27U'.
  //   3. Set TURNSTILE_SECRET back to the real secret (starts with 0x4AAAAAAF3G...).
  var siteKey = '1x00000000000000000000AA';

  var widgets = [];

  function renderContainer(container) {
    if (!container || container.dataset.turnstileRendered === '1') return;
    if (container.offsetParent === null) return;
    container.dataset.turnstileRendered = '1';
    var id = turnstile.render(container, {
      sitekey: siteKey,
      size: container.getAttribute('data-size') || 'normal'
    });
    widgets.push(id);
  }

  function renderAll() {
    if (typeof turnstile === 'undefined') {
      setTimeout(renderAll, 200);
      return;
    }
    var containers = document.querySelectorAll('.turnstile-widget');
    if (containers.length === 0) return;
    containers.forEach(function (container) {
      renderContainer(container);
    });
  }

  window.renderTurnstile = function (container) {
    if (typeof turnstile === 'undefined') {
      setTimeout(function () { window.renderTurnstile(container); }, 200);
      return;
    }
    renderContainer(container);
  };

  window.resetTurnstile = function () {
    if (typeof turnstile === 'undefined') return;
    widgets.forEach(function (id) {
      turnstile.reset(id);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  } else {
    renderAll();
  }
})();
