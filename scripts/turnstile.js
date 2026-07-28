(function () {
  var siteKey = window.TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.error('[Cloudflare Turnstile] TURNSTILE_SITE_KEY is not configured. Turnstile widget will not render.');
    return;
  }

  var widgets = [];

  function renderAll() {
    if (typeof turnstile === 'undefined') {
      setTimeout(renderAll, 200);
      return;
    }
    var containers = document.querySelectorAll('.cf-turnstile');
    containers.forEach(function (container) {
      var id = turnstile.render(container, {
        sitekey: siteKey,
        size: container.getAttribute('data-size') || 'normal'
      });
      widgets.push(id);
    });
  }

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
