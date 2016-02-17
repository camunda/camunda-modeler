'use strict';

/**
 * We need to send a simple javascript object through IPC communication
 * in case there is an error or user cancellation, because the IPC
 * won't correctly serialize an `Error` object.
 */
var CANCELLATION_MESSAGE = 'User canceled';

module.exports.CANCELLATION_MESSAGE = CANCELLATION_MESSAGE;

/**
 * Checks wether the error is a user cancelation.
 *
 * @param  {Error}  err
 * @return {Boolean}
 */
function isCancel(err) {
  return new RegExp(CANCELLATION_MESSAGE).test(err.message);
}

module.exports.isCancel = isCancel;

/**
 * Creates a normal javascript object with the common `Error` object structure
 *
 * @param  {Error}  err
 * @return {Object}
 */
function normalizeError(err) {
  console.error(err);

  return err.message;
}

module.exports.normalizeError = normalizeError;
