(function () {
  var siteKey = '0x4AAAAAAEABTXl6BQjZ5ocM';

  var widgets = [];

  function renderAll() {
    if (typeof turnstile === 'undefined') {
      setTimeout(renderAll, 200);
      return;
    }
    var containers = document.querySelectorAll('.turnstile-widget');
    if (containers.length === 0) return;
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
