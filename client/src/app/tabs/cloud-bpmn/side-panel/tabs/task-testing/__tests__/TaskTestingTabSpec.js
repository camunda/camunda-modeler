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

import TaskTestingTab, {
  CANNOT_CONNECT_TITLE,
  UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE,
  UNSUPPORTED_PROTOCOL_TITLE
} from '../TaskTestingTab';

import { Config, Deployment, StartInstance, ZeebeAPI } from '../../../../../../__tests__/mocks';

import { EventsContext } from '../../../../../../EventsContext';

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

  it('should render empty', async function() {

    // given
    renderTab(modeler);

    // then
    expect(screen.getByText('Select a task or subprocess to start testing.')).to.exist;
  });


  it('should be ready when task selected', async function() {

    // given
    renderTab(modeler);

    // when
    await selectElement(modeler, 'Task_1');

    // then
    expect(screen.getByRole('button', { name: 'Run test' })).to.exist;
  });


  describe('errors', function() {

    it('should show error (execution platform version not supported)', async function() {

      // given
      renderTab(modeler, {
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

      // then
      await waitFor(() => {
        expect(screen.getByText(UNSUPPORTED_EXECUTION_PLATFORM_VERSION_TITLE)).to.exist;
      });
    });


    it('should show error (gRPC connection not supported)', async function() {

      // given
      renderTab(modeler, {
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

      // then
      await waitFor(() => {
        expect(screen.getByText(UNSUPPORTED_PROTOCOL_TITLE)).to.exist;
      });
    });


    it('should show error (cannot connect to cluster)', async function() {

      // given
      renderTab(modeler, {
        connectionCheckResult: {
          success: false,
          reason: 'Foo'
        }
      });

      // when
      await selectElement(modeler, 'Task_1');

      // then
      await waitFor(() => {
        expect(screen.getByText(CANNOT_CONNECT_TITLE)).to.exist;
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
      screen.getByRole('tab', { name: 'Result' }).click();

      // then
      await waitFor(() => {
        expect(screen.getByText('Open in Operate')).to.exist;
      });
    });


    it('should not display Operate link if connection is not successful', async function() {

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
        }),
        connectionCheckResult: {
          success: false,
          reason: 'Foo'
        }
      });

      // when
      await selectElement(modeler, 'Task_1');
      screen.getByRole('tab', { name: 'Result' }).click();

      // then
      expect(screen.queryByText('Open in Operate')).to.not.exist;
    });
  });

});


// helpers //////////

const mockConnectionCheckResult = {
  success: true,
  response: {
    protocol: 'rest',
    gatewayVersion: '8.8.0'
  }
};

function renderTab(modeler, options = {}) {

  const connectionCheckResult = options.connectionCheckResult || mockConnectionCheckResult;

  const props = {
    injector: modeler.get('injector'),
    zeebeApi: new ZeebeAPI({
      checkConnection: () => {
        return connectionCheckResult;
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
    connectionCheckResult,
    file: {
      path: 'foo.bpmn'
    },
    onAction: () => { },
    ...options,
  };

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
      <TaskTestingTab
        deployment={ props.deployment }
        startInstance={ props.startInstance }
        zeebeApi={ props.zeebeApi }
        layout={ props.layout }
        injector={ props.injector }
        file={ props.file }
        config={ props.config }
        onAction={ props.onAction } />
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
