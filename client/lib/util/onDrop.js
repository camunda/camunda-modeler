'use strict';

var domEvent = require('min-dom/lib/event'),
    domQuery = require('min-dom/lib/query'),
    domClasses = require('min-dom/lib/classes');

var dropCls = 'dropping';


function DragAndDrop(selector, onDropCallback) {

  var $el = domQuery(selector);
  var $elClasses = domClasses($el);

  var overCount = 0;

  this.dragenter = function(e) {
    e.stopPropagation();
    e.preventDefault();
    overCount++;

    $elClasses.add(dropCls);
  };

  this.dragover = function(e) {
    e.stopPropagation();
    e.preventDefault();
  };

  this.dragleave = function(e) {
    e.stopPropagation();
    e.preventDefault();

    if (--overCount <= 0) {
      $elClasses.remove(dropCls);
      overCount = 0;
    }
  };

  this.drop = function(e) {
    e.stopPropagation();
    e.preventDefault();

    $elClasses.remove(dropCls);

    onDropCallback(e.dataTransfer);
  };

  domEvent.bind($el, 'dragenter', this.dragenter);
  domEvent.bind($el, 'dragover', this.dragover);
  domEvent.bind($el, 'dragleave', this.dragleave);
  domEvent.bind($el, 'drop', this.drop);
}

module.exports = function(selector, callback) {
  return new DragAndDrop(selector, callback);
};
