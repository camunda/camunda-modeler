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
  shallow
} from 'enzyme';

import EmptyTab from '../EmptyTab';

import Flags, { DISABLE_DMN, DISABLE_FORM, DISABLE_ZEEBE } from '../../util/Flags';

/* global sinon */


describe('<EmptyTab>', function() {

  describe('dispatching action', function() {

    it('should dispatch create-* actions', function() {

      // given
      const onAction = sinon.spy();
      const {
        tree
      } = createEmptyTab({ onAction });
      const buttons = tree.find('button');

      // when
      buttons.forEach(wrapper => wrapper.simulate('click'));

      // then
      expect(onAction).to.have.callCount(4);
      expect(onAction.args).to.eql([
        [ 'create-bpmn-diagram' ],
        [ 'create-cloud-bpmn-diagram' ],
        [ 'create-dmn-diagram' ],
        [ 'create-form' ]
      ]);
    });

  });



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
        wrapper => wrapper.text().startsWith('DMN diagram')).first().exists()).to.be.false;
    });


    it('should display dmn diagram without flag', function() {

      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(tree.findWhere(
        wrapper => wrapper.text().startsWith('DMN diagram')).first().exists()).to.be.true;
    });
  });


  describe('disabling form', function() {

    afterEach(sinon.restore);

    it('should NOT display form on flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_FORM).returns(true);

      // when
      const {
        tree
      } = createEmptyTab();

      // then
      expect(
        tree.findWhere(
          wrapper => wrapper.text().startsWith('Form')
        ).first().exists()
      ).to.be.false;
    });


    it('should display form without flag', function() {

      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(
        tree.findWhere(
          wrapper => wrapper.text().startsWith('Form')
        ).first().exists()
      ).to.be.true;
    });

  });


  describe('enable zeebe', function() {

    afterEach(sinon.restore);

    it('should display zeebe without flag', function() {

      // when
      const {
        tree
      } = createEmptyTab();

      // then
      expect(
        tree.findWhere(
          wrapper => wrapper.text().startsWith('BPMN diagram (Camunda Cloud')
        ).first().exists()
      ).to.be.true;
    });


    it('should NOT display zeebe with flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_ZEEBE).returns(true);

      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(
        tree.findWhere(
          wrapper => wrapper.text().startsWith('BPMN diagram (Camunda Cloud')
        ).first().exists()
      ).to.be.false;
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
