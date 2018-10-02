import slice from '../slice';

import {
  domify
} from 'min-dom';


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
export default function dragger(fn) {

  var self;
  var extraArgs;

  var startPosition;

  var dragging;

  function onDrag(event) {

    // suppress drag end event
    if (event.x === 0) {
      return;
    }

    var currentPosition = eventPosition(event),
        delta = pointDelta(currentPosition, startPosition);

    var args = extraArgs.concat([ event, delta ]);

    if (!dragging) {
      dragging = true;

      return;
    }

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
    function onEnd() {
      document.removeEventListener('drag', onDrag);
      document.removeEventListener('dragend', onEnd);

      self = extraArgs = startPosition = dragging = null;
    }

    // attach drag + cleanup event
    document.addEventListener('drag', onDrag);
    document.addEventListener('dragend', onEnd);
  };

  onDragStart.onDrag = onDrag;

  return onDragStart;
}


function emptyCanvas() {
  return domify('<canvas width="0" height="0" />');
}

function eventPosition(event) {
  return {
    x: event.clientX,
    y: event.clientY
  };
}

function pointDelta(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}