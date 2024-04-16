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

import { render } from '@testing-library/react';

import MochaTestContainer from 'mocha-test-container-support';

import EmptyTab from '../EmptyTab';

import Flags, { DISABLE_DMN, DISABLE_FORM, DISABLE_ZEEBE, DISABLE_PLATFORM } from '../../util/Flags';

/* global sinon */


describe('<EmptyTab>', function() {

  let container;

  beforeEach(function() {
    container = MochaTestContainer.get(this);
  });

  describe('dispatching action', function() {

    it('should dispatch create-* actions', function() {

      // given
      const onAction = sinon.spy();
      const { tree } = createEmptyTab({ onAction });
      const buttons = tree.querySelectorAll('button');

      // when
      buttons.forEach(wrapper => wrapper.click());

      // then
      expect(onAction).to.have.callCount(6);
      expect(onAction.args).to.eql([
        [ 'create-cloud-bpmn-diagram' ],
        [ 'create-cloud-dmn-diagram' ],
        [ 'create-cloud-form' ],
        [ 'create-bpmn-diagram' ],
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
      expect(findWhere(tree,
        wrapper => wrapper.textContent.startsWith('DMN diagram'))).to.be.empty;
    });


    it('should display dmn diagram without flag', function() {

      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(
        findWhere(tree,
          wrapper => wrapper.textContent.startsWith('DMN diagram')
        )
      ).to.have.length(2);
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
        findWhere(tree,
          wrapper => wrapper.textContent.startsWith('Form')
        )
      ).to.be.empty;
    });


    it('should display form without flag', function() {

      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(
        findWhere(tree,
          wrapper => wrapper.textContent.startsWith('Form')
        )
      ).to.have.length(2);
    });

  });


  describe('enable platform', function() {

    afterEach(sinon.restore);

    it('should display platform without flag', function() {

      // when
      const {
        tree
      } = createEmptyTab();

      // then
      expect(find(tree, '.welcome-header')).to.have.length(1);
      expect(find(tree, '.welcome-card')).to.have.length(3);
      expect(
        findWhere(tree,
          wrapper => wrapper.textContent.startsWith('Camunda 7')
        )
      ).not.to.be.empty;
    });


    it('should NOT display platform with flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_PLATFORM).returns(true);

      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(find(tree, '.welcome-header')).to.have.length(0);
      expect(find(tree, '.welcome-card')).to.have.length(2);
      expect(
        findWhere(tree,
          wrapper => wrapper.textContent.startsWith('Camunda 7')
        )
      ).to.be.empty;
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
      expect(find(tree, '.welcome-header')).to.have.length(1);
      expect(find(tree, '.welcome-card')).to.have.length(3);
      expect(
        findWhere(tree,
          wrapper => wrapper.textContent.startsWith('Camunda 8')
        )
      ).not.to.be.empty;
    });


    it('should NOT display zeebe with flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_ZEEBE).returns(true);

      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(find(tree, '.welcome-header')).to.have.length(0);
      expect(find(tree, '.welcome-card')).to.have.length(2);
      expect(
        findWhere(tree,
          wrapper => wrapper.textContent.startsWith('Camunda 8')
        )
      ).to.be.empty;
    });

  });


  function createEmptyTab(options = {}) {
    const result = render(
      <EmptyTab
        onAction={ options.onAction || noop }
        onShown={ options.onShown || noop }
      />, { container }
    );

    return {
      tree: container,
      result
    };
  }
});


// helpers /////////////////////////////////////

function noop() {}

function findWhere(tree, predicate) {
  return Array.from(tree.querySelectorAll('*')).filter(predicate);
}

function find(tree, selector) {
  return Array.from(tree.querySelectorAll(selector));
}
