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

  ipc.send.apply(null, [ event ].concat(args));

  ipc.once(event + '.response', function() {
    if (arguments[0] && typeof arguments[0] === 'object') {
      console.debug('[browser]', event + '.response', arguments);

      return callback(new Error(arguments[0]));
    }

    callback.apply(null, Array.prototype.slice.call(arguments));
  });
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
