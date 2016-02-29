'use strict';

var slice = require('util/slice');

var domify = require('domify');


/**
 * Add a dragger that calls back the passed function with
 * { args..., event, delta } on drag.
 *
 * @example
 *
 * function dragMove(event, delta) {
 *   // we are dragging (!!)
 * }
 *
 * domElement.addEventListener('dragstart', dragger(dragMove));
 *
 *
 * @param {Function} fn
 *
 * @return {Function} drag start callback function
 */
function dragger(fn) {

  var self;
  var extraArgs;

  var startPosition;

  function onDrag(event) {

    // suppress drag end event
    if (event.x === 0) {
      return;
    }

    var currentPosition = eventPosition(event),
        delta = pointDelta(currentPosition, startPosition);

    var args = extraArgs.concat([ event, delta ]);

    // call provided fn with extraArgs..., event, delta
    return fn.apply(self, args);
  }

  /** drag start */
  var onDragStart = function onDragStart() {

    // (0) extract extra arguments (extraArgs..., event)
    var args = slice(arguments),
        event = args.pop();

    self = this;
    extraArgs = args;
    startPosition = eventPosition(event);

    // (1) prevent preview image
    if (event.dataTransfer) {
      event.dataTransfer.setDragImage(emptyCanvas(), 0, 0);
    }

    // (2) setup drag listeners
    var target = event.target,
        onEnd;

    if (target) {

      // detach on end
      onEnd = function() {
        target.removeEventListener('drag', onDrag);
        target.removeEventListener('dragend', onEnd);

        self = extraArgs = startPosition = null;
      };

      // attach drag + cleanup event
      target.addEventListener('drag', onDrag);
      target.addEventListener('dragend', onEnd);
    }
  };

  onDragStart.onDrag = onDrag;

  return onDragStart;
}

module.exports = dragger;


function emptyCanvas() {
  return domify('<canvas width="0" height="0" />');
}

function eventPosition(event) {
  return {
    x: event.screenX,
    y: event.screenY
  };
}

function pointDelta(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}