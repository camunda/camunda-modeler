'use strict';

var remote = window.require('electron').remote;

/**
 * Provides access to externally loaded bundles for different app
 * integration layers.
 */
function Plugins() {
  this.plugins = remote.app.plugins;
}

/**
 * Loads all scripts.
 *
 * @return {Array}
 */
Plugins.prototype.load = function(done) {
  this.plugins.getPlugins()
    .filter(p => p.style)
    .forEach(p => loadStyle(p.style));

  var scripts = this.plugins.getPlugins()
    .filter(p => p.script);

  var counter = scripts.length;

  if (counter === 0) {
    return done();
  }

  scripts.forEach(p => {
    loadScript(p.script, () => {
      --counter;
      if (counter === 0) {
        return done();
      }
    });
  });
};

/**
 * Returns all loaded plugins.
 *
 * @return {Array}
 */
Plugins.prototype.getAll = function() {
  var plugins = window.plugins || [];
  return plugins.slice(0);
};

/**
 * Gets an array of plugins of given type or an empty array.
 *
 * @param  {String} type
 * @return {Array}
 */
Plugins.prototype.get = function(type) {
  if (!type) {
    throw new Error('Plugin type is not provided!');
  }

  var plugins = (
    this.getAll()
      .filter(p => p.type === type)
      .map(p => p.plugin)
  );

  return plugins;
};

function loadStyle(href) {
  var s = document.createElement('link');
  s.href = href;
  s.rel = 'stylesheet';
  document.head.appendChild(s);
}

function loadScript(src, done) {
  var s = document.createElement('script');
  s.src = src;
  s.type = 'text/javascript';
  s.onload = done;
  s.async = false;
  document.head.appendChild(s);
}

module.exports = Plugins;
