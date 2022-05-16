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

import PropertiesContainer from '../PropertiesContainer';

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


  it('should update layout on resize', function() {

    // given
    const onLayoutChangedSpy = spy();

    const layout = {
      propertiesPanel: {
        open: true,
        width: 300
      }
    };

    const { wrapper } = createPropertiesContainer({
      layout,
      onLayoutChanged: onLayoutChangedSpy
    });

    const resizableContainer = wrapper.find('ResizableContainer').first().instance();

    // when
    resizableContainer.handleResizeStart(createMouseEvent('dragstart', 0, 0));

    resizableContainer.handleContainerResize(null, { x: -50 });

    resizableContainer.handleResizeEnd();

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({
      propertiesPanel: {
        open: true,
        width: 350,
        fullWidth: false
      }
    });
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

function createMouseEvent(type, clientX, clientY) {
  const event = document.createEvent('MouseEvent');

  if (event.initMouseEvent) {
    event.initMouseEvent(
      type, true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  }

  return event;
}
