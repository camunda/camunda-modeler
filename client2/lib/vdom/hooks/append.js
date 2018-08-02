'use strict';

/* global document */

var Hook = require('virtual-hook');

var nextTick = require('next-tick');

function AppendHook(callback) {
  return Hook({
    hook: function hook(node) {
      if (document.body.contains(node)) {
        return;
      }

      nextTick(function() {
        callback(node);
      });
    }
  });
}

module.exports = AppendHook;
