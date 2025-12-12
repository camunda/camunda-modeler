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

import { ZeebeVariableResolverModule } from '@bpmn-io/variable-resolver';

import Modeler from 'bpmn-js-headless/lib/Modeler';

import { render, waitFor } from '@testing-library/react';

import { SlotFillRoot } from '../../../../slot-fill';

import Panel from '../../../Panel';

import TaskTestingTab, {
  CANNOT_CONNECT_TITLE,
  UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE,
  UNSUPPORTED_PROTOCOL_TITLE
} from '../TaskTestingTab';

import { Config, Deployment, StartInstance, ZeebeAPI } from '../../../../__tests__/mocks';

import { DELAYS } from '../../../../../plugins/zeebe-plugin/deployment-plugin/ConnectionChecker';

import { EventsContext } from '../../../../EventsContext';

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
      zeebeApi: new ZeebeAPI({
        checkConnection: async () => {
          return {
            success: true,
            response: {
              protocol: 'rest',
              gatewayVersion: '8.8.0'
            }
          };
        }
      }),
      config: new Config({
        getForFile: async (file, key) => {
          if (key === 'taskTesting') {
            return {
              input: {},
              output: {}
            };
          }
        }
      }),
      deployment: new Deployment({
        getConnectionForTab: async () => {
          return {
            targetType: 'camundaCloud',
            camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
          };
        }
      }),
      connectionCheckResult: {
        success: true,
        response: {
          protocol: 'rest',
          gatewayVersion: '8.8.0'
        }
      }
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
        zeebeApi: new ZeebeAPI({
          checkConnection: async () => {
            return {
              success: true,
              response: {
                protocol: 'rest',
                gatewayVersion: '8.7.0'
              }
            };
          }
        }),
        config: new Config({
          getForFile: async (file, key) => {
            if (key === 'taskTesting') {
              return {
                input: {},
                output: {}
              };
            }
          }
        }),
        deployment: new Deployment({
          getConnectionForTab: async () => {
            return {
              targetType: 'camundaCloud',
              camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            };
          }
        }),
        connectionCheckResult: {
          success: true,
          response: {
            protocol: 'rest',
            gatewayVersion: '8.7.0'
          }
        }
      });

      const { getByText } = renderResult;

      // when
      modeler.get('selection').select(modeler.get('elementRegistry').get('Task_1'));
      await clock.tickAsync(CONNECTION_CHECKER_INTERVAL);

      // then
      expect(getByText(UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE, {
        ignore: '.cds--tooltip-content'
      })).to.exist;
    });


    it('should show error (gRPC connection not supported)', async function() {

      // given
      const { modeler, renderResult } = await renderTab({
        zeebeApi: new ZeebeAPI({
          checkConnection: async () => {
            return {
              success: true,
              response: {
                protocol: 'grpc',
                gatewayVersion: '8.8.0'
              }
            };
          }
        }),
        config: new Config({
          getForFile: async (file, key) => {
            if (key === 'taskTesting') {
              return {
                input: {},
                output: {}
              };
            }
          }
        }),
        deployment: new Deployment({
          getConnectionForTab: async () => {
            return {
              targetType: 'camundaCloud',
              camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            };
          }
        }),
        connectionCheckResult: {
          success: true,
          response: {
            protocol: 'grpc',
            gatewayVersion: '8.8.0'
          }
        }
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
        zeebeApi: new ZeebeAPI({
          checkConnection: async () => {
            return {
              success: false,
              reason: 'Foo'
            };
          }
        }),
        config: new Config({
          getForFile: async (file, key) => {
            if (key === 'taskTesting') {
              return {
                input: {},
                output: {}
              };
            }
          }
        }),
        deployment: new Deployment({
          getConnectionForTab: async () => {
            return {
              targetType: 'camundaCloud',
              camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            };
          }
        }),
        connectionCheckResult: {
          success: false,
          reason: 'Foo'
        }
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
        zeebeApi: new ZeebeAPI({
          checkConnection: async () => {
            return {
              success: true,
              response: {
                protocol: 'rest',
                gatewayVersion: '8.8.0'
              }
            };
          }
        }),
        config: new Config({
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
          }
        }),
        deployment: new Deployment({
          getConnectionForTab: async () => {
            return {
              targetType: 'camundaCloud',
              camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            };
          }
        }),
        connectionCheckResult: {
          success: true,
          response: {
            protocol: 'rest',
            gatewayVersion: '8.8.0'
          }
        }
      });

      const { getByText } = renderResult;

      await clock.tickAsync(1001);

      // when
      modeler.get('selection').select(modeler.get('elementRegistry').get('Task_1'));

      // then
      await waitFor(() => {
        expect(getByText('View in Operate')).to.exist;
      });
    });


    it('should  not display Operate link if connection is not successful', async function() {

      // given
      const { modeler, renderResult } = await renderTab({
        zeebeApi: new ZeebeAPI({
          checkConnection: async () => {
            return {
              success: false,
              reason: 'Foo'
            };
          }
        }),
        config: new Config({
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
          }
        }),
        deployment: new Deployment({
          getConnectionForTab: async () => {
            return {
              targetType: 'camundaCloud',
              camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            };
          }
        }),
        connectionCheckResult: {
          success: false,
          reason: 'Foo'
        }
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
  const modeler = new Modeler({
    additionalModules: [
      ZeebeVariableResolverModule
    ]
  });

  await modeler.importXML(diagramXML);

  const {
    config = new Config(),
    deployment = new Deployment(),
    startInstance = new StartInstance(),
    zeebeApi = new ZeebeAPI(),
    injector = modeler.get('injector'),
    file = {
      path: 'foo.bpmn'
    },
    layout = defaultLayout,
    onAction = () => {},
    connectionCheckResult = null
  } = options;

  const mockSubscribe = (event, listener) => {
    if (event === 'connectionManager.connectionStatusChanged' && connectionCheckResult) {
      setTimeout(() => listener(connectionCheckResult), 0);
    }
    return {
      cancel: () => {}
    };
  };

  const eventsContext = {
    subscribe: mockSubscribe
  };

  const renderResult = render(
    <EventsContext.Provider value={ eventsContext }>
      <SlotFillRoot>
        <Panel
          layout={ layout }>
          <TaskTestingTab
            deployment={ deployment }
            startInstance={ startInstance }
            zeebeApi={ zeebeApi }
            layout={ layout }
            injector={ injector }
            file={ file }
            config={ config }
            onAction={ onAction } />
        </Panel>
      </SlotFillRoot>
    </EventsContext.Provider>
  );

  return {
    modeler,
    renderResult
  };
}