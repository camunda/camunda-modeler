'use strict';

function needsOverride() {
  return new Error('need to implement this in a subclass');
}

module.exports = needsOverride;
