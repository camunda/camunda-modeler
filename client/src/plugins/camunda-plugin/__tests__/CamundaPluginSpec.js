/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React, { createRef } from 'react';

import { render } from '@testing-library/react';

import CamundaPlugin from '..';

describe('<CamundaPlugin>', function() {

  let fetch;

  beforeEach(function() {
    fetch = sinon.stub(window, 'fetch').rejects(new Error('fetch is disabled'));
  });


  afterEach(function() {
    fetch.restore();
  });

  const noop = () => {};

  const defaultProps = {
    subscribe: noop,
    triggerAction: noop,
    displayNotification: noop,
    log: noop,
    _getGlobal: noop,
    config: {
      get: () => {},
      getForFile: () => {},
      set: () => {}
    }
  };


  it('should render', function() {
    render(<CamundaPlugin { ...defaultProps } />);
  });


  it('should expose DeploymentTool methods via deployRef', function() {

    // given
    const ref = createRef();
    render(<CamundaPlugin ref={ ref } { ...defaultProps } />);
    const instance = ref.current;

    // DeployService methods map to these DeploymentTool methods
    const methods = [
      'deployWithConfiguration',
      'getSavedConfiguration',
      'getConfigurationFromUserInput',
      'saveConfiguration',
      'canDeployWithConfiguration',
      'getVersion',
      'closeOverlay'
    ];

    // when
    const deploymentTool = instance.deployRef.current;

    // then
    expect(deploymentTool).to.exist;

    for (const method of methods) {
      expect(typeof deploymentTool[method]).to.be.eql('function');
    }
  });
});
