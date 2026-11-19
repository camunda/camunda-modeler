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

import CanvasHoverFocusFix from '../CanvasHoverFocusFix';

const spy = sinon.spy;


describe('CanvasHoverFocusFix', function() {

  let canvas;
  let restoreFocus;
  let getSelectionStub;

  beforeEach(function() {
    restoreFocus = spy();

    canvas = {
      restoreFocus
    };

    getSelectionStub = sinon.stub(document, 'getSelection');

    new CanvasHoverFocusFix(canvas);
  });

  afterEach(function() {
    getSelectionStub.restore();
  });


  it('should restore focus when there is no selection', function() {

    // given
    getSelectionStub.returns({
      isCollapsed: true,
      toString: () => ''
    });

    // when
    canvas.restoreFocus();

    // then
    expect(restoreFocus).to.have.been.called;
  });


  it('should restore focus when the selection is collapsed', function() {

    // given
    getSelectionStub.returns({
      isCollapsed: true,
      toString: () => 'text'
    });

    // when
    canvas.restoreFocus();

    // then
    expect(restoreFocus).to.have.been.called;
  });


  it('should restore focus when the selection is empty', function() {

    // given
    getSelectionStub.returns({
      isCollapsed: false,
      toString: () => ''
    });

    // when
    canvas.restoreFocus();

    // then
    expect(restoreFocus).to.have.been.called;
  });


  it('should NOT restore focus when a non-collapsed selection exists', function() {

    // given
    getSelectionStub.returns({
      isCollapsed: false,
      toString: () => 'user selected text'
    });

    // when
    canvas.restoreFocus();

    // then
    expect(restoreFocus).not.to.have.been.called;
  });


  it('should restore focus when getSelection is unavailable', function() {

    // given
    getSelectionStub.returns(null);

    // when
    canvas.restoreFocus();

    // then
    expect(restoreFocus).to.have.been.called;
  });

});
