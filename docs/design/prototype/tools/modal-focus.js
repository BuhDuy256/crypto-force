// Focus handling shared by every element rendered with aria-modal="true" (drawers, dialogs,
// the sign-in gate).
//
// - When a modal appears, the element that had focus is remembered. If the screen logic has not
//   moved focus into the modal by the next frame, the first focusable element inside receives it.
// - Tab and Shift+Tab cycle inside the topmost open modal.
// - When a modal disappears and focus is left on <body> or on a removed node, focus returns to the
//   remembered element, or to <main> when that element no longer exists.
//
// Escape stays with each screen's own handlers. Load this script after tools/dc-lifecycle.js.
(function () {
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
  var open = []; // [{ el, opener }]

  function visible(el) { return el.isConnected && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  // Elements with tabindex="-1" (for example listbox options driven by aria-activedescendant) are not Tab stops.
  function focusables(root) { return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (el) { return el.tabIndex >= 0 && visible(el); }); }
  function lost() { var a = document.activeElement; return !a || a === document.body || !a.isConnected; }

  function sync() {
    var current = Array.prototype.filter.call(document.querySelectorAll('[aria-modal="true"]'), visible);
    open = open.filter(function (m) {
      if (current.indexOf(m.el) !== -1) return true;
      var opener = m.opener;
      setTimeout(function () {
        if (!lost()) return;
        if (opener && opener.isConnected && visible(opener)) opener.focus();
        else { var main = document.querySelector('main'); if (main) { if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1'); main.focus(); } }
      }, 30);
      return false;
    });
    current.forEach(function (el) {
      if (open.some(function (m) { return m.el === el; })) return;
      var opener = document.activeElement !== document.body ? document.activeElement : null;
      open.push({ el: el, opener: opener });
      requestAnimationFrame(function () {
        setTimeout(function () {
          if (!el.isConnected || el.contains(document.activeElement)) return;
          var first = focusables(el)[0];
          if (first) first.focus();
          else { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus(); }
        }, 30);
      });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !open.length) return;
    var top = open[open.length - 1].el;
    if (!top.isConnected) return;
    var items = focusables(top);
    if (!items.length) { e.preventDefault(); top.focus(); return; }
    var first = items[0], last = items[items.length - 1], a = document.activeElement;
    if (!top.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
    // Browsers can also focus elements outside the list (for example scrollable containers), so
    // decide by document position whether another listed element follows in the Tab direction.
    var ahead = items.filter(function (el) {
      var pos = a.compareDocumentPosition(el);
      return e.shiftKey ? (pos & Node.DOCUMENT_POSITION_PRECEDING) : (pos & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    if (!ahead.length || (e.shiftKey && a === first) || (!e.shiftKey && a === last)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  }, true);

  function start() {
    new MutationObserver(sync).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-modal', 'style', 'class', 'hidden'] });
    sync();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
