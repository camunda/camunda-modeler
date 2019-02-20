/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import {
  shallow
} from 'enzyme';

import EmptyTab from '../EmptyTab';

import Flags, { DISABLE_CMMN, DISABLE_DMN } from '../../util/Flags';

/* global sinon */


describe('<EmptyTab>', function() {

  describe('disabling dmn', function() {

    afterEach(sinon.restore);

    it('should NOT display dmn diagram on flag', function() {
      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_DMN).returns(true);

      // when
      const {
        tree
      } = createEmptyTab();

      // then
      expect(tree.findWhere(
        wrapper => wrapper.text() === 'DMN diagram').first().exists()).to.be.false;
    });


    it('should display dmn diagram without flag', function() {
      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(tree.findWhere(
        wrapper => wrapper.text() === 'DMN diagram').first().exists()).to.be.true;
    });
  });


  describe('disabling cmmn', function() {

    afterEach(sinon.restore);

    it('should NOT display cmmn diagram on flag', function() {
      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_CMMN).returns(true);

      // when
      const {
        tree
      } = createEmptyTab();

      // then
      expect(tree.findWhere(
        wrapper => wrapper.text() === 'CMMN diagram').first().exists()).to.be.false;
    });


    it('should display cmmn diagram without flag', function() {
      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(tree.findWhere(
        wrapper => wrapper.text() === 'CMMN diagram').first().exists()).to.be.true;
    });
  });

});


// helpers /////////////////////////////////////

function noop() {}

function createEmptyTab(options = {}, mountFn=shallow) {

  if (typeof options === 'function') {
    mountFn = options;
    options = {};
  }

  const tree = mountFn(
    <EmptyTab
      onAction={ options.onAction || noop }
      onShown={ options.onShown || noop }
    />
  );

  const instance = tree.instance();

  return {
    tree,
    instance
  };

}