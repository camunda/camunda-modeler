/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import {
  shallow,
  mount
} from 'enzyme';

import Log from '../Log';

const DEFAULT_LAYOUT = {
  height: 130,
  open: false
};

/* global sinon */
const { spy } = sinon;


describe('<Log>', function() {

  describe('entries', function() {

    it('should hide, if collapsed', function() {

      // given
      const {
        tree
      } = createLog({
        open: false,
        entries: [
          { category: 'warning', message: 'HE' },
          { category: 'error', message: 'HO' },
          {}
        ]
      });

      // when
      const entries = tree.find('.entries');

      // then
      expect(entries).to.be.empty;
    });


    it('should show, if expanded', function() {

      // given
      const {
        tree
      } = createLog({
        open: true,
        entries: [
          { category: 'warning', message: 'HE' },
          { category: 'error', message: 'HO' },
          {}
        ]
      }, mount);

      // when
      const entry = tree.find('.entry');

      // then
      expect(entry.at(0).text()).to.eql('HE [ warning ]');
      expect(entry.at(1).text()).to.eql('HO [ error ]');
      expect(entry.at(2).text()).to.eql(' ');
    });


    it('should show clickable action', function() {

      // given
      const actionSpy = spy();

      const {
        tree
      } = createLog({
        open: true,
        entries: [
          { category: 'warning', message: 'HE', action: actionSpy }
        ]
      }, mount);

      const entry = tree.find('.action').at(0);

      // when
      entry.simulate('click');

      // then
      expect(actionSpy).to.have.been.called;
    });

  });


  describe('scroll handling', function() {

    it('should check without entries', function() {

      // given
      const {
        instance
      } = createLog({
        open: true,
        entries: []
      }, mount);

      // when
      instance.checkFocus();

      // then
      // no error threw :o)
    });


    it('should focus last entry', function() {

      // given
      const {
        instance
      } = createLog({
        open: true,
        entries: [
          { category: 'warning', message: 'HE' },
          { category: 'error', message: 'HO' },
          {}
        ]
      }, mount);

      // when
      instance.checkFocus();

      // then
      // no error threw :o)
    });

  });


  describe('controls', function() {

    it('should toggle log', function() {

      const onLayoutChanged = spy(({ log }) => {
        expect(log.open).to.be.false;
      });

      // given
      const {
        tree
      } = createLog({
        open: true,
        onLayoutChanged
      }, mount);

      // when
      const button = tree.find('.toggle-button');

      button.simulate('click');

      // then
      expect(onLayoutChanged).to.have.been.calledOnce;
    });


    it('log copy', function() {

      // given
      const {
        instance,
        tree
      } = createLog({
        open: true
      }, mount);

      const handleCopy = spy(instance, 'handleCopy');

      const handleWindowSelection = spy(window, 'getSelection');

      instance.setState({
        focussed: true
      });

      // when
      const button = tree.find('.copy-button');

      button.simulate('click');

      // then
      expect(handleCopy).to.have.been.calledOnce;
      expect(handleWindowSelection).to.have.been.called;
    });


    it('should clear log', function() {

      // given
      const onClear = spy();

      const {
        tree
      } = createLog({
        open: true,
        onClear
      }, mount);

      // when
      const button = tree.find('.clear-button');

      button.simulate('click');

      // then
      expect(onClear).to.have.been.calledOnce;
    });

  });


  describe('keyboard shortcuts', function() {

    it('should close on <ESC>', function() {

      // given
      const onLayoutChanged = spy(({ log }) => {
        expect(log.open).to.be.false;
      });

      const {
        instance
      } = createLog({
        open: true,
        onLayoutChanged
      });

      // when
      instance.handleKeyDown({
        keyCode: 27,
        preventDefault: noop
      });

      // then
      expect(onLayoutChanged).to.have.been.calledOnce;
    });


    it('should select all on <CTRL + A>', function() {

      // given
      const {
        instance
      } = createLog({
        open: true
      }, mount);

      const handleCopy = spy(instance, 'handleCopy');

      // when
      instance.handleKeyDown({
        keyCode: 65,
        ctrlKey: true,
        preventDefault: noop
      });

      // then
      expect(handleCopy).to.have.been.calledOnce;
    });


    it('should update edit menu', async function() {

      // given
      const onUpdateMenu = spy();

      const {
        tree
      } = createLog({
        open: true,
        onUpdateMenu
      }, mount);

      // when
      tree.find('.entries').simulate('focus');

      // then
      expect(onUpdateMenu).to.be.calledOnceWithExactly({
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


    /**
     * @pinussilvestrus :
     * Currently not possible to test systems clipboard content
     */
    it('select selected text on <CTRL+C>');

  });


  describe('resize', function() {

    it('should handle resize', function() {

      // given
      const onLayoutChanged = spy();

      const {
        instance
      } = createLog({ onLayoutChanged });

      instance.originalHeight = 100;

      // when
      instance.handleResize(null, { y: -10 });

      // then
      expect(onLayoutChanged).to.be.calledOnceWithExactly({
        log: {
          open: true,
          height: 110
        }
      });
    });


    it('should ignore delta y = 0', function() {

      // given
      const {
        instance
      } = createLog();

      const originalState = instance.state;

      // when
      instance.handleResize(null, { y: 0 });

      // then
      expect(instance.state).to.eql(originalState);
    });

  });


});


// helpers /////////////////////////////////////

function noop() {}

function createLog(options = {}, mountFn = shallow) {

  if (typeof options === 'function') {
    mountFn = options;
    options = {};
  }

  const layout = options.layout || DEFAULT_LAYOUT;

  layout.open = !!options.open;

  const tree = mountFn(
    <Log
      entries={ options.entries || [] }
      layout={ layout }
      onClear={ options.onClear || noop }
      onLayoutChanged={ options.onLayoutChanged || noop }
      onUpdateMenu={ options.onUpdateMenu || noop }
    />
  );

  const instance = tree.instance();

  return {
    tree,
    instance
  };

}