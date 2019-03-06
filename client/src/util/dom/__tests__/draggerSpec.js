/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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
