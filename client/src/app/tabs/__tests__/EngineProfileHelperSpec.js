/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import sinon from 'sinon';

import EngineProfileHelper from '../EngineProfileHelper';


describe('EngineProfileHelper', function() {

  function createHelper(overrides = {}) {
    let cached = { engineProfile: null };

    const defaults = {
      get: () => cached.engineProfile,
      set: sinon.spy(),
      getCached: () => cached,
      setCached: ({ engineProfile }) => {
        cached = { engineProfile };
      }
    };

    const helper = new EngineProfileHelper({ ...defaults, ...overrides });

    return { helper, getCached: () => cached };
  }


  describe('#setCached', function() {

    it('should call onChanged when engine profile changes', function() {

      // given
      const onChanged = sinon.spy();

      const { helper } = createHelper({ onChanged });

      // when
      helper.setCached({
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.8.0'
      });

      // then
      expect(onChanged).to.have.been.calledOnceWith({
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.8.0'
      });
    });


    it('should call onChanged again when engine profile reverts (undo)', function() {

      // given
      const onChanged = sinon.spy();

      const { helper } = createHelper({ onChanged });

      helper.setCached({
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.9.0'
      });

      onChanged.resetHistory();

      // when - engine profile reverts, e.g. through undo
      helper.setCached({
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.8.0'
      });

      // then
      expect(onChanged).to.have.been.calledOnceWith({
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.8.0'
      });
    });


    it('should NOT call onChanged when engine profile is unchanged', function() {

      // given
      const onChanged = sinon.spy();

      const { helper } = createHelper({ onChanged });

      const engineProfile = {
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.8.0'
      };

      helper.setCached(engineProfile);

      onChanged.resetHistory();

      // when
      helper.setCached(engineProfile);

      // then
      expect(onChanged).not.to.have.been.called;
    });


    it('should not fail without onChanged callback', function() {

      // given
      const { helper } = createHelper();

      // when
      function change() {
        helper.setCached({
          executionPlatform: 'Camunda Cloud',
          executionPlatformVersion: '8.8.0'
        });
      }

      // then
      expect(change).not.to.throw();
    });

  });

});
