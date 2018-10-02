import React from 'react';

import {
  shallow,
  mount
} from 'enzyme';

import Log from '../Log';

/* global sinon */
const { spy } = sinon;


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
      const entries = tree.find('.entries');

      // then
      expect(entries.text()).to.eql('HE  [warning]HO  [error] ');
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

      instance.setState({
        focussed: true
      });

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

      instance.setState({
        focussed: true
      });

      // when
      const button = tree.find('.copy-button');

      // then
      button.simulate('click');
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

      instance.setState({
        focussed: true
      });

      // when
      const button = tree.find('.clear-button');

      button.simulate('click');

      // then
      expect(onToggle).to.have.been.calledOnce;
      expect(onClear).to.have.been.calledOnce;
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