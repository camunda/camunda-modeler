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

describe('<MixpanelHandler>', () => {

  const mixpanel = MixpanelHandler.getInstance();

  it('should be disabled by default', async () => {

    expect(mixpanel.isEnabled()).to.be.false;
  });


  it('should send request to Mixpanel', async () => {

    // given
    Metadata.init({ version:'test-version' });
    mixpanel.enable('token', 'id', 'stage');

    // when
    const ret = mixpanel.track('test-event', {
      foo: 'bar'
    });

    // then
    expect(ret).to.not.be.undefined;
    expect(ret.properties).to.include({ foo: 'bar' });
  });


  it('should NOT send request to Mixpanel if not enabled', async () => {

    // given
    mixpanel.disable();

    // when
    const ret = mixpanel.track('test-event', {});

    // then

    expect(ret).to.be.undefined;
  });


  it('should include common properties in request to Mixpanel', async () => {

    // given
    Metadata.init({ version:'test-version' });
    mixpanel.enable('id', 'token', 'stage');

    // when
    const ret = mixpanel.track('test-event', {
      foo: 'bar'
    });

    // then
    expect(ret.properties).to.include({
      stage: 'stage',
      version: 'test-version'
    });
  });

});
