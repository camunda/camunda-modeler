'use strict';

module.exports = function slice(arrayLike) {
  return Array.prototype.slice.call(arrayLike);
};