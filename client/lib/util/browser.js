'use strict';

var ipc = require_electron('ipc');


/**
 * Communicate with the Browser process.
 * Make sure that the callback is always called, even when there's an error.
 *
 * @param  {Event} event
 * @param  {Arguments} args
 * @param  {Function} callback
 */
function send(event, args, callback) {
  if (typeof args === 'function') {
    callback = args;
    args = [];
  }

  if (callback) {
    ipc.once(event + '.response', function() {

      var args = Array.prototype.slice.call(arguments);

      if (args[0] && typeof args[0] === 'object') {
        console.debug('[browser]', event + '.response', args);

        return callback(new Error(args[0]));
      }

      callback.apply(null, args);
    });
  }

  ipc.send.apply(null, [ event ].concat(args));
}

module.exports.send = send;


function on(event, callback) {
  ipc.on(event, callback);
}

module.exports.on = on;


function once(event, callback) {
  ipc.once(event, callback);
}

module.exports.once = once;


function updateMenus(notation, entries) {
  send('menu.update', [ notation, entries ], function() {
    // do nothing
  });
}

module.exports.updateMenus = updateMenus;
