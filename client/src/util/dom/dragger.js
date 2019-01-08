import {
  domify
} from 'min-dom';


/**
 * Add a dragger that calls back the passed function with
 * { event, delta } on drag.
 *
 * @example
 *
 * function dragMove(event, delta) {
 *   // we are dragging (!!)
 * }
 *
 * domElement.addEventListener('dragstart', dragger(dragMove));
 *
 * @param {Function} fn
 *
 * @return {Function} drag start callback function
 */
export default function createDragger(fn) {

  var self,
      startPosition;

  /** drag start */
  function onDragStart(event) {

    self = this;
    startPosition = eventPosition(event);

    // (1) prevent preview image
    if (event.dataTransfer) {
      event.dataTransfer.setDragImage(emptyCanvas(), 0, 0);
    }

    // (2) setup drag listeners

    // attach drag + cleanup event
    document.addEventListener('drag', onDrag);
    document.addEventListener('dragend', onEnd, { once: true });
  }

  function onDrag(event) {

    // suppress drag end event
    if (event.x === 0 && event.y === 0) {
      return;
    }

    var currentPosition = eventPosition(event),
        delta = pointDelta(currentPosition, startPosition);

    // call provided fn with event, delta
    return fn.call(self, event, delta);
  }

  function onEnd() {
    document.removeEventListener('drag', onDrag);
  }

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