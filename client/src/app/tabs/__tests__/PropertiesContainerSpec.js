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

import PropertiesContainer, {
  DEFAULT_LAYOUT,
  MAX_WIDTH
} from '../PropertiesContainer';

import { mount } from 'enzyme';

const { spy } = sinon;


describe('<PropertiesContainer>', function() {

  it('should render', function() {

    // given
    const { wrapper } = createPropertiesContainer();

    // then
    expect(wrapper).to.exist;

    // clean
    wrapper.unmount();
  });


  it('should resize', function() {

    // given
    const layout = {
      propertiesPanel: {
        open: true,
        width: 500
      }
    };

    const onLayoutChangedSpy = spy();

    const {
      instance,
      wrapper
    } = createPropertiesContainer({
      layout,
      onLayoutChanged: onLayoutChangedSpy
    });

    // when
    instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

    instance.handleResize(null, { x: -50 });

    instance.handleResizeEnd();

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({ propertiesPanel: { open: true, width: 550 } });

    // clean
    wrapper.unmount();
  });


  it('should close when resized to smaller than minimum size', function() {

    // given
    const layout = {
      propertiesPanel: {
        open: true,
        width: 500
      }
    };

    const onLayoutChangedSpy = spy();

    const {
      instance,
      wrapper
    } = createPropertiesContainer({
      layout,
      onLayoutChanged: onLayoutChangedSpy
    });

    // when
    instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

    instance.handleResize(null, { x: 400 });

    instance.handleResizeEnd();

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({
      propertiesPanel: {
        open: false,
        width: DEFAULT_LAYOUT.width
      }
    });

    // clean
    wrapper.unmount();
  });


  it('should not resize to larger than maximum size', function() {

    // given
    const layout = {
      propertiesPanel: {
        open: true,
        width: 500
      }
    };

    const onLayoutChangedSpy = spy();

    const {
      instance,
      wrapper
    } = createPropertiesContainer({
      layout,
      onLayoutChanged: onLayoutChangedSpy
    });

    // when
    instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

    instance.handleResize(null, { x: -400 });

    instance.handleResizeEnd();

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({
      propertiesPanel: {
        open: true,
        width: MAX_WIDTH
      }
    });

    // clean
    wrapper.unmount();
  });


  it('should toggle', function() {

    // given
    const layout = {
      propertiesPanel: {
        open: true,
        width: 500
      }
    };

    const onLayoutChangedSpy = spy();

    const {
      instance,
      wrapper
    } = createPropertiesContainer({
      layout,
      onLayoutChanged: onLayoutChangedSpy
    });

    // when
    instance.handleToggle();

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({ propertiesPanel: { open: false, width: 500 } });

    // clean
    wrapper.unmount();
  });

});


// helpers //////////

function createPropertiesContainer(props = {}, mountFn = mount) {
  props = {
    layout: {
      propertiesPanel: {
        open: true,
        width: 350
      }
    },
    ...props,
  };

  const wrapper = mountFn(<PropertiesContainer { ...props } />);

  const instance = wrapper.find('PropertiesContainerWrapped').first().instance();

  return {
    instance,
    wrapper
  };
}

// helpers //////////

function createMouseEvent(type, clientX, clientY) {
  const event = document.createEvent('MouseEvent');

  if (event.initMouseEvent) {
    event.initMouseEvent(
      type, true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  }

  return event;
}