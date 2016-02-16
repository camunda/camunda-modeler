'use strict';

/* global document */

var Hook = require('virtual-hook');

function RemoveHook(callback) {
  return Hook({
    unhook: function unhook(node) {
      if (document.body.contains(node)) {
        return;
      }

      callback(node);
    }
  });
}

module.exports = RemoveHook;