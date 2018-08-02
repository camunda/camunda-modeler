'use strict';

var hasProp = Object.prototype.hasOwnProperty;


module.exports = function hasProperty(object, propName) {
  return hasProp.call(object, propName);
};