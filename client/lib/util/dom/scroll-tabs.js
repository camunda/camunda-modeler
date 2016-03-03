'use strict';

/* global window */

var scrollTabs = require('scroll-tabs');

var nextTick = require('next-tick');

var raf = require('raf');

var Hook = require('virtual-hook');

var debug = require('debug')('scroll-tabs');


function ScrollTabsHook(options, onScroll) {

  if (!options) {
    throw new Error('scrollTabs options required');
  }

  return Hook({
    hook: function hook(node) {

      nextTick(function() {

        if (!document.body.contains(node)) {
          return;
        }

        var scroller = scrollTabs.get(node);

        if (!scroller) {
          debug('init');

          scroller = scrollTabs(node, options);

          scroller.__windowResize = function() {
            debug('window-resize');

            raf(function() {
              debug('update');
              scroller.update();
            });
          };

          scroller.on('scroll', onScroll);

          // react on window resize
          window.addEventListener('resize', scroller.__windowResize, false);
        }

        debug('update');
        scroller.update();
      });
    },

    unhook: function unhook(node) {

      var scroller = scrollTabs.get(node);

      if (scroller) {
        nextTick(function() {
          if (document.body.contains(node)) {
            return;
          }

          debug('remove');

          // unbind react on window resize
          window.removeEventListener('resize', scroller.__windowResize, false);
        });
      }
    }
  });
}

module.exports = ScrollTabsHook;
