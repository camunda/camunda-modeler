'use strict';

/* global document */

var Hook = require('virtual-hook');

var nextTick = require('next-tick');

function RemoveHook(callback) {
  return Hook({
    unhook: function unhook(node) {
      if (document.body.contains(node)) {
        return;
      }

      nextTick(function() {
        callback(node);
      });
    }
  });
}

module.exports = RemoveHook;
