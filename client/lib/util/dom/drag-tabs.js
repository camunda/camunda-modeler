'use strict';

/* global window */

var dragTabs = require('drag-tabs');

var nextTick = require('next-tick');

var Hook = require('virtual-hook');

var debug = require('debug')('drag-tabs');


function DragTabsHook(options, onPositionChanged) {

  if (!options) {
    throw new Error('dragTabs options required');
  }

  return Hook({
    hook: function hook(node) {

      nextTick(function() {

        if (!document.body.contains(node)) {
          return;
        }

        var dragger = dragTabs.get(node);

        if (!dragger) {
          debug('init');

          dragger = dragTabs(node, options);

          dragger.on('drag', onPositionChanged);
          
          dragger.on('cancel', onPositionChanged);
        }

        debug('update');

        dragger.update();
      });
    }
  });
}

module.exports = DragTabsHook;
