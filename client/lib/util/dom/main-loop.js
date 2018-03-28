'use strict';

var raf = require('raf');

var diff = require('virtual-dom/diff'),
    patch = require('virtual-dom/patch'),
    createElement = require('virtual-dom/create-element');

import {
  debounce
} from 'min-dash';

var debug = require('debug')('main-loop');


/**
 * Instantiates a main loop that updates the given
 * parentNode with the contents of the app whenever
 * the app changed (indicated via a `changed` event).
 *
 * @param {App} app
 * @param {DOMElement} parentNode
 */
function mainLoop(app, parentNode) {

  var tree = app.render();

  var rootNode = createElement(tree);

  parentNode.appendChild(rootNode);


  function update() {

    raf(function() {
      debug('update');

      var newTree = app.render();
      var patches = diff(tree, newTree);
      rootNode = patch(rootNode, patches);
      tree = newTree;
    });
  }

  // main loop
  app.on('changed', debounce(update, 1));

}

module.exports = mainLoop;