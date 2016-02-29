'use strict';

// REVIEW: Workaround for menu keyboard bindings on Mac.
// Can be removed, once migrated on to Electron >= 0.36.x
function isMac() {
  return window.navigator.platform === 'MacIntel';
}

module.exports = isMac;
