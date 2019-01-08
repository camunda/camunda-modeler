/* global sinon */

import React from 'react';

import PropertiesContainer from '../PropertiesContainer';

import { mount } from 'enzyme';

/* global sinon */
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


  it('should handle resize', function() {
    // given
    const layout = {
      propertiesPanel: {
        open: true,
        width: 100
      }
    };
    const onLayoutChangedSpy = spy();

    const {
      wrapper,
      instance
    } = createPropertiesContainer({
      layout,
      onLayoutChanged: onLayoutChangedSpy
    });

    instance.originalWidth = layout.propertiesPanel.width;

    // when
    instance.handleResize(null, { x: -10 });

    // then
    expect(onLayoutChangedSpy).to.be.calledWith({ propertiesPanel: { open: true, width: 110 } });

    // clean
    wrapper.unmount();
  });


  it('should ignore delta x = 0', function() {
    // given
    const layout = {
      propertiesPanel: {
        open: true,
        width: 100
      }
    };
    const onLayoutChangedSpy = spy();

    const {
      wrapper,
      instance
    } = createPropertiesContainer({
      layout,
      onLayoutChanged: onLayoutChangedSpy
    });

    instance.originalWidth = layout.propertiesPanel.width;

    // when
    instance.handleResize(null, { x: 0 });

    // then
    expect(onLayoutChangedSpy).to.not.be.called;

    // clean
    wrapper.unmount();
  });
});



// helper /////
function createPropertiesContainer(props = {}, mountFn = mount) {
  const componentProps = {
    layout: {
      propertiesPanel: {
        open: true,
        width: 100
      }
    },
    ...props,
  };

  const wrapper = mountFn(<PropertiesContainer { ...componentProps } />);
  const instance = wrapper.find('PropertiesContainerWrapped').first().instance();

  return {
    wrapper,
    instance
  };
}