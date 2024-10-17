/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Metadata from '../../../util/Metadata';
import MixpanelHandler from '../MixpanelHandler';

describe('<MixpanelHandler>', function() {

  const mixpanel = MixpanelHandler.getInstance();

  it('should be disabled by default', async function() {

    expect(mixpanel.isEnabled()).to.be.false;
  });


  it('should send request to Mixpanel', async function() {

    // given
    Metadata.init({ version:'test-version' });
    mixpanel.enable('token', 'id', 'stage');

    // when
    const eventSent = mixpanel.track('test-event', {
      foo: 'bar'
    });

    // then
    expect(eventSent).to.not.be.undefined;
    expect(eventSent.properties).to.include({ foo: 'bar' });
  });


  it('should NOT send request to Mixpanel if not enabled', async function() {

    // given
    mixpanel.disable();

    // when
    const eventSent = mixpanel.track('test-event', {});

    // then
    expect(eventSent).to.be.undefined;
  });


  it('should include common properties in request to Mixpanel', async function() {

    // given
    Metadata.init({ version:'test-version' });
    mixpanel.enable('id', 'token', 'stage');

    // when
    const eventSent = mixpanel.track('test-event', {
      foo: 'bar'
    });

    // then
    expect(eventSent.properties).to.include({
      stage: 'stage',
      version: 'test-version'
    });
  });

});
