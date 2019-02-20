/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import draggerFactory from '../dragger';

/* global sinon */


describe('dragger', function() {

  afterEach(function() {
    document.dispatchEvent(new DragEvent('dragend'));
  });


  it('should call provided function on drag event', function() {

    // given
    const callbackSpy = sinon.spy();
    const dragger = draggerFactory(callbackSpy);

    // when
    dragger(new DragEvent('dragstart', { clientX: 0, clientY: 0 }));

    document.dispatchEvent(new DragEvent('dragover', { clientX: 1, clientY: 1 }));
    document.dispatchEvent(new DragEvent('dragover', { clientX: 150, clientY: 150 }));

    // then
    expect(callbackSpy).to.be.calledTwice;
  });

});
