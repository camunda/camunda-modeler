import React from 'react';

import {
  shallow,
  mount
} from 'enzyme';

import Log from '../Log';

/* global sinon */
const { spy, fake } = sinon;


describe('<Log>', function() {

  describe('entries', function() {

    it('should hide, if collapsed', function() {

      // given
      const {
        tree
      } = createLog({
        expanded: false,
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
        expanded: true,
        entries: [
          { category: 'warning', message: 'HE' },
          { category: 'error', message: 'HO' },
          {}
        ]
      }, mount);

      // when
      const entry = tree.find('.entry');

      // then
      expect(entry.at(0).text()).to.eql('HE  [warning]');
      expect(entry.at(1).text()).to.eql('HO  [error]');
      expect(entry.at(2).text()).to.eql(' ');
    });

  });


  describe('focus / hover', function() {

    it('should update state', function() {

      // given
      const {
        instance
      } = createLog({
        expanded: true
      });

      // when
      instance.handleFocus();

      // then
      expect(instance.state.focus).to.be.true;

      // when
      instance.handleBlur();

      // then
      expect(instance.state.focus).to.be.false;

      // when
      instance.handleHover();

      // then
      expect(instance.state.hover).to.be.true;

      // when
      instance.handleOut();

      // then
      expect(instance.state.hover).to.be.false;
    });

  });


  describe('scroll handling', function() {

    it('should check without entries', function() {

      // given
      const {
        instance
      } = createLog({
        expanded: true,
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
        expanded: true,
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

    it('log toggle', function() {

      const onToggle = spy((expanded) => {
        expect(expanded).to.be.false;
      });

      // given
      const {
        instance,
        tree
      } = createLog({
        expanded: true,
        onToggle
      }, mount);

      instance.handleFocus();

      // when
      const button = tree.find('.toggle-button');

      button.simulate('click');

      // then
      expect(onToggle).to.have.been.calledOnce;
    });


    it('log copy', function() {

      // given
      const {
        instance,
        tree
      } = createLog({
        expanded: true
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


    it('log clear', function() {

      const onToggle = spy((expanded) => {
        expect(expanded).to.be.false;
      });

      const onClear = spy();


      // given
      const {
        instance,
        tree
      } = createLog({
        expanded: true,
        onToggle,
        onClear
      }, mount);

      instance.handleFocus();

      // when
      const button = tree.find('.clear-button');

      button.simulate('click');

      // then
      expect(onToggle).to.have.been.calledOnce;
      expect(onClear).to.have.been.calledOnce;
    });

  });


  describe('keyboard shortcuts', function() {

    it('should close on <ESC>', function() {

      // given
      const onToggle = spy((expanded) => {
        expect(expanded).to.be.false;
      });

      const {
        instance
      } = createLog({
        expanded: true,
        onToggle
      });

      // when
      instance.handleKeyDown({
        keyCode: 27,
        preventDefault: fake()
      });

      // then
      expect(onToggle).to.have.been.calledOnce;
    });


    it('should select all on <CTRL + A>', function() {

      // given
      const {
        instance
      } = createLog({
        expanded: true
      }, mount);

      const handleCopy = spy(instance, 'handleCopy');

      // when
      //
      instance.handleKeyDown({
        keyCode: 65,
        ctrlKey: true,
        preventDefault: fake()
      });

      // then
      expect(handleCopy).to.have.been.calledOnce;
    });

  });


  describe('resize', function() {

    it('should handle resize', function() {
      // given
      const {
        instance
      } = createLog();

      instance.originalHeight = 100;

      // when
      instance.handleResize(null, { y: -10 });

      // then
      expect(instance.state.height).to.eql(110);
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

function createLog(options = {}, mountFn=shallow) {

  if (typeof options === 'function') {
    mountFn = options;
    options = {};
  }

  const tree = mountFn(
    <Log
      entries={ options.entries || [] }
      expanded={ options.expanded || false }
      onToggle={ options.onToggle || noop }
      onClear={ options.onClear || noop }
    />
  );

  const instance = tree.instance();

  return {
    tree,
    instance
  };

}