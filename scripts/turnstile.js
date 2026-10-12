(function () {
  var siteKey = '0x4AAAAAAFUmITpBbBQ-H27U';

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
