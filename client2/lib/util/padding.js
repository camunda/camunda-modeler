'use strict';

/**
 * Adds right padding to the string.
 * Takes initial text to pad, total length and optional sequence to pad with
 *
 * @param  {String} text
 * @param  {integer} length
 * @param  {String} sequence
 * @return {String}
 */
function padRight(text, length, sequence) {
  return text + Array(length - text.length + 1).join(sequence || ' ');
}

module.exports.padRight = padRight;