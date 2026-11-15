// Gives screen logic access to the previous state inside componentDidUpdate.
//
// dc-runtime replaces `logic.state` with a new object on every setState and then calls
// `logic.componentDidUpdate(prevProps)` with prevProps only. Screens that compare old and new
// state call `this.prevState()` at the top of componentDidUpdate instead of reading a second
// argument:
//
//   componentDidUpdate(pp) { var ps = this.prevState(); if (this.state.open && !ps.open) ... }
//
// prevState() returns the state as it was at the previous commit (several setState calls that
// React batches into one render count as one change), or the current state when the update was
// not caused by setState. Call it once per componentDidUpdate.
//
// Load this script after vendor/dc-runtime/support.js.
(function () {
  function patch() {
    var Base = window.DCLogic;
    if (!Base || Base.prototype.prevState) return !!Base;
    var setState = Base.prototype.setState;
    Base.prototype.setState = function (update, callback) {
      if (!this.__prevPending) { this.__prev = this.state; this.__prevPending = true; }
      return setState.call(this, update, callback);
    };
    Base.prototype.prevState = function () {
      var prev = this.__prevPending ? this.__prev : this.state;
      this.__prevPending = false;
      this.__prev = null;
      return prev || {};
    };
    return true;
  }
  // The runtime exposes DCLogic once React is ready and boots on DOMContentLoaded. This listener
  // is registered first, so the patch is in place before any screen logic is created.
  if (!patch()) document.addEventListener('DOMContentLoaded', function () {
    if (!patch()) console.error('[dc-lifecycle] window.DCLogic is not available');
  });
})();
