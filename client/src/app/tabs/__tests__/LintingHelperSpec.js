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

import LintingHelper from '../LintingHelper';


describe('LintingHelper', function() {

  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
  });

  afterEach(function() {
    clock.restore();
  });


  function createHelper(overrides = {}) {
    let cached = {};

    const lint = sinon.spy();

    const defaults = {
      lint,
      timeout: 100,
      getCached: () => cached,
      setCached: (state) => {
        cached = { ...cached, ...state };
      }
    };

    const helper = new LintingHelper({ ...defaults, ...overrides });

    return { helper, lint, getCached: () => cached };
  }


  describe('#schedule', function() {

    it('should NOT lint synchronously', function() {

      // given
      const { helper, lint } = createHelper();

      // when
      helper.schedule();

      // then
      expect(lint).not.to.have.been.called;
    });


    it('should lint after debounce', function() {

      // given
      const { helper, lint } = createHelper();

      helper.schedule();

      // when
      clock.tick(100);

      // then
      expect(lint).to.have.been.calledOnce;
    });


    it('should coalesce bursts into a single lint', function() {

      // given
      const { helper, lint } = createHelper();

      // when
      helper.schedule();
      helper.schedule();
      helper.schedule();

      clock.tick(100);

      // then
      expect(lint).to.have.been.calledOnce;
    });

  });


  describe('#flush', function() {

    it('should run a scheduled lint immediately', function() {

      // given
      const { helper, lint } = createHelper();

      helper.schedule();

      // when
      helper.flush();

      // then
      expect(lint).to.have.been.calledOnce;
    });

  });


  describe('#cancel', function() {

    it('should cancel a pending lint and persist it', function() {

      // given
      const { helper, lint, getCached } = createHelper();

      helper.schedule();

      // when
      helper.cancel();

      clock.tick(100);

      // then
      expect(lint).not.to.have.been.called;
      expect(getCached().lintingPending).to.be.true;
    });


    it('should NOT persist when nothing is pending', function() {

      // given
      const { helper, getCached } = createHelper();

      // when
      helper.cancel();

      // then
      expect(getCached().lintingPending).not.to.be.true;
    });

  });


  describe('#resume', function() {

    it('should clear pending lint on resume', function() {

      // given
      const { helper, getCached } = createHelper();

      helper.schedule();
      helper.cancel();

      // when
      helper.resume();

      // then
      expect(getCached().lintingPending).to.be.false;
    });


    it('should lint after resumed debounce', function() {

      // given
      const { helper, lint } = createHelper();

      helper.schedule();
      helper.cancel();
      helper.resume();

      // when
      clock.tick(100);

      // then
      expect(lint).to.have.been.calledOnce;
    });


    it('should NOT resume when nothing is pending', function() {

      // given
      const { helper, lint } = createHelper();

      // when
      helper.resume();

      clock.tick(100);

      // then
      expect(lint).not.to.have.been.called;
    });

  });

});
