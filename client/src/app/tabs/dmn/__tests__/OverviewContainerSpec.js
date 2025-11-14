/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import OverviewContainer, {
  DEFAULT_LAYOUT,
  MAX_WIDTH
} from '../OverviewContainer';

import { render, fireEvent, cleanup } from '@testing-library/react';

const { spy } = sinon;

describe('<OverviewContainer>', function() {

  const onLayoutChangedSpy = spy();

  beforeEach(function() {

    const layout = {
      dmnOverview: {
        open: true,
        width: 500
      }
    };

    render(<OverviewContainer layout={ layout } onLayoutChanged={ onLayoutChangedSpy } />);
  });

  afterEach(function() {
    cleanup();
    onLayoutChangedSpy.resetHistory();
  });


  it('should resize', function() {

    // when
    resize(50);

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({ dmnOverview: { open: true, width: 550 } });
  });


  it('should close when resized to smaller than minimum size', function() {

    // when
    resize(-500);

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({
      dmnOverview: {
        open: false,
        width: DEFAULT_LAYOUT.width
      }
    });
  });


  it('should not resize to larger than maximum size', function() {

    // when
    resize(1000);

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({
      dmnOverview: {
        open: true,
        width: MAX_WIDTH
      }
    });
  });


  it('should toggle', function() {

    // when
    toggle();

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({
      dmnOverview: {
        open: false,
        width: 500
      }
    });
  });

});

// helpers //////////

function resize(x, y = 0) {
  const resizeHandle = document.querySelector('.resize-handle');

  fireEvent.dragStart(resizeHandle);
  fireEvent.dragOver(resizeHandle, { clientX: x, clientY: y });
  fireEvent.dragEnd(resizeHandle);
}

function toggle() {
  const toggle = document.querySelector('.toggle');

  fireEvent.click(toggle);
}