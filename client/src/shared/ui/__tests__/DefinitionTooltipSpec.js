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

import React from 'react';

import {
  render,
  fireEvent,
  act
} from '@testing-library/react';

import { DefinitionTooltip } from '../DefinitionTooltip';


describe('<DefinitionTooltip>', function() {

  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
  });

  afterEach(function() {
    clock.restore();
  });


  it('should render children', function() {

    // when
    const { getByText } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    // then
    expect(getByText('Label')).to.exist;
  });


  it('should not show tooltip by default', function() {

    // when
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    // then
    expect(container.querySelector('[role="tooltip"]')).to.be.null;
  });


  it('should show tooltip on focus', function() {

    // given
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    // when
    act(() => {
      fireEvent.focus(wrapper);
    });

    // then
    expect(container.querySelector('[role="tooltip"]')).to.exist;
  });


  it('should show tooltip content', function() {

    // given
    const { container, getByText } = render(
      <DefinitionTooltip definition={ <p>My definition</p> }>
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    // when
    act(() => {
      fireEvent.focus(wrapper);
    });

    // then
    expect(getByText('My definition')).to.exist;
  });


  it('should show tooltip on mouse enter after delay', function() {

    // given
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    // when
    act(() => {
      fireEvent.mouseEnter(wrapper);
    });

    // then - not visible yet
    expect(container.querySelector('[role="tooltip"]')).to.be.null;

    // when - advance past show delay
    act(() => {
      clock.tick(300);
    });

    // then
    expect(container.querySelector('[role="tooltip"]')).to.exist;
  });


  it('should hide tooltip on Escape', function() {

    // given
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    act(() => {
      fireEvent.focus(wrapper);
    });

    expect(container.querySelector('[role="tooltip"]')).to.exist;

    // when
    act(() => {
      fireEvent.keyDown(wrapper, { key: 'Escape' });
    });

    // then
    expect(container.querySelector('[role="tooltip"]')).to.be.null;
  });


  it('should hide tooltip on blur', function() {

    // given
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    act(() => {
      fireEvent.focus(wrapper);
    });

    expect(container.querySelector('[role="tooltip"]')).to.exist;

    // when
    act(() => {
      fireEvent.blur(wrapper, { relatedTarget: document.body });
    });

    // then
    expect(container.querySelector('[role="tooltip"]')).to.be.null;
  });


  it('should hide tooltip on click outside', function() {

    // given
    const { container } = render(
      <div>
        <DefinitionTooltip definition="Tooltip content">
          Label
        </DefinitionTooltip>
        <button>Outside</button>
      </div>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    act(() => {
      fireEvent.focus(wrapper);
    });

    expect(container.querySelector('[role="tooltip"]')).to.exist;

    // when
    act(() => {
      fireEvent.mouseDown(container.querySelector('button'));
    });

    // then
    expect(container.querySelector('[role="tooltip"]')).to.be.null;
  });


  it('should apply direction class', function() {

    // given
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content" direction="left">
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    // when
    act(() => {
      fireEvent.focus(wrapper);
    });

    // then
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip.classList.contains('left')).to.be.true;
  });


  it('should apply default direction class', function() {

    // given
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    // when
    act(() => {
      fireEvent.focus(wrapper);
    });

    // then
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip.classList.contains('right')).to.be.true;
  });


  it('should hide tooltip on mouse leave after delay', function() {

    // given
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    act(() => {
      fireEvent.focus(wrapper);
    });

    expect(container.querySelector('[role="tooltip"]')).to.exist;

    // when
    act(() => {
      fireEvent.mouseLeave(wrapper, { relatedTarget: document.body });
    });

    // then - still visible during delay
    expect(container.querySelector('[role="tooltip"]')).to.exist;

    // when - advance past hide delay
    act(() => {
      clock.tick(300);
    });

    // then
    expect(container.querySelector('[role="tooltip"]')).to.be.null;
  });


  it('should cancel show on mouse leave before delay', function() {

    // given
    const { container } = render(
      <DefinitionTooltip definition="Tooltip content">
        Label
      </DefinitionTooltip>
    );

    const wrapper = container.querySelector('.bio-properties-panel-tooltip-wrapper');

    // when - enter then leave before show delay
    act(() => {
      fireEvent.mouseEnter(wrapper);
    });

    act(() => {
      fireEvent.mouseLeave(wrapper, { relatedTarget: document.body });
    });

    act(() => {
      clock.tick(300);
    });

    // then
    expect(container.querySelector('[role="tooltip"]')).to.be.null;
  });

});
