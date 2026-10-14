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

import TrackingHandler from '../TrackingHandler';

describe('<TrackingHandler>', function() {

  const handler = TrackingHandler.getInstance();

  afterEach(function() {
    handler.disable();
  });


  it('should be disabled by default', function() {
    expect(handler.isEnabled()).to.be.false;
  });


  it('should enable and disable', function() {

    // when
    handler.enable();

    // then
    expect(handler.isEnabled()).to.be.true;

    // when
    handler.disable();

    // then
    expect(handler.isEnabled()).to.be.false;
  });


  it('should NOT send events', function() {

    // given
    handler.enable();

    // then
    expect(handler.track('test-event', { foo: 'bar' })).to.be.undefined;
  });

});
