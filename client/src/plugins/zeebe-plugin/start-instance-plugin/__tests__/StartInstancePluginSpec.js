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

import { mount, shallow } from 'enzyme';

import { Config } from '../../../../app/__tests__/mocks';

import StartInstancePlugin from '../StartInstancePlugin';
import { CAMUNDA_CLOUD } from '../../shared/ZeebeTargetTypes';
import { Slot, SlotFillRoot } from '../../../../app/slot-fill';

const BUTTON_SELECTOR = '[title="Start current diagram"]';


describe('<StartInstancePlugin> (Zeebe)', function() {

  describe('render', function() {

    it('should render', function() {
      createStartInstancePlugin();
    });


    it('should display for active zeebe tabs', function() {

      // when
      const { wrapper } = createStartInstancePlugin({
        activeTab: {
          type: 'cloud-bpmn'
        }
      });

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(1);
    });


    it('should NOT display when no active tab', function() {

      // when
      const { wrapper } = createStartInstancePlugin({
        activeTab: false
      });

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(0);
    });


    it('should NOT display for other tabs', function() {

      // when
      const { wrapper } = createStartInstancePlugin();

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(0);
    });

  });


  describe('deploy', function() {

    it('should send "getDeployConfig" message', async function() {

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


    it('should send "deployWithConfig" message', async function() {

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


  describe('start instance', function() {

    it('should start process instance if deployment was successful', async function() {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ zeebeAPI });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).to.have.been.calledOnce;
    });


    it('should start process instance if deployment was successful (multi-tenancy)', async function() {

      // given
      const runSpy = sinon.spy(function(args) {
        expect(args.name).to.eql('DEPLOYMENT_NAME');
        expect(args.tenantId).to.eql('TENANT_ID');
      });

      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({
        deployment: {
          name: 'DEPLOYMENT_NAME',
          tenantId: 'TENANT_ID'
        },
        zeebeAPI
      });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).to.have.been.calledOnce;
    });


    it('should NOT start process instance if deployment failed', async function() {

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
        zeebeAPI
      });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).not.to.have.been.called;
    });


    it('should NOT start process instance if deployment was cancelled', async function() {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ deploymentResult: null, zeebeAPI });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).not.to.have.been.called;
    });


    it('should NOT start process instance if user cancelled', async function() {

      // given
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ zeebeAPI , userAction: 'cancel' });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).not.to.have.been.called;
    });


    it('should start process instance with variables', async function() {

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


    it('should invoke zeebe API with the process id', async function() {

      // given
      const processId = '123';
      const deploymentResult = {
        success: true,
        response: {
          deployments: [
            {
              process: {
                bpmnProcessId: processId
              }
            }
          ]
        }
      };
      const runSpy = sinon.spy();
      const zeebeAPI = new MockZeebeAPI({ runSpy });
      const { instance } = createStartInstancePlugin({ deploymentResult, zeebeAPI });

      // when
      await instance.startInstance();

      // then
      expect(runSpy).to.have.been.calledOnce;
    });


    it('should handle start instance error', async function() {

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


  describe('overlay', function() {

    it('should open', async function() {

      // given
      const activeTab = createTab({ type: 'cloud-bpmn' });

      const {
        wrapper
      } = createStartInstancePlugin({
        activeTab,
        withFillSlot: true,
        keepOpen: true
      }, mount);

      // when
      const statusBarBtn = wrapper.find("button[title='Start current diagram']");
      statusBarBtn.simulate('click');

      await new Promise(function(resolve) {
        setTimeout(resolve, 10);
      });

      // then
      expect(wrapper.html().includes('form')).to.be.true;
    });


    it('should close when active tab changes', async function() {

      // given
      const activeTab = createTab({ type: 'cloud-bpmn' });
      const { subscribe, callSubscriber } = createSubscribe(activeTab);

      const {
        wrapper
      } = createStartInstancePlugin({
        activeTab,
        subscribe,
        withFillSlot: true,
        keepOpen: true
      }, mount);

      // open overlay
      const statusBarBtn = wrapper.find("button[title='Start current diagram']");
      statusBarBtn.simulate('click');

      await new Promise(function(resolve) {
        setTimeout(resolve, 10);
      });

      // assume
      expect(wrapper.html().includes('form')).to.be.true;

      // then
      callSubscriber({ activeTab: createTab() });

      // expect
      expect(wrapper.html().includes('form')).to.not.be.true;
    });


    it('should close when button is clicked', async function() {

      // given
      const activeTab = createTab({ type: 'cloud-bpmn' });

      const {
        wrapper
      } = createStartInstancePlugin({
        activeTab,
        withFillSlot: true,
        keepOpen: true
      }, mount);

      // open overlay
      const statusBarBtn = wrapper.find("button[title='Start current diagram']");
      statusBarBtn.simulate('click');

      await new Promise(function(resolve) {
        setTimeout(resolve, 10);
      });

      // assume
      expect(wrapper.html().includes('form')).to.be.true;

      // then
      statusBarBtn.simulate('click');

      // expect
      expect(wrapper.html().includes('form')).to.not.be.true;
    });

  });


  describe('Operate link', function() {

    it('should display notification without link after starting process instance', async function() {

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


    it('should display notification with link after starting process instance', async function() {

      // given
      const displayNotification = sinon.spy();
      const { instance } = createStartInstancePlugin({
        displayNotification,
        deploymentEndpoint: {
          targetType: CAMUNDA_CLOUD,
          camundaCloudClusterRegion: 'region',
          camundaCloudClusterId: 'CLUSTER_ID'
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
        }
      ).to.eql(
        {
          type: 'success',
          title: 'Process instance started',
          duration: 8000
        }
      );

      expect(notification.content).to.exist;

      const notificationHTML = shallow(notification.content).html().replace(/&amp;/g, '&');

      expect(notificationHTML).to.include(
        'https://region.operate.camunda.io/CLUSTER_ID/processes/test'
      );
    });

  });

});



function createStartInstancePlugin({
  zeebeAPI = new MockZeebeAPI(),
  activeTab = createTab(),
  deployment = { name: 'Hello' },
  deploymentResult = {
    success: true,
    response: {
      deployments: [
        {
          process: {
            bpmnProcessId: 'test'
          }
        }
      ]
    }
  },
  deploymentEndpoint = {},
  ...props
} = {}, render = shallow) {
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
      body.done({
        config: {
          deployment,
          endpoint: deploymentEndpoint,
          savedTab: activeTab
        }
      });
    }

    if (key === 'deployWithConfig') {
      body.done({ deploymentResult, endpoint: deploymentEndpoint });
    }
  };

  const StartInstancePlugin = (
    <TestStartInstancePlugin
      subscribe={ props.subscribe || subscribe }
      _getGlobal={ key => key === 'zeebeAPI' && zeebeAPI }
      displayNotification={ noop }
      log={ noop }
      triggerAction={ key => key === 'save' && activeTab }
      subscribeToMessaging={ noop }
      unsubscribeFromMessaging={ noop }
      broadcastMessage={ broadcastMessage }
      { ...props }
      config={ config }
    />
  );

  const StartInstancePluginWithFillSlot = (
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      {StartInstancePlugin}
    </SlotFillRoot>
  );

  const wrapper = render(
    props.withFillSlot ? StartInstancePluginWithFillSlot : StartInstancePlugin
  );


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
      { success: true, response: { processInstanceKey: 'test' } };

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

  componentDidUpdate(...args) {
    super.componentDidUpdate && super.componentDidUpdate(...args);

    const { overlayState } = this.state;
    const {
      userAction,
      keepOpen
    } = this.props;


    if (overlayState && overlayState.isStart) {
      const action = userAction || 'start';

      const configuration = action !== 'cancel' && overlayState.configuration;

      if (!keepOpen) {
        overlayState.onClose(action, configuration);
      }
    }
  }
}

function createSubscribe(activeTab) {
  let callback = null;

  function subscribe(event, _callback) {
    if (event === 'app.activeTabChanged') {
      callback = _callback;
      callback({ activeTab });
    }
  }

  async function callSubscriber(...args) {
    if (callback) {
      await callback(...args);
    }
  }

  return {
    callSubscriber,
    subscribe
  };
}
