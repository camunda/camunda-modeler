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

import { shallow } from 'enzyme';

import { Config } from '../../../../app/__tests__/mocks';

import StartInstancePlugin from '../StartInstancePlugin';
import { CAMUNDA_CLOUD } from '../../shared/ZeebeTargetTypes';

const BUTTON_SELECTOR = '[title="Start current diagram"]';


describe('<StartInstancePlugin> (Zeebe)', () => {

  describe('render', () => {

    it('should render', () => {
      createStartInstancePlugin();
    });


    it('should display for active zeebe tabs', () => {

      // when
      const { wrapper } = createStartInstancePlugin({
        activeTab: {
          type: 'cloud-bpmn'
        }
      });

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(1);
    });


    it('should NOT display when no active tab', () => {

      // when
      const { wrapper } = createStartInstancePlugin({
        activeTab: false
      });

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(0);
    });


    it('should NOT display for other tabs', () => {

      // when
      const { wrapper } = createStartInstancePlugin();

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(0);
    });

  });


  describe('deploy', () => {

    it('should send "getDeployConfig" message', async () => {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const broadcastMessage = sinon.spy();
      const { instance } = createStartInstancePlugin({ zeebeAPI, broadcastMessage });

      // when
      instance.startInstance();

      // then
      expect(broadcastMessage).to.have.been.calledOnce;
      expect(broadcastMessage).to.have.been.calledOnceWith('getDeployConfig');

    });


    it('should send "deployWithConfig" message', async () => {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const broadcastMessage = sinon.spy();

      const { instance } = createStartInstancePlugin({ zeebeAPI, broadcastMessage });

      // when
      instance.startInstanceProcess();

      // then
      expect(broadcastMessage).to.have.been.calledOnce;
      expect(broadcastMessage).to.have.been.calledOnceWith('deployWithConfig');
    });
  });


  describe('start instance', () => {

    it('should start process instance if deployment was successful', async () => {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ zeebeAPI });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).to.have.been.calledOnce;
    });


    it('should NOT start process instance if deployment failed', async () => {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({
        deploymentResult: {
          success: false,
          response: {
            message: 'Error'
          }
        },
        zeebeAPI });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).not.to.have.been.called;
    });


    it('should NOT start process instance if deployment was cancelled', async () => {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ deploymentResult: null, zeebeAPI });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).not.to.have.been.called;
    });


    it('should NOT start process instance if user cancelled', async () => {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ zeebeAPI , userAction: 'cancel' });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).not.to.have.been.called;
    });


    it('should start process instance with variables', async () => {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });

      const variables =
        {
          'aVariable' : {
            'value' : 'aStringValue',
            'type': 'String'
          },
          'anotherVariable' : {
            'value' : true,
            'type': 'Boolean'
          }
        };

      const config = {
        getForFile: () => {
          return { variables: JSON.stringify(variables) };
        }
      };

      const { instance } = createStartInstancePlugin({ zeebeAPI, config });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).to.have.been.calledOnce;
      expect(runSpy.args[0][0].variables).to.eql(variables);
    });


    it('should invoke zeebe API with the process id', async () => {

      // given
      const processId = '123';
      const deploymentResult = {
        success: true, response: { workflows: [ { bpmnProcessId: processId } ] }
      };
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ deploymentResult, zeebeAPI });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).to.have.been.calledOnce;
    });


    it('should handle start instance error', async () => {

      // given
      const runSpy = sinon.stub().throws(new Error());
      const displayNotification = sinon.spy();

      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ zeebeAPI, displayNotification });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).to.have.been.called;
      expect(displayNotification).to.have.been.calledOnce;
      expect(displayNotification.args[0][0].title).to.eql('Starting process instance failed');
    });
  });


  describe('Operate link', () => {

    it('should display notification without link after starting process instance', async () => {

      // given
      const displayNotification = sinon.spy();
      const { instance } = createStartInstancePlugin({ displayNotification });

      // when
      await instance.startInstance();

      // then
      expect(displayNotification).to.have.been.calledWith({
        type: 'success',
        content: null,
        title: 'Process instance started',
        duration: 8000
      });

    });


    it('should display notification with link after starting process instance', async () => {

      // given
      const displayNotification = sinon.spy();
      const { instance } = createStartInstancePlugin({
        displayNotification,
        deploymentEndpoint : {
          targetType: CAMUNDA_CLOUD,
          camundaCloudClusterUrl: 'clusterId.region.zeebe.camunda.io',
          camundaCloudClusterRegion:'region'
        },
      });

      // when
      await instance.startInstance();

      expect(displayNotification).to.have.been.calledOnce;

      const notification = displayNotification.getCall(0).args[0];

      expect(
        {
          type: notification.type,
          title: notification.title,
          duration: notification.duration
        }).to.eql(
        {
          type: 'success',
          title: 'Process instance started',
          duration: 8000
        }
      );

      expect(notification.content).to.not.be.null;

    });

  });

});



function createStartInstancePlugin({
  zeebeAPI = new MockZeebeAPI(),
  activeTab = createTab(),
  deploymentResult = {
    success: true, response: { workflows: [ { bpmnProcessId: 'test' } ] }
  },
  deploymentEndpoint = {},
  ...props
} = {}) {
  const subscribe = (key, callback) => {
    if (key === 'app.activeTabChanged') {
      callback({
        activeTab: activeTab || { type: 'empty', name: 'testName' }
      });
    }
  };

  const config = new Config({
    get: (_, defaultValue) => defaultValue,
    ...props.config
  });

  const broadcastMessage = (key, body) => {
    if (key === 'deploy') {
      body.done({ deploymentResult, endpoint: deploymentEndpoint });
    }

    if (key === 'getDeployConfig') {
      body.done({ deploymentConfig: { deployment:{ name:'hello' }, endpoint: deploymentEndpoint } });
    }

    if (key === 'deployWithConfig') {
      body.done({ deploymentResult, endpoint: deploymentEndpoint });
    }
  };

  const wrapper = shallow(<TestStartInstancePlugin
    subscribe={ subscribe }
    _getGlobal={ key => key === 'zeebeAPI' && zeebeAPI }
    displayNotification={ noop }
    log={ noop }
    triggerAction={ key => key === 'save' && activeTab }
    subscribeToMessaging={ noop }
    unsubscribeFromMessaging={ noop }
    broadcastMessage={ broadcastMessage }
    { ...props }
    config={ config }
  />);

  const instance = wrapper.instance();

  return { wrapper, instance };
}

function noop() {
  return null;
}

function MockZeebeAPI({ runSpy, runResult } = {}) {
  this.run = (...args) => {
    if (runSpy) {
      runSpy(...args);
    }

    const result = runResult ||
      { success: true, response: {} };

    return Promise.resolve(result);
  };
}

function createTab(overrides = {}) {
  return {
    id: 42,
    name: 'foo.bar',
    type: 'bar',
    title: 'unsaved',
    file: {
      name: 'foo.bar',
      contents: '',
      path: null
    },
    ...overrides
  };
}

class TestStartInstancePlugin extends StartInstancePlugin {
  constructor(props) {
    super(props);
  }

  getConfigurationFromUser(startConfiguration) {
    const configuration = startConfiguration || { variables:'' };
    const { overlayState } = this.state;
    const {
      userAction
    } = this.props;

    if (userAction === 'cancel') {
      overlayState.onClose('cancel', null);
    }

    return { action: userAction || null, configuration };
  }

}
