'use strict';

var ipc = require_electron('ipc');


/**
 * Communicate with the Browser process.
 * Make sure that the callback is always called, even when there's an error.
 *
 * @param  {Event}   event
 * @param  {Arguments}   args
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
      return callback(new Error(arguments[0]));
    }

    callback.apply(null, Array.prototype.slice.call(arguments));
  });
}

module.exports.send = send;
