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

import { ZeebeVariableResolverModule } from '@bpmn-io/variable-resolver';

import Modeler from 'bpmn-js-headless/lib/Modeler';

import { render, waitFor, screen } from '@testing-library/react';

import { SlotFillRoot } from '../../../../slot-fill';

import Panel from '../../../Panel';

import TaskTestingTab, {
  CANNOT_CONNECT_TITLE,
  UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE,
  UNSUPPORTED_PROTOCOL_TITLE
} from '../TaskTestingTab';

import { Config, Deployment, StartInstance, ZeebeAPI } from '../../../../__tests__/mocks';

import { EventsContext } from '../../../../EventsContext';

import diagramXML from './TaskTestingTab.bpmn';


describe('<TaskTestingTab>', function() {

  let modeler;

  beforeEach(async function() {
    modeler = new Modeler({
      additionalModules: [
        ZeebeVariableResolverModule
      ]
    });

    await modeler.importXML(diagramXML);
  });

  it('should not show error', async function() {

    // given
    renderTab(modeler);

    // when
    await selectElement(modeler, 'Task_1');

    // wait for connection check
    expect(screen.getByText('Connection error')).to.exist;

    // then
    await waitFor(() => {
      expect(screen.queryByText('Ready')).to.exist;
    });
  });


  describe('errors', function() {

    it('should show error (execution platform version not supported)', async function() {

      // given
      renderTab(modeler, {
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
        connectionCheckResult: {
          success: true,
          response: {
            protocol: 'rest',
            gatewayVersion: '8.7.0'
          }
        }
      });

      // when
      await selectElement(modeler, 'Task_1');

      // wait for connection check
      expect(screen.getByText('Connection error')).to.exist;

      // then
      await waitFor(() => {
        expect(screen.getByText(UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE, {
          ignore: '.cds--tooltip-content'
        })).to.exist;
      });
    });


    it('should show error (gRPC connection not supported)', async function() {

      // given
      renderTab(modeler, {
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
        connectionCheckResult: {
          success: true,
          response: {
            protocol: 'grpc',
            gatewayVersion: '8.8.0'
          }
        }
      });

      // when
      await selectElement(modeler, 'Task_1');

      // wait for connection check
      expect(screen.getByText('Connection error')).to.exist;

      // then
      await waitFor(() => {
        expect(screen.getByText(UNSUPPORTED_PROTOCOL_TITLE, {
          ignore: '.cds--tooltip-content'
        })).to.exist;
      });
    });


    it('should show error (cannot connect to cluster)', async function() {

      // given
      renderTab(modeler, {
        zeebeApi: new ZeebeAPI({
          checkConnection: async () => {
            return {
              success: false,
              reason: 'Foo'
            };
          }
        }),
        connectionCheckResult: {
          success: false,
          reason: 'Foo'
        }
      });

      // when
      await selectElement(modeler, 'Task_1');

      // wait for connection check
      expect(screen.getByText('Connection error')).to.exist;

      // then
      await waitFor(() => {
        expect(screen.getByText(CANNOT_CONNECT_TITLE, {
          ignore: '.cds--tooltip-content'
        })).to.exist;
      });
    });

  });


  describe('Operate URL', function() {

    it('should display Operate link if connection is successful', async function() {

      // given
      renderTab(modeler, {
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
        })
      });

      // when
      await selectElement(modeler, 'Task_1');

      // wait for connection check
      expect(screen.getByText('Connection error')).to.exist;

      // then
      await waitFor(() => {
        expect(screen.getByText('View in Operate')).to.exist;
      });
    });


    it('should not display Operate link if connection is not successful', async function() {

      // given
      renderTab(modeler, {
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
        connectionCheckResult: {
          success: false,
          reason: 'Foo'
        }
      });

      // when
      await selectElement(modeler, 'Task_1');

      // wait for connection check
      expect(screen.getByText('Connection error')).to.exist;

      // then
      await waitFor(() => {
        expect(screen.queryByText('View in Operate')).to.not.exist;
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

const mockConnectionCheckResult = {
  success: true,
  response: {
    protocol: 'rest',
    gatewayVersion: '8.8.0'
  }
};

const mockProps = {
  zeebeApi: new ZeebeAPI({
    checkConnection: () => {
      return mockConnectionCheckResult;
    }
  }),
  config: new Config({
    getForFile: (file, key) => {
      if (key === 'taskTesting') {
        return {
          input: {},
          output: {}
        };
      }
    }
  }),
  deployment: new Deployment({
    getConnectionForTab: () => {
      return {
        targetType: 'camundaCloud',
        camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      };
    }
  }),
  startInstance: new StartInstance(),
  connectionCheckResult: mockConnectionCheckResult,
  file: {
    path: 'foo.bpmn'
  },
  layout: defaultLayout,
  onAction: () => { },
};

function renderTab(modeler, options = {}) {

  const props = {
    ...mockProps,
    ...options,
    injector: modeler.get('injector')
  };

  const { connectionCheckResult } = props;

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

  render(
    <EventsContext.Provider value={ eventsContext }>
      <SlotFillRoot>
        <Panel
          layout={ props.layout }>
          <TaskTestingTab
            deployment={ props.deployment }
            startInstance={ props.startInstance }
            zeebeApi={ props.zeebeApi }
            layout={ props.layout }
            injector={ props.injector }
            file={ props.file }
            config={ props.config }
            onAction={ props.onAction } />
        </Panel>
      </SlotFillRoot>
    </EventsContext.Provider>
  );
}

async function selectElement(modeler, elementId) {
  modeler.get('selection').select(modeler.get('elementRegistry').get(elementId));

  await waitFor(() => {
    const selectedElement = modeler.get('selection').get()[0];
    expect(selectedElement?.id).to.eql(elementId);
  });
}