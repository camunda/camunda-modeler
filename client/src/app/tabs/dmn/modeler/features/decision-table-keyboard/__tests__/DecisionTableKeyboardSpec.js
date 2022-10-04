/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import DecisionTableKeyboard from '../DecisionTableKeyboard';


describe('DecisionTableKeyboard', function() {

  it('should create with correct config', function() {

    // given
    const decisionTable = { _container: '_container' },
          eventBus = { on() {} };

    // when
    const module = new DecisionTableKeyboard(decisionTable, eventBus);

    // then
    expect(module).to.exist;
    expect(module._config).to.have.property('bindTo', decisionTable._container);
  });

});
