// Prototype review helper (not part of the design).
// Applies `?prop=value` query parameters to the root component's props, standing in
// for the Claude Design "Tweaks" panel. Only props declared in the screen's
// `data-props` are applied, and enum values must match one of the declared options.
// Examples: NotFound.dc.html?variant=error, AppHeader.dc.html?active=bt
(function () {
  var params = new URLSearchParams(window.location.search);
  if (!params.toString()) return;

  var attempts = 0;
  function apply() {
    var root = typeof window.__dcRootName === 'function' ? window.__dcRootName() : null;
    var entry = root && window.__dcRegistry ? window.__dcRegistry[root] : null;
    if (!entry || !entry.propsMeta) {
      if (attempts++ < 200) setTimeout(apply, 25);
      return;
    }
    var props = {};
    Object.keys(entry.propsMeta).forEach(function (name) {
      var value = params.get(name);
      if (value === null) return;
      var options = entry.propsMeta[name].options;
      if (options && options.indexOf(value) < 0) {
        console.warn('[url-props] ignored ' + name + '=' + value + '; expected one of: ' + options.join(', '));
        return;
      }
      props[name] = value;
    });
    if (Object.keys(props).length) window.__dcSetProps(root, props);
  }
  apply();
})();
