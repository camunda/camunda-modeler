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

import { isFunction } from 'min-dash';

import {
  mount,
  shallow
} from 'enzyme';

import Log, {
  DEFAULT_LAYOUT,
  KEYCODE_ESCAPE,
  MAX_HEIGHT
} from '../Log';

const { spy } = sinon;

const LOG_OPEN_LAYOUT = {
  log: {
    height: 300,
    open: true
  }
};


describe('<Log>', function() {

  describe('entries', function() {

    it('should hide if not open', function() {

      // given
      const { wrapper } = createLog({
        entries: [
          { category: 'warning', message: 'foo' },
          { category: 'error', message: 'bar' }
        ]
      });

      // when
      const entries = wrapper.find('.entries');

      // then
      expect(entries).to.be.empty;
    });


    it('should show if open', function() {

      // given
      const { wrapper } = createLog({
        entries: [
          { category: 'warning', message: 'foo' },
          { category: 'error', message: 'bar' }
        ],
        layout: LOG_OPEN_LAYOUT
      }, mount);

      // when
      const entries = wrapper.find('.entry');

      // then
      expect(entries.at(0).text()).to.eql('foo [ warning ]');
      expect(entries.at(1).text()).to.eql('bar [ error ]');
    });


    it('should show clickable action', function() {

      // given
      const actionSpy = spy();

      const { wrapper } = createLog({
        entries: [
          { category: 'warning', message: 'foo', action: actionSpy }
        ],
        layout: LOG_OPEN_LAYOUT
      }, mount);

      const action = wrapper.find('.action').at(0);

      // when
      action.simulate('click');

      // then
      expect(actionSpy).to.have.been.called;
    });

  });


  describe('scroll into view', function() {

    it('should not throw error when no entries', function() {

      // given
      const { instance } = createLog({
        entries: [],
        layout: LOG_OPEN_LAYOUT
      }, mount);

      // when
      expect(() => instance.checkFocus()).not.to.throw();
    });


    it('should scroll last entry into view', function() {

      // given
      const { instance } = createLog({
        entries: [
          { category: 'warning', message: 'foo' },
          { category: 'error', message: 'bar' },
          {}
        ],
        layout: LOG_OPEN_LAYOUT
      }, mount);

      // when
      expect(() => instance.checkFocus()).not.to.throw();
    });

  });


  describe('controls', function() {

    it('should copy log', function() {

      // given
      const {
        instance,
        wrapper
      } = createLog({
        layout: LOG_OPEN_LAYOUT
      }, mount);

      const handleCopySpy = spy(instance, 'handleCopy');

      const getSelectionSpy = spy(window, 'getSelection');

      instance.setState({
        focussed: true
      });

      // when
      const button = wrapper.find('.copy-button');

      button.simulate('click');

      // then
      expect(handleCopySpy).to.have.been.calledOnce;
      expect(getSelectionSpy).to.have.been.calledOnce;
    });


    it('should clear log', function() {

      // given
      const onClearSpy = spy();

      const { wrapper } = createLog({
        layout: LOG_OPEN_LAYOUT,
        onClear: onClearSpy
      }, mount);

      // when
      const button = wrapper.find('.clear-button');

      button.simulate('click');

      // then
      expect(onClearSpy).to.have.been.calledOnce;
    });

  });


  describe('keyboard', function() {

    it('should close on <ESC>', function() {

      // given
      const onLayoutChanged = spy();

      const {
        instance
      } = createLog({
        layout: LOG_OPEN_LAYOUT,
        onLayoutChanged
      });

      // when
      instance.handleKeyDown({
        keyCode: KEYCODE_ESCAPE,
        preventDefault: noop
      });

      // then
      expect(onLayoutChanged).to.have.been.calledOnceWithExactly({
        log: {
          height: 300,
          open: false
        }
      });
    });

  });


  describe('focus', function() {

    it('should update edit menu on focus', async function() {

      // given
      const onUpdateMenuSpy = spy();

      const {
        wrapper
      } = createLog({
        layout: LOG_OPEN_LAYOUT,
        onUpdateMenu: onUpdateMenuSpy
      }, mount);

      // when
      wrapper.find('.entries').simulate('focus');

      // then
      expect(onUpdateMenuSpy).to.be.calledOnceWithExactly({
        editMenu: [
          [
            { enabled: false, role: 'undo' },
            { enabled: false, role: 'redo' }
          ],
          [
            { enabled: false, role: 'copy' },
            { enabled: false, role: 'cut' },
            { enabled: false, role: 'paste' },
            { enabled: true, role: 'selectAll' }
          ]
        ]
      });
    });

  });


  describe('layout', function() {

    it('should toggle log', function() {

      // given
      const onLayoutChangedSpy = spy();

      const { wrapper } = createLog({
        layout: LOG_OPEN_LAYOUT,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      const button = wrapper.find('.toggle-button');

      button.simulate('click');

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnceWithExactly({
        log: {
          height: 300,
          open: false
        }
      });
    });


    it('should have default width', function() {

      // given
      const onLayoutChangedSpy = spy();

      const { instance } = createLog({
        layout: {
          log: {
            open: false
          }
        },
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.handleToggle();

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnceWithExactly({
        log: {
          height: 130,
          open: true
        }
      });
    });


    describe('resize', function() {

      it('should resize', function() {

        // given
        const onLayoutChangedSpy = spy();

        const {
          instance,
          wrapper
        } = createLog({
          layout: LOG_OPEN_LAYOUT,
          onLayoutChanged: onLayoutChangedSpy
        });

        // when
        instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

        instance.handleResize(null, { y: 50 });

        instance.handleResizeEnd();

        // then
        expect(onLayoutChangedSpy).to.be.calledOnceWithExactly({
          log: {
            height: 250,
            open: true
          }
        });

        // clean
        wrapper.unmount();
      });


      it('should close when resized to smaller than minimum size', function() {

        // given
        const onLayoutChangedSpy = spy();

        const {
          instance,
          wrapper
        } = createLog({
          layout: LOG_OPEN_LAYOUT,
          onLayoutChanged: onLayoutChangedSpy
        });

        // when
        instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

        instance.handleResize(null, { y: 400 });

        instance.handleResizeEnd();

        // then
        expect(onLayoutChangedSpy).to.be.calledOnceWithExactly({
          log: {
            height: DEFAULT_LAYOUT.height,
            open: false
          }
        });

        // clean
        wrapper.unmount();
      });


      it('should not resize to larger than maximum size', function() {

        // given
        const onLayoutChangedSpy = spy();

        const {
          instance,
          wrapper
        } = createLog({
          layout: LOG_OPEN_LAYOUT,
          onLayoutChanged: onLayoutChangedSpy
        });

        // when
        instance.handleResizeStart(createMouseEvent('dragstart', 0, 0));

        instance.handleResize(null, { y: -400 });

        instance.handleResizeEnd();

        // then
        expect(onLayoutChangedSpy).to.be.calledOnceWithExactly({
          log: {
            height: MAX_HEIGHT,
            open: true
          }
        });

        // clean
        wrapper.unmount();
      });

    });

  });


});


// helpers //////////

function noop() {}

function createLog(props = {}, mountFn = shallow) {
  if (isFunction(props)) {
    mountFn = props;

    props = {};
  }

  const {
    entries,
    layout = DEFAULT_LAYOUT,
    onClear = noop,
    onLayoutChanged = noop,
    onUpdateMenu = noop
  } = props;

  props = {
    entries,
    layout,
    onClear,
    onLayoutChanged,
    onUpdateMenu
  };

  const wrapper = mountFn(<Log { ...props } />);

  const instance = wrapper.instance();

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