// Hands a screen's DC template to dc-runtime as raw text.
//
// Every *.dc.html keeps its <x-dc> block inside <script type="text/x-template" data-dc-template>,
// so the browser never parses the template markup into the live page. Parsing it would
// lowercase camelCase attributes (onClick, viewBox), move <sc-for> rows out of <table>/<select>
// and evaluate "{{binding}}" placeholders as real SVG/input values. dc-runtime normalises the
// raw text itself, exactly as it does for sibling components fetched by <dc-import>.
//
// Load this script before vendor/dc-runtime/support.js.
(function () {
  // A defined __resources map also stops the runtime from re-fetching the page to re-read it.
  window.__resources = window.__resources || {};

  function mount() {
    var source = document.querySelector('script[type="text/x-template"][data-dc-template]');
    if (!source) return;
    var text = source.textContent;
    var open = /<x-dc(?:\s[^>]*)?>/.exec(text);
    var close = text.lastIndexOf('</x-dc>');
    if (!open || close < open.index) {
      console.error('[dc-source] data-dc-template has no <x-dc> block');
      return;
    }
    var template = text.slice(open.index + open[0].length, close);
    var host = document.createElement('x-dc');
    // dc-runtime reads the root template through innerHTML; serve the untouched source.
    Object.defineProperty(host, 'innerHTML', { get: function () { return template; } });
    source.replaceWith(host);
    scrollToFragment();
  }

  // Links such as Main.dc.html#faq or Settings.dc.html#profile point at markup that exists only
  // after the runtime renders, so the browser's own scroll-to-fragment finds nothing on load.
  function scrollToFragment() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    var frames = 0;
    (function look() {
      var target = document.getElementById(id);
      if (target) target.scrollIntoView();
      else if (frames++ < 180) window.requestAnimationFrame(look);
    })();
  }

  // Registered before dc-runtime's own DOMContentLoaded boot, so it runs first.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
