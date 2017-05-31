'use strict';

var Ids = require('ids');

var ipcRenderer = window.require('electron').ipcRenderer;

var ids = new Ids();

/**
 * Communicate with the Browser process.
 * Make sure that the callback is always called, even when there's an error.
 *
 * @param {Event} event
 * @param {Object|Array<Object>} args
 * @param {Function} callback
 */
function send(event, args, callback) {
  var _args = args;

  if (typeof arguments[arguments.length - 1] !== 'function') {
    _args = Array.prototype.slice.call(arguments).slice(1);
  }

  if (typeof args === 'function') {
    callback = args;
    _args = [];
  }

  var id = ids.next();

  if (callback) {
    ipcRenderer.once(event + ':response:' + id, function(evt, args) {
      if (typeof args[0] === 'string') {
        args[0] = new Error(args[0]);
      }

      callback.apply(null, args);
    });
  }

  ipcRenderer.send.apply(null, [ event, id ].concat(_args));
}

module.exports.send = send;


function on(event, callback) {
  ipcRenderer.on(event, callback);
}

module.exports.on = on;


function once(event, callback) {
  ipcRenderer.once(event, callback);
}

module.exports.once = once;
