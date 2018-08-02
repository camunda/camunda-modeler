'use strict';

/* global document */

var Hook = require('virtual-hook');

var nextTick = require('next-tick');


function RemoveHook(scroll) {

  return Hook({
    hook: function hook(node) {

      if (scroll) {
        nextTick(function() {
          node.scrollIntoView();
        });
      }
    }
  });
}

module.exports = RemoveHook;
