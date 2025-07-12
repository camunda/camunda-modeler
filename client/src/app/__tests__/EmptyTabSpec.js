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

import { render, screen } from '@testing-library/react';

import EmptyTab from '../EmptyTab';
import TabsProvider from '../TabsProvider';

import Flags, { DISABLE_DMN, DISABLE_FORM, DISABLE_ZEEBE, DISABLE_PLATFORM } from '../../util/Flags';

/* global sinon */

describe('<EmptyTab>', function() {

  describe('dispatching action', function() {

    it('should dispatch create-* actions', function() {

      // given
      const onAction = sinon.spy();

      createEmptyTab({ onAction });

      const buttons = screen.getAllByRole('button');

      // when
      buttons.forEach(btn => btn.click());

      // then
      expect(onAction).to.have.callCount(7);
      expect(onAction.args).to.eql([
        [ 'create-cloud-bpmn-diagram', undefined ],
        [ 'create-cloud-dmn-diagram', undefined ],
        [ 'create-cloud-form', undefined ],
        [ 'create-diagram', { type: 'rpa' } ],
        [ 'create-bpmn-diagram', undefined ],
        [ 'create-dmn-diagram', undefined ],
        [ 'create-form', undefined ]
      ]);
    });

  });


  describe('disabling dmn', function() {

    afterEach(sinon.restore);

    it('should NOT display dmn diagram on flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_DMN).returns(true);

      // when
      createEmptyTab();

      // then
      expect(screen.queryAllByText('DMN diagram')).to.be.empty;
    });


    it('should display dmn diagram without flag', function() {

      // given
      createEmptyTab();

      // then
      expect(screen.queryAllByText('DMN diagram')).to.have.length(2);
    });
  });


  describe('disabling form', function() {

    afterEach(sinon.restore);

    it('should NOT display form on flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_FORM).returns(true);

      // when
      createEmptyTab();

      // then
      expect(screen.queryAllByText('Form')).to.be.empty;
    });


    it('should display form without flag', function() {

      // given
      createEmptyTab();

      // then
      expect(screen.queryAllByText('Form')).to.have.length(2);
    });

  });


  describe('enable platform', function() {

    afterEach(sinon.restore);

    it('should display platform without flag', function() {

      // when
      const { container } = createEmptyTab();

      // then
      expect(container.querySelectorAll('.welcome-header')).to.have.length(1);
      expect(container.querySelectorAll('.welcome-card')).to.have.length(3);
      expect(screen.queryAllByText('Camunda 7')).not.to.be.empty;
    });


    it('should NOT display platform with flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_PLATFORM).returns(true);

      // given
      const { container } = createEmptyTab();

      // then
      expect(container.querySelectorAll('.welcome-header')).to.have.length(0);
      expect(container.querySelectorAll('.welcome-card')).to.have.length(2);
      expect(screen.queryAllByText('Camunda 7')).to.be.empty;
    });

  });


  describe('enable zeebe', function() {

    afterEach(sinon.restore);

    it('should display zeebe without flag', function() {

      // when
      const { container } = createEmptyTab();

      // then
      expect(container.querySelectorAll('.welcome-header')).to.have.length(1);
      expect(container.querySelectorAll('.welcome-card')).to.have.length(3);
      expect(screen.queryAllByText('Camunda 8')).not.to.be.empty;
    });


    it('should NOT display zeebe with flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_ZEEBE).returns(true);

      // given
      const { container } = createEmptyTab();

      // then
      expect(container.querySelectorAll('.welcome-header')).to.have.length(0);
      expect(container.querySelectorAll('.welcome-card')).to.have.length(2);
      expect(screen.queryAllByText('Camunda 8')).to.be.empty;
    });

  });


  function createEmptyTab(options = {}) {
    const tabsProvider = new TabsProvider();

    return render(
      <EmptyTab
        onAction={ options.onAction || sinon.fake() }
        onShown={ options.onShown || sinon.fake() }
        tabsProvider={ tabsProvider }
      />
    );
  }
});
