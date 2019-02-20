/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

  var self;

  var startX, startY;

  /** drag start */
  function onDragStart(event) {

    self = this;

    startX = event.clientX;
    startY = event.clientY;

    // (1) prevent preview image
    if (event.dataTransfer) {
      event.dataTransfer.setDragImage(emptyCanvas(), 0, 0);
    }

    // (2) setup drag listeners

    // attach drag + cleanup event
    document.addEventListener('dragover', onDrag);
    document.addEventListener('dragend', onEnd);
    document.addEventListener('drop', preventDefault);
  }

  function onDrag(event) {
    var delta = {
      x: event.clientX - startX,
      y: event.clientY - startY
    };

    // call provided fn with event, delta
    return fn.call(self, event, delta);
  }

  function onEnd() {
    document.removeEventListener('dragover', onDrag);
    document.removeEventListener('dragend', onEnd);
    document.removeEventListener('drop', preventDefault);
  }

  return onDragStart;
}


function emptyCanvas() {
  return domify('<canvas width="0" height="0" />');
}

function preventDefault(event) {
  event.preventDefault();
  event.stopPropagation();
}