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

import React from 'react';

import Modeler from 'bpmn-js-headless/lib/Modeler';

import { render, waitFor } from '@testing-library/react';

import { SlotFillRoot } from '../../../../slot-fill';

import Panel from '../../../Panel';

import TaskTestingTab, {
  CANNOT_CONNECT_TITLE,
  UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE,
  UNSUPPORTED_PROTOCOL_TITLE
} from '../TaskTestingTab';

import { Backend, Config } from '../../../../__tests__/mocks';

import { DELAYS } from '../../../../../plugins/zeebe-plugin/deployment-plugin/ConnectionChecker';

import diagramXML from './TaskTestingTab.bpmn';

const CONNECTION_CHECKER_INTERVAL = DELAYS.SHORT + 1;

describe('<TaskTestingTab>', function() {

  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
  });

  afterEach(function() {
    clock.restore();
  });


  it('should not show error', async function() {

    // given
    const { modeler, renderResult } = await renderTab({
      backend: new Backend({
        send: async (channel, data) => {
          if (channel === 'zeebe:checkConnection') {
            return {
              success: true,
              response: {
                protocol: 'rest',
                gatewayVersion: '8.8.0'
              }
            };
          }
        }
      }),
      config: new Config({
        get: async (key) => {
          if (key === 'zeebeEndpoints') {
            return [
              {
                id: 'foo',
                targetType: 'camundaCloud',
                camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
              }
            ];
          }
        },
        getForFile: async (file, key) => {
          if (key === 'taskTesting') {
            return {
              input: {},
              output: {}
            };
          }

          if (key === 'zeebe-deployment-tool') {
            return {
              'zeebe-deployment-tool': {
                endpointId: 'foo'
              }
            };
          }
        }
      }),
    });

    const { container } = renderResult;

    await clock.tickAsync(1001);

    // when
    modeler.get('selection').select(modeler.get('elementRegistry').get('Task_1'));

    // then
    await waitFor(() => {
      expect(container.querySelector('.output__variables--empty')).to.exist;
    });
  });


  describe('errors', function() {

    it('should show error (execution platform version not supported)', async function() {

      // given
      const { modeler, renderResult } = await renderTab({
        backend: new Backend({
          send: async (channel, data) => {
            if (channel === 'zeebe:checkConnection') {
              return {
                success: true,
                response: {
                  protocol: 'rest',
                  gatewayVersion: '8.7.0'
                }
              };
            }
          }
        }),
        config: new Config({
          get: async (key) => {
            if (key === 'zeebeEndpoints') {
              return [
                {
                  id: 'foo',
                  targetType: 'camundaCloud',
                  camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                }
              ];
            }
          },
          getForFile: async (file, key) => {
            if (key === 'taskTesting') {
              return {
                input: {},
                output: {}
              };
            }

            if (key === 'zeebe-deployment-tool') {
              return {
                'zeebe-deployment-tool': {
                  endpointId: 'foo'
                }
              };
            }
          }
        })
      });

      const { getByText } = renderResult;

      // when
      modeler.get('selection').select(modeler.get('elementRegistry').get('Task_1'));
      await clock.tickAsync(CONNECTION_CHECKER_INTERVAL);

      // expect
      expect(getByText(UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE, {
        ignore: '.cds--tooltip-content'
      })).to.exist;
    });


    it('should show error (gRPC connection not supported)', async function() {

      // given
      const { modeler, renderResult } = await renderTab({
        backend: new Backend({
          send: async (channel, data) => {
            if (channel === 'zeebe:checkConnection') {
              return {
                success: true,
                response: {
                  protocol: 'grpc',
                  gatewayVersion: '8.8.0'
                }
              };
            }
          }
        }),
        config: new Config({
          get: async (key) => {
            if (key === 'zeebeEndpoints') {
              return [
                {
                  id: 'foo',
                  targetType: 'camundaCloud',
                  camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                }
              ];
            }
          },
          getForFile: async (file, key) => {
            if (key === 'taskTesting') {
              return {
                input: {},
                output: {}
              };
            }

            if (key === 'zeebe-deployment-tool') {
              return {
                'zeebe-deployment-tool': {
                  endpointId: 'foo'
                }
              };
            }
          }
        })
      });

      const { getByText } = renderResult;

      // when
      modeler.get('selection').select(modeler.get('elementRegistry').get('Task_1'));
      await clock.tickAsync(CONNECTION_CHECKER_INTERVAL);

      // then
      expect(getByText(UNSUPPORTED_PROTOCOL_TITLE, {
        ignore: '.cds--tooltip-content'
      })).to.exist;
    });


    it('should show error (cannot connect to cluster)', async function() {

      // given
      const { modeler, renderResult } = await renderTab({
        backend: new Backend({
          send: async (channel, data) => {
            if (channel === 'zeebe:checkConnection') {
              return {
                success: false,
                reason: 'Foo'
              };
            }
          }
        }),
        config: new Config({
          get: async (key) => {
            if (key === 'zeebeEndpoints') {
              return [
                {
                  id: 'foo',
                  targetType: 'camundaCloud',
                  camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                }
              ];
            }
          },
          getForFile: async (file, key) => {
            if (key === 'taskTesting') {
              return {
                input: {},
                output: {}
              };
            }

            if (key === 'zeebe-deployment-tool') {
              return {
                'zeebe-deployment-tool': {
                  endpointId: 'foo'
                }
              };
            }
          }
        })
      });

      const { getByText } = renderResult;

      // when
      modeler.get('selection').select(modeler.get('elementRegistry').get('Task_1'));
      await clock.tickAsync(CONNECTION_CHECKER_INTERVAL);

      // then
      expect(getByText(CANNOT_CONNECT_TITLE, {
        ignore: '.cds--tooltip-content'
      })).to.exist;
    });

  });


  describe('Operate URL', function() {

    it('should display Operate link if connection is successful', async function() {

      // given
      const { modeler, renderResult } = await renderTab({
        backend: new Backend({
          send: async (channel, data) => {
            if (channel === 'zeebe:checkConnection') {
              return {
                success: true,
                response: {
                  protocol: 'rest',
                  gatewayVersion: '8.8.0'
                }
              };
            }
          }
        }),
        config: new Config({
          get: async (key) => {
            if (key === 'zeebeEndpoints') {
              return [
                {
                  id: 'foo',
                  targetType: 'camundaCloud',
                  camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                }
              ];
            }
          },
          getForFile: async (file, key) => {
            if (key === 'taskTesting') {
              return {
                input: {},
                output: {
                  Task_1: {
                    success: true,
                    variables: {
                      foo: 'bar'
                    },
                    operateUrl: 'https://operate.camunda.io'
                  }
                }
              };
            }

            if (key === 'zeebe-deployment-tool') {
              return {
                'zeebe-deployment-tool': {
                  endpointId: 'foo'
                }
              };
            }
          }
        }),
      });

      const { container } = renderResult;

      await clock.tickAsync(1001);

      // when
      modeler.get('selection').select(modeler.get('elementRegistry').get('Task_1'));

      // then
      await waitFor(() => {
        expect(container.querySelector('.output__header--button-operate')).to.exist;
      });
    });


    it('should  not display Operate link if connection is not successful', async function() {

      // given
      const { modeler, renderResult } = await renderTab({
        backend: new Backend({
          send: async (channel, data) => {
            if (channel === 'zeebe:checkConnection') {
              return {
                success: false,
                reason: 'Foo'
              };
            }
          }
        }),
        config: new Config({
          get: async (key) => {
            if (key === 'zeebeEndpoints') {
              return [
                {
                  id: 'foo',
                  targetType: 'camundaCloud',
                  camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                }
              ];
            }
          },
          getForFile: async (file, key) => {
            if (key === 'taskTesting') {
              return {
                input: {},
                output: {
                  Task_1: {
                    success: true,
                    variables: {
                      foo: 'bar'
                    },
                    operateUrl: 'https://operate.camunda.io'
                  }
                }
              };
            }

            if (key === 'zeebe-deployment-tool') {
              return {
                'zeebe-deployment-tool': {
                  endpointId: 'foo'
                }
              };
            }
          }
        }),
      });

      const { container } = renderResult;

      await clock.tickAsync(1001);

      // when
      modeler.get('selection').select(modeler.get('elementRegistry').get('Task_1'));

      // then
      await waitFor(() => {
        expect(container.querySelector('.output__header--button-operate')).to.not.exist;
      });
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

async function renderTab(options = {}) {
  const modeler = new Modeler();

  await modeler.importXML(diagramXML);

  const {
    backend = new Backend(),
    config = new Config(),
    injector = modeler.get('injector'),
    file = {
      path: 'foo.bpmn'
    },
    layout = defaultLayout,
    onAction = () => {}
  } = options;

  const renderResult = render(
    <SlotFillRoot>
      <Panel
        layout={ layout }>
        <TaskTestingTab
          layout={ layout }
          injector={ injector }
          file={ file }
          backend={ backend }
          config={ config }
          onAction={ onAction } />
      </Panel>
    </SlotFillRoot>
  );

  return {
    modeler,
    renderResult
  };
}