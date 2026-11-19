/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import CanvasResizedReposition from '../CanvasResizedReposition';

const spy = sinon.spy;


describe('CanvasResizedReposition', function() {

  it('should reposition the context pad on canvas.resized', function() {

    // given
    const updatePosition = spy();
    const updateVisibility = spy();

    const contextPad = {
      _updatePosition: updatePosition,
      _updateVisibility: updateVisibility
    };

    let resizedListener;

    const eventBus = {
      on: (event, listener) => {
        if (event === 'canvas.resized') {
          resizedListener = listener;
        }
      }
    };

    // when
    new CanvasResizedReposition(eventBus, contextPad);

    // then
    expect(resizedListener).to.exist;

    // when
    resizedListener();

    // then
    expect(updatePosition).to.have.been.called;
    expect(updateVisibility).to.have.been.called;
  });

});
