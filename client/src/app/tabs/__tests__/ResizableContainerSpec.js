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

import ResizableContainer from '../ResizableContainer';

import { mount } from 'enzyme';

import { omit } from 'min-dash';

const { spy } = sinon;

const LAYOUT_PROP = 'my-panel';

const MIN_WIDTH = 200;

const MIN_HEIGHT = 200;

const DEFAULT_LAYOUT = {
  open: false,
  height: MIN_HEIGHT,
  width: MIN_WIDTH,
};

const POSITION = 'right';


describe('<ResizableContainer>', function() {

  it('should render', function() {

    // given
    const { wrapper } = createContainer();

    // then
    expect(wrapper).to.exist;

    // clean
    wrapper.unmount();
  });


  describe('position=right', function() {

    it('should resize', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          width: 500
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

      instance.handleContainerResize(null, { x: -50 });

      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: true,
          width: 550,
          fullWidth: false
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should close when resized to smaller than minimum size', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          width: 500
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

      instance.handleContainerResize(null, { x: 400 });

      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: false,
          width: 500,
          fullWidth: false
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should resize to full width when larger than maximum size', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          width: 500
        }
      };

      global.innerWidth = 1000;

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

      instance.handleContainerResize(null, { x: -1000 });

      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: true,
          width: 1000,
          fullWidth: true
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should open to min width after dragging at least 40 px to open', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: false,
          width: 0
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));
      instance.handleContainerResize(null, { x: -50 });
      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: true,
          width: MIN_WIDTH,
          fullWidth: false
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should close to max width after dragging at least 40 px', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          width: 1000,
          fullWidth: true
        }
      };

      global.innerWidth = 1000;

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));
      instance.handleContainerResize(null, { x: 50 });
      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: true,
          width: 1000 * 0.8,
          fullWidth: false
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should toggle (open)', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: false,
          width: 500
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleToggle();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({ [LAYOUT_PROP]: { open: true, width: 500 } });

      // clean
      wrapper.unmount();
    });


    it('should toggle (close)', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          width: 500
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleToggle();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({ [LAYOUT_PROP]: { open: false, width: 500 } });

      // clean
      wrapper.unmount();
    });


    it('should have default width', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: false
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleToggle();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: { open: true, width: MIN_WIDTH }
      });

      // clean
      wrapper.unmount();
    });

  });


  describe('position=bottom', function() {

    it('should resize', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          height: 300
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy,
        position: 'bottom'
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

      instance.handleContainerResize(null, { y: -50 });

      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: true,
          height: 350,
          fullHeight: false
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should close when resized to smaller than minimum size', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          height: 300,
          open: true
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy,
        position: 'bottom'
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

      instance.handleContainerResize(null, { y: 200 });

      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: false,
          height: 300,
          fullHeight: false
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should resize to full width when larger than maximum size', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          height: 500
        }
      };

      global.innerHeight = 1000;

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy,
        position: 'bottom'
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

      instance.handleContainerResize(null, { y: -1000 });

      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: true,
          height: 940, // 60px compensate for status + tab bar
          fullHeight: true
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should open to min height after dragging at least 40 px to open', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: false,
          height: 0
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy,
        position: 'bottom'
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));
      instance.handleContainerResize(null, { y: -50 });
      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: true,
          height: MIN_HEIGHT,
          fullHeight: false
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should open to max height after dragging at least 40 px', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          height: 1000,
          fullHeight: true
        }
      };

      global.innerHeight = 1000;

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy,
        position: 'bottom'
      });

      // when
      instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));
      instance.handleContainerResize(null, { y: 50 });
      instance.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: {
          open: true,
          height: 1000 * 0.8,
          fullHeight: false
        }
      });

      // clean
      wrapper.unmount();
    });


    it('should toggle (open)', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: false,
          height: 300
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy,
        position: 'bottom'
      });

      // when
      instance.handleToggle();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({ [LAYOUT_PROP]: { open: true, height: 300 } });

      // clean
      wrapper.unmount();
    });


    it('should toggle (close)', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: true,
          height: 300
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy,
        position: 'bottom'
      });

      // when
      instance.handleToggle();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({ [LAYOUT_PROP]: { open: false, height: 300 } });

      // clean
      wrapper.unmount();
    });


    it('should have default height', function() {

      // given
      const layout = {
        [LAYOUT_PROP]: {
          open: false
        }
      };

      const onLayoutChangedSpy = spy();

      const {
        instance,
        wrapper
      } = createContainer({
        layout,
        onLayoutChanged: onLayoutChangedSpy,
        position: 'bottom'
      });

      // when
      instance.handleToggle();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        [LAYOUT_PROP]: { open: true, height: MIN_HEIGHT }
      });

      // clean
      wrapper.unmount();
    });

  });

});



// helpers //////////

function createContainer(props = {}, mountFn = mount) {
  props = {
    defaultLayout: getDefaultLayout(props.position),
    layout: {},
    layoutProp: LAYOUT_PROP,
    minHeight: MIN_HEIGHT,
    minWidth: MIN_WIDTH,
    position: POSITION,
    ...props
  };

  const wrapper = mountFn(<ResizableContainer { ...props } />);

  const instance = wrapper.find('ResizableContainer').first().instance();

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

function getDefaultLayout(position) {
  const layout = {
    ...DEFAULT_LAYOUT
  };

  return omit(layout, [ position === 'bottom' ? 'width' : 'height' ]);
}
