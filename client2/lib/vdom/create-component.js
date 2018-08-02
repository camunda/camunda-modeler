'use strict';

module.exports = function createComponent(Constructor, options, children) {
  return new Constructor(options, children);
};
