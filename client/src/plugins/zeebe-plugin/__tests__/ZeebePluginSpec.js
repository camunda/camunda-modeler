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

import ZeebePlugin from '..';

describe('<ZeebePlugin>', function() {

  it('should render', function() {

    // when
    const { component } = createZeebePlugin();

    // then
    expect(component).to.exist;
  });

});


// helpers ////////////////////

function createZeebePlugin(options = {}) {

  const component = shallow(
    <ZeebePlugin
      { ...options }
      config={ options.config || noop }
      displayNotification={ options.displayNotification || noop }
      subscribe={ options.subscribe || noop }
    />
  );

  const instance = component.instance();

  return {
    component,
    instance
  };
}

function noop() {}