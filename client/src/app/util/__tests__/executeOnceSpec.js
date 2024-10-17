/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import executeOnce from '../executeOnce';

/* global sinon */
const { spy } = sinon;


describe('util - executeOnce', function() {

  describe('with identifier', function() {

    it('should NOT execute wrapped function twice for same identifier', async function() {

      // given
      const executeSpy = spy(async () => {});

      const exec = executeOnce(executeSpy, (a) => a);

      // when
      await Promise.all([
        exec(0),
        exec(0, 1),
        exec(0)
      ]);

      // then
      expect(executeSpy).to.have.been.calledOnce;
    });


    it('should execute wrapped function twice with different identifier', async function() {

      // given
      const executeSpy = spy(async () => {});

      const exec = executeOnce(executeSpy, (a) => a);

      // when
      await Promise.all([
        exec(0),
        exec(0),
        exec(1)
      ]);

      // then
      expect(executeSpy).to.have.been.calledTwice;

    });

  });


  describe('without identifier', function() {

    it('should execute wrapped function once', async function() {

      // given
      const executeSpy = spy(async () => {});

      const exec = executeOnce(executeSpy);

      // when
      await Promise.all([
        exec(0),
        exec('A'),
        exec()
      ]);

      // then
      expect(executeSpy).to.have.been.calledOnce;

    });

  });

});