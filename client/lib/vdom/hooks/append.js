'use strict';

/* global document */

var Hook = require('virtual-hook');

function AppendHook(callback) {
  return Hook({
    hook: function hook(node) {
      if (document.body.contains(node)) {
        return;
      }

      callback(node);
    }
  });
}

module.exports = AppendHook;