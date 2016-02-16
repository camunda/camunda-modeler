'use strict';

var raf = require('raf');

var diff = require('virtual-dom/diff'),
    patch = require('virtual-dom/patch'),
    createElement = require('virtual-dom/create-element');

var debounce = require('lodash/function/debounce');

var debug = require('debug')('main-loop');


module.exports = function mainLoop(app, parent) {

  var tree = app.render();

  var rootNode = createElement(tree);

  parent.appendChild(rootNode);


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

};