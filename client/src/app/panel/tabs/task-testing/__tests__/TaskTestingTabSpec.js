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

import { render, waitFor } from '@testing-library/react';

import { SlotFillRoot } from '../../../../slot-fill';

import Panel from '../../../Panel';

import TestTab, { REQUIRED_CAMUNDA_CLOUD_VERSION } from '../TaskTestingTab';

import { ENGINES } from '../../../../../util/Engines';

import Modeler from '../../../../../../test/mocks/bpmn-js/Modeler';


describe('<TestTab>', function() {

  const WELCOME_MESSAGE = 'Select a task to start testing';
  const UNSUPPORTED_MESSAGE = 'Task testing is not supported by the current engine version.';

  it('should render', async function() {

    // when
    const { getByText } = renderTab();

    // then
    await waitFor(() => {
      expect(getByText(WELCOME_MESSAGE)).to.exist;
    });

  });


  it(`should not support Camunda Cloud < ${REQUIRED_CAMUNDA_CLOUD_VERSION}`, async function() {

    // when
    const { getByText } = renderTab({
      engineProfile: {
        executionPlatform: ENGINES.CLOUD,
        executionPlatformVersion: '8.7.0'
      }
    });

    // then
    await waitFor(() => {
      expect(getByText(UNSUPPORTED_MESSAGE)).to.exist;
    });

  });

});


// helpers //////////

const defaultLayout = {
  panel: {
    open: true,
    tab: 'task-testing'
  }
};

const mockConfig = {
  get: async (key) => {
    if (key === 'zeebeEndpoints') {
      return Promise.resolve([]);
    }
    return Promise.resolve({});
  },
  getForFile: async () => Promise.resolve({}),
  set: async () => Promise.resolve()
};

const defaultEngineProfile = {
  executionPlatform: ENGINES.CLOUD,
  executionPlatformVersion: '8.7.0'
};

function renderTab(options = {}) {

  const {
    backend = {},
    config = mockConfig,
    engineProfile = defaultEngineProfile,
    injector = new Modeler(),
    file = {},
    layout = defaultLayout,
    onAction = () => {}
  } = options;

  return render(
    <SlotFillRoot>
      <Panel
        layout={ layout }>
        <TestTab
          layout={ layout }
          engineProfile={ engineProfile }
          injector={ injector }
          file={ file }
          backend={ backend }
          config={ config }
          onAction={ onAction } />
      </Panel>
    </SlotFillRoot>
  );
}
