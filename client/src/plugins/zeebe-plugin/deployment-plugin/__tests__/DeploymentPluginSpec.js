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

import DeploymentPlugin from '../DeploymentPlugin';
import { CAMUNDA_CLOUD, SELF_HOSTED } from '../../shared/ZeebeTargetTypes';
import { Slot, SlotFillRoot } from '../../../../app/slot-fill';
import { AUTH_TYPES } from '../../shared/ZeebeAuthTypes';

const DEPLOYMENT_CONFIG_KEY = 'zeebe-deployment-tool';
const ZEEBE_ENDPOINTS_CONFIG_KEY = 'zeebeEndpoints';


describe('<DeploymentPlugin> (Zeebe)', function() {

  it('should render', function() {
    createDeploymentPlugin();
  });


  it('should deploy', async function() {

    // given
    const deploySpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploySpy });
    const { instance } = createDeploymentPlugin({ zeebeAPI });

    // when
    await instance.deploy();

    // then
    expect(deploySpy).to.have.been.calledOnce;
  });


  it('should deploy BPMN tab with correct resource type', async function() {

    // given
    const deploySpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploySpy });
    const { instance } = createDeploymentPlugin({ zeebeAPI, activeTab: createTab({ type: 'cloud-bpmn' }) });

    // when
    await instance.deploy();

    // then
    expect(deploySpy).to.have.been.calledOnce;
    expect(deploySpy.args[0][0]).to.have.property('resourceType', 'bpmn');
  });


  it('should deploy DMN tab with correct resource type', async function() {

    // given
    const deploySpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploySpy });
    const { instance } = createDeploymentPlugin({ zeebeAPI, activeTab: createTab({ type: 'cloud-dmn' }) });

    // when
    await instance.deploy();

    // then
    expect(deploySpy).to.have.been.calledOnce;
    expect(deploySpy.args[0][0]).to.have.property('resourceType', 'dmn');
  });


  it('should deploy form tab with correct resource type', async function() {

    // given
    const deploySpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploySpy });
    const { instance } = createDeploymentPlugin({ zeebeAPI, activeTab: createTab({ type: 'cloud-form' }) });

    // when
    await instance.deploy();

    // then
    expect(deploySpy).to.have.been.calledOnce;
    expect(deploySpy.args[0][0]).to.have.property('resourceType', 'form');
  });


  it('should getGatewayVersion', async function() {

    // given
    const getGatewayVersionSpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ getGatewayVersionSpy });
    const { instance } = createDeploymentPlugin({ zeebeAPI });

    // when
    await instance.deploy();

    // then
    expect(getGatewayVersionSpy).to.have.been.calledOnce;
  });


  it('should deploy immediately if configured', async function() {

    // given
    const storedTabConfiguration = {
      deployment: { name: 'foo' },
      endpointId: 'bar'
    };

    const deploySpy = sinon.spy();

    const userActionSpy = sinon.spy();

    const zeebeAPI = new MockZeebeAPI({
      deploySpy
    });

    const config = {
      getForFile(_, key) {
        return key === DEPLOYMENT_CONFIG_KEY && storedTabConfiguration;
      },
      get(key, _) {
        return key === ZEEBE_ENDPOINTS_CONFIG_KEY && [ { targetType: SELF_HOSTED } ];
      }
    };

    const { instance } = createDeploymentPlugin({
      config,
      zeebeAPI,
      userActionSpy
    });

    // when
    await instance.deploy({
      isStart: true,
      onClose: () => {}
    });

    // then
    expect(deploySpy).to.have.been.calledOnce;
    expect(userActionSpy).not.to.have.been.called;
  });


  it('should ask for configuration - missing endpoint', async function() {

    // given
    const storedTabConfiguration = {
      deployment: { name: 'foo' }
    };

    const config = {
      getForFile(_, key) {
        return key === DEPLOYMENT_CONFIG_KEY && storedTabConfiguration;
      }
    };

    const userActionSpy = sinon.spy();

    const zeebeAPI = new MockZeebeAPI();

    const { instance } = createDeploymentPlugin({
      config,
      zeebeAPI,
      userActionSpy
    });

    // when
    await instance.deploy();

    // then
    expect(userActionSpy).to.have.been.calledOnce;
  });


  it('should ask for configuration - missing deployment', async function() {

    // given
    const storedTabConfiguration = {
      endpointId: 'bar'
    };

    const storedEndpoints = [ { id: storedTabConfiguration.endpointId } ];

    const config = {
      get(key, defaultValue) {
        return key === ZEEBE_ENDPOINTS_CONFIG_KEY ? storedEndpoints : defaultValue;
      },
      getForFile(_, key) {
        return key === DEPLOYMENT_CONFIG_KEY && storedTabConfiguration;
      }
    };

    const userActionSpy = sinon.spy();

    const zeebeAPI = new MockZeebeAPI();

    const { instance } = createDeploymentPlugin({
      config,
      zeebeAPI,
      userActionSpy
    });

    // when
    await instance.deploy();

    // then
    expect(userActionSpy).to.have.been.calledOnce;
  });


  it('should ask for configuration - connection failed', async function() {

    // given
    const userActionSpy = sinon.spy();

    const storedTabConfiguration = {
      deployment: { name: 'foo' },
      endpointId: 'bar'
    };

    const config = {
      getForFile(_, key) {
        return key === DEPLOYMENT_CONFIG_KEY && storedTabConfiguration;
      },
      get(key, _) {
        return key === ZEEBE_ENDPOINTS_CONFIG_KEY && [ { targetType: SELF_HOSTED } ];
      }
    };

    const connectionCheckResult = { success: false };

    const connectionCheckSpy = sinon.spy();

    const zeebeAPI = new MockZeebeAPI({
      connectionCheckSpy,
      connectionCheckResult
    });

    const { instance } = createDeploymentPlugin({
      config,
      zeebeAPI,
      userActionSpy
    });

    // when
    await instance.deploy({
      isStart: true,
      onClose: () => {}
    });

    // then
    expect(connectionCheckSpy).to.have.been.calledOnce;
    expect(userActionSpy).to.have.been.calledOnce;
  });


  it('should save tab before deploy', async function() {

    // given
    const config = { set: sinon.spy() };
    const { instance } = createDeploymentPlugin({ config });

    // when
    await instance.deploy();

    // then
    expect(config.set).to.have.been.called;
  });


  it('should save tab on close', async function() {

    // given
    const config = { set: sinon.spy() };
    const { instance } = createDeploymentPlugin({ config, userAction: 'cancel' });

    // when
    await instance.deploy();

    // then
    expect(config.set).to.have.been.calledOnce;
  });


  describe('default endpoint', function() {

    it('should add null credential values if remember credentials was turned off', async function() {

      // given
      const getDefaultEndpointSpy = sinon.stub();
      const { instance } = createDeploymentPlugin({ getEndpointSpy: getDefaultEndpointSpy });

      // when
      await instance.deploy();

      // then
      expect(getDefaultEndpointSpy.args[0][0]).to.have.property('basicAuthUsername', '');
      expect(getDefaultEndpointSpy.args[0][0]).to.have.property('basicAuthPassword', '');
      expect(getDefaultEndpointSpy.args[0][0]).to.have.property('clientId', '');
      expect(getDefaultEndpointSpy.args[0][0]).to.have.property('clientSecret', '');
      expect(getDefaultEndpointSpy.args[0][0]).to.have.property('camundaCloudClientId', '');
      expect(getDefaultEndpointSpy.args[0][0]).to.have.property('camundaCloudClientSecret', '');
    });

  });


  describe('ui', function() {

    const BUTTON_SELECTOR = '[title="Deploy current diagram"]';


    it('should display button if there is active Cloud BPMN tab', function() {

      // given
      const { wrapper } = createDeploymentPlugin({
        activeTab: {
          type: 'cloud-bpmn'
        }
      });

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(1);
    });


    it('should display button if there is active Cloud DMN tab', function() {

      // given
      const { wrapper } = createDeploymentPlugin({
        activeTab: {
          type: 'cloud-dmn'
        }
      });

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(1);
    });


    it('should NOT display button if there is no active zeebe tab', function() {

      // given
      const { wrapper } = createDeploymentPlugin({ activeTab: createTab({ type: 'form' }) });

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(0);
    });


    it('should NOT display button if there is no active tab', function() {

      // given
      const { wrapper } = createDeploymentPlugin({ activeTab: null });

      // then
      expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(0);
    });


    describe('overlay', function() {

      it('should open', async function() {

        // given
        const activeTab = createTab({ type: 'cloud-bpmn' });

        const {
          wrapper
        } = createDeploymentPlugin({
          activeTab,
          withFillSlot: true,
          keepOpen: true
        }, mount);

        // when
        const statusBarBtn = wrapper.find("button[title='Deploy current diagram']");
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
        } = createDeploymentPlugin({
          activeTab,
          subscribe,
          withFillSlot: true,
          keepOpen: true
        }, mount);

        // open overlay
        const statusBarBtn = wrapper.find("button[title='Deploy current diagram']");
        statusBarBtn.simulate('click');

        await new Promise(function(resolve) {
          setTimeout(resolve, 10);
        });

        // assume
        expect(wrapper.html().includes('form')).to.be.true;

        // then
        callSubscriber({ activeTab: createTab() });

        // expect
        expect(wrapper.html().includes('form')).not.to.be.true;
      });

    });
  });


  it('should use stored endpoint configuration', async function() {

    // given
    const deploySpy = sinon.spy();
    const getGatewayVersionSpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploySpy, getGatewayVersionSpy });
    const storedTabConfiguration = {
      deployment: { name: 'foo' },
      endpointId: 'bar'
    };
    const storedEndpoints = [ { id: storedTabConfiguration.endpointId } ];

    const config = {
      get(key, defaultValue) {
        return key === ZEEBE_ENDPOINTS_CONFIG_KEY ? storedEndpoints : defaultValue;
      },
      getForFile(_, key) {
        return key === DEPLOYMENT_CONFIG_KEY && storedTabConfiguration;
      }
    };

    const { instance } = createDeploymentPlugin({ zeebeAPI, config });

    // when
    await instance.deploy();

    // then
    expect(deploySpy).to.have.been.calledOnce;
    expect(deploySpy.args[0][0].endpoint).to.have.property('id', storedEndpoints[0].id);

    expect(getGatewayVersionSpy).to.have.been.calledOnce;
    expect(getGatewayVersionSpy.args[0][0]).to.have.property('id', storedEndpoints[0].id);
  });


  it('should migrate clusterID given no clusterURL', async function() {

    // given
    const deploySpy = sinon.spy();
    const getGatewayVersionSpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploySpy, getGatewayVersionSpy });
    const storedTabConfiguration = {
      deployment: { name: 'foo' },
      camundaCloudClusterId: '1234-abcd'
    };
    const storedEndpoints = [ {
      camundaCloudClusterId: storedTabConfiguration.camundaCloudClusterId
    } ];

    const config = {
      get(key, defaultValue) {
        return key === ZEEBE_ENDPOINTS_CONFIG_KEY ? storedEndpoints : defaultValue;
      },
      getForFile(_, key) {
        return key === DEPLOYMENT_CONFIG_KEY && storedTabConfiguration;
      }
    };

    const { instance } = createDeploymentPlugin({ zeebeAPI, config });

    // when
    await instance.deploy();

    // then
    expect(deploySpy).to.have.been.calledOnce;
    expect(deploySpy.args[0][0].endpoint).to.have.property('camundaCloudClusterUrl',
      '1234-abcd.bru-2.zeebe.camunda.io:443');

    expect(getGatewayVersionSpy).to.have.been.calledOnce;
    expect(getGatewayVersionSpy.args[0][0]).to.have.property('camundaCloudClusterUrl',
      '1234-abcd.bru-2.zeebe.camunda.io:443');
  });


  it('should save tab configuration', async function() {

    // given
    const setConfigSpy = sinon.spy();
    const activeTab = createTab();

    const { instance } = createDeploymentPlugin({ activeTab, config: { setForFile: setConfigSpy } });

    // when
    await instance.deploy();

    // then
    expect(setConfigSpy).to.have.been.calledOnce;
    expect(setConfigSpy.args[0][0]).to.eql(activeTab.file);
  });


  it('should save endpoint', async function() {

    // given
    const setEndpointsSpy = sinon.spy();
    const storedTabConfiguration = {
      deployment: { name: 'foo' },
      endpointId: 'bar'
    };
    const storedEndpoints = [ { id: storedTabConfiguration.endpointId } ];

    const config = {
      set: setEndpointsSpy,
      get(key, defaultValue) {
        return key === ZEEBE_ENDPOINTS_CONFIG_KEY ? storedEndpoints : defaultValue;
      },
      getForFile(_, key) {
        return key === DEPLOYMENT_CONFIG_KEY && storedTabConfiguration;
      }
    };

    const { instance } = createDeploymentPlugin({ config });

    // when
    await instance.deploy();

    // then
    expect(setEndpointsSpy).to.have.been.calledOnce;
    expect(setEndpointsSpy.args[0][1][0]).to.have.property('id', storedTabConfiguration.endpointId);
  });


  it('should display notification without link on deployment success', async function() {

    // given
    const displayNotificationSpy = sinon.spy();
    const { instance } = createDeploymentPlugin({
      displayNotification: displayNotificationSpy,
      endpoint: {
        targetType: SELF_HOSTED
      },
    });

    // when
    await instance.deploy();

    // then
    expect(displayNotificationSpy).to.have.been.calledWith({
      type: 'success',
      title: 'Process definition deployed',
      content: null,
      duration: 8000
    });
  });


  it('should display notification without link on DMN deployment success', async function() {

    // given
    const displayNotificationSpy = sinon.spy();
    const { instance } = createDeploymentPlugin({
      displayNotification: displayNotificationSpy,
      activeTab: createTab({ type: 'cloud-dmn' }),
      endpoint: {
        targetType: SELF_HOSTED
      }
    });

    // when
    await instance.deploy();

    // then
    expect(displayNotificationSpy).to.have.been.calledWith({
      type: 'success',
      title: 'Decision definition deployed',
      content: null,
      duration: 8000
    });
  });


  it('should display notification with link after deployment to Cloud success', async function() {

    // given
    const displayNotification = sinon.spy();
    const { instance } = createDeploymentPlugin({
      displayNotification,
      endpoint: {
        targetType: CAMUNDA_CLOUD,
        camundaCloudClusterRegion: 'region',
        camundaCloudClusterId: 'CLUSTER_ID'
      }
    });

    // when
    await instance.deploy();

    // then
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
        title: 'Process definition deployed',
        duration: 8000
      }
    );

    expect(notification.content).to.exist;

    const notificationHTML = shallow(notification.content).html().replace(/&amp;/g, '&');

    expect(notificationHTML).to.include(
      'https://region.operate.camunda.io/CLUSTER_ID/processes?process=test&version=1&active=true&incidents=true'
    );
  });


  it('should display notification without link after DMN deployment to Cloud success', async function() {

    // given
    const displayNotification = sinon.spy();
    const { instance } = createDeploymentPlugin({
      zeebeAPI: new MockZeebeAPI({
        deploymentResult: {
          success: true,
          response: {
            deployments: []
          }
        }
      }),
      displayNotification,
      endpoint : {
        targetType: CAMUNDA_CLOUD,
        camundaCloudClusterUrl: 'clusterId.region.zeebe.camunda.io',
        camundaCloudClusterRegion:'region'
      },
      activeTab: createTab({ type: 'cloud-dmn' })
    });

    // when
    await instance.deploy();

    // then
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
        title: 'Decision definition deployed',
        duration: 8000
      }
    );

    expect(shallow(notification.content).isEmptyRender()).to.be.true;
  });


  it('should display notification on deployment failure', async function() {

    // given
    const displayNotificationSpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploymentResult: { success: false, response: {} } });
    const { instance } = createDeploymentPlugin({
      displayNotification: displayNotificationSpy,
      zeebeAPI
    });

    // when
    await instance.deploy();

    // then
    expect(displayNotificationSpy).to.have.been.calledOnce;

    const notification = displayNotificationSpy.getCall(0).args[0];

    expect(
      {
        type: notification.type,
        title: notification.title,
        duration: notification.duration,
        contentType: notification.content.type
      }).to.eql(
      {
        type: 'error',
        title: 'Deployment failed',
        duration: 4000,
        contentType: 'button'
      }
    );
  });


  it('should open log via deployment failure notification', async function() {

    // given
    const displayNotificationSpy = sinon.spy();
    const logSpy = sinon.spy();

    const mockResult = { success: false, response: { details:'some error' } };
    const zeebeAPI = new MockZeebeAPI({ deploymentResult: mockResult });

    const actionSpy = sinon.spy(),
          actionTriggered = {
            emitEvent: 'open-log',
            handler: actionSpy
          };

    const { instance } = createDeploymentPlugin({
      displayNotification: displayNotificationSpy,
      actionTriggered,
      zeebeAPI,
      log: logSpy
    });

    // when
    await instance.deploy();

    // then
    expect(displayNotificationSpy).to.have.been.calledOnce;
    const notification = displayNotificationSpy.getCall(0).args[0];
    expect(logSpy).to.have.been.calledOnceWith({
      category: 'deploy-error',
      message: mockResult.response.details,
      silent: true
    });

    expect(actionSpy).not.to.have.been.called;
    notification.content.props.onClick();
    expect(actionSpy).to.have.been.calledOnce;

  });


  it('should allow to get deploy config via message', function(done) {

    const body = {
      isStart: true,
      skipNotificationOnSuccess: true,
      done: doneCallback,
      notifyResult: true
    };

    // given
    const subscribeToMessaging = (_, callback) => {
      callback('getDeployConfig', body);
    };

    // when
    createDeploymentPlugin({ subscribeToMessaging });

    // then
    function doneCallback() {
      done();
    }
  });


  it('should allow to deploy with config via message', function(done) {

    const body = {
      done: doneCallback,
      deploymentConfig: {
        config: { deployment:{ name:'foo' } , endpoint:{} },
        savedTab: { id: 1, name: 'foo.bar', type: 'bar', title: 'unsaved', file: {} }
      }
    };

    // given
    const subscribeToMessaging = (_, callback) => {
      callback('deployWithConfig', body);
    };

    // when
    createDeploymentPlugin({ subscribeToMessaging });

    // then
    function doneCallback() {
      done();
    }
  });


  it('should pass null if tab was not saved', function(done) {

    const body = {
      isStart: true,
      skipNotificationOnSuccess: true,
      done: doneCallback,
      notifyResult: true
    };

    // given
    const subscribeToMessaging = (_, callback) => {
      callback('getDeployConfig', body);
    };

    // when
    createDeploymentPlugin({ subscribeToMessaging, triggerAction: noop });

    // then
    function doneCallback(result) {
      let error;

      try {
        expect(result).to.be.null;
      } catch (err) {
        error = err;
      } finally {
        done(error);
      }
    }
  });


  it('should pass null if config was not provided', function(done) {

    const body = {
      isStart: true,
      skipNotificationOnSuccess: true,
      done: doneCallback,
      notifyResult: true
    };

    // given
    const subscribeToMessaging = (_, callback) => {
      callback('getDeployConfig', body);
    };

    // when
    createDeploymentPlugin({ subscribeToMessaging, userAction: 'cancel' });

    // then
    function doneCallback(result) {
      let error;

      try {
        expect(result).to.be.null;
      } catch (err) {
        error = err;
      } finally {
        done(error);
      }
    }
  });


  it('should pass both the deployment result and endpoint config', function(done) {

    // given
    const deploySpy = sinon.spy();
    const deploymentResult = { success: true, response: {} };
    const zeebeAPI = new MockZeebeAPI({ deploySpy, deploymentResult });

    const body = {
      done: doneCallback,
      deploymentConfig: {
        config: { deployment:{ name:'foo' } , endpoint:{} },
        savedTab: { id: 1, name: 'foo.bar', type: 'bar', title: 'unsaved', file: {} }
      }
    };

    const subscribeToMessaging = (_, callback) => {
      callback('deployWithConfig', body);
    };

    // when
    createDeploymentPlugin({ subscribeToMessaging, zeebeAPI });

    // then
    function doneCallback(result) {
      let error;

      try {
        expect(result).to.eql({
          deploymentResult,
          endpoint: deploySpy.args[0][0].endpoint
        });
      } catch (err) {
        error = err;
      } finally {
        done(error);
      }
    }
  });


  it('should subscribe to messaging when mounted', function() {

    // given
    const subscribeToMessaging = sinon.spy();
    createDeploymentPlugin({ subscribeToMessaging });

    // then
    expect(subscribeToMessaging).to.have.been.calledWith('deploymentPlugin');
  });


  it('should unsubscribe from messaging when unmounted', function() {

    // given
    const unsubscribeFromMessaging = sinon.spy();
    const { wrapper } = createDeploymentPlugin({ unsubscribeFromMessaging });

    // when
    wrapper.unmount();

    // then
    expect(unsubscribeFromMessaging).to.have.been.calledWith('deploymentPlugin');
  });


  it('should not display notification if skipNotificationOnSuccess is true', async function() {

    // given
    const displayNotificationSpy = sinon.spy();
    const { instance } = createDeploymentPlugin({
      displayNotification: displayNotificationSpy
    });

    // when
    await instance.deploy({ skipNotificationOnSuccess: true });

    // then
    expect(displayNotificationSpy).not.to.have.been.called;
  });


  describe('emit-event action', function() {

    it('should trigger deployment.done action after successful deployment', async function() {

      // given
      const deploymentResult = {
        success: true
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.done',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy();

      // then
      expect(actionSpy).to.have.been.calledOnce;
    });


    it('should send target type on deployment.done', async function() {

      // given
      const deploymentResult = {
        success: true
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.done',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy(({
        isStart: true,
        onClose: () => {}
      }));

      const targetType = actionSpy.getCall(0).args[0].payload.targetType;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(targetType).to.eql('camundaCloud');
    });


    it('should send deployedTo on deployment.done', async function() {

      // given
      const deploymentResult = {
        success: true
      };

      const getGatewayVersionResult = {
        success: true,
        response: {
          gatewayVersion: '1.33.7'
        }
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult, getGatewayVersionResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.done',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy(({
        isStart: true,
        onClose: () => {}
      }));

      const deployedTo = actionSpy.getCall(0).args[0].payload.deployedTo;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(deployedTo.executionPlatformVersion).to.eql('1.33.7');
      expect(deployedTo.executionPlatform).to.eql('Camunda Cloud');
    });


    it('should trigger deployment.done with start instance context, successful deplyoyment', async function() {

      // given
      const deploymentResult = {
        success: true
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.done',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy(({
        isStart: true,
        onClose: () => {}
      }));

      const context = actionSpy.getCall(0).args[0].payload.context;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(context).to.eql('startInstanceTool');
    });


    it('should not trigger deployment.done action after failed deployment', async function() {

      // given
      const deploymentResult = {
        success: false,
        response: {
          code: 3
        }
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.done',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy();

      // then
      expect(actionSpy).not.to.have.been.called;
    });


    it('should trigger deployment.error action after failed deployment', async function() {

      // given
      const deploymentResult = {
        success: false,
        response: {
          code: 3
        }
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.error',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy();

      // then
      expect(actionSpy).to.have.been.calledOnce;
    });


    it('should send target type on deployment.error', async function() {

      // given
      const deploymentResult = {
        success: false,
        response: {}
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.error',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy(({
        isStart: true,
        onClose: () => {}
      }));

      const targetType = actionSpy.getCall(0).args[0].payload.targetType;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(targetType).to.eql('camundaCloud');
    });


    it('should send deployedTo on deployment.error given getGatewayVersion was successful', async function() {

      // given
      const deploymentResult = {
        success: false,
        response: {}
      };

      const getGatewayVersionResult = {
        success: true,
        response: {
          gatewayVersion: '1.33.7'
        }
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult, getGatewayVersionResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.error',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy(({
        isStart: true,
        onClose: () => {}
      }));

      const deployedTo = actionSpy.getCall(0).args[0].payload.deployedTo;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(deployedTo.executionPlatformVersion).to.eql('1.33.7');
      expect(deployedTo.executionPlatform).to.eql('Camunda Cloud');
    });


    it('should not send deployedTo on deployment.error given getGatewayVersion was not successful', async function() {

      // given
      const deploymentResult = {
        success: false,
        response: {}
      };

      const getGatewayVersionResult = {
        success: false,
        response: { }
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult, getGatewayVersionResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.error',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy(({
        isStart: true,
        onClose: () => {}
      }));

      const deployedTo = actionSpy.getCall(0).args[0].payload.deployedTo;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(deployedTo).not.to.exist;
    });


    it('should trigger deployment.done with start instance context, unsuccessful deplyoyment', async function() {

      // given
      const deploymentResult = {
        success: false,
        response: {}
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.error',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy(({
        isStart: true,
        onClose: () => {}
      }));

      const context = actionSpy.getCall(0).args[0].payload.context;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(context).to.eql('startInstanceTool');
    });



    it('should not trigger deployment.error action after successful deployment', async function() {

      // given
      const deploymentResult = {
        success: true
      };

      const zeebeAPI = new MockZeebeAPI({ deploymentResult });

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.error',
              handler: actionSpy
            };

      const { instance } = createDeploymentPlugin({
        actionSpy,
        actionTriggered,
        zeebeAPI
      });

      // when
      await instance.deploy();

      // then
      expect(actionSpy).not.to.have.been.calledOnce;
    });

  });

});

class TestDeploymentPlugin extends DeploymentPlugin {

  /**
   * @param {object} props
   * @param {'cancel'|'deploy'} [props.userAction='deploy'] user action in configuration overlay
   * @param {sinon.SinonSpy} [props.userActionSpy] spy on user configuration overlay
   * @param {object} [props.endpoint] overrides for endpoint configuration
   * @param {object} [props.deployment] overrides for deployment configuration
   */
  constructor(props) {
    super(props);
  }

  // closes automatically when overlay is opened
  componentDidUpdate(...args) {
    super.componentDidUpdate && super.componentDidUpdate(...args);

    const { overlayState } = this.state;
    const {
      userAction,
      userActionSpy,
      endpoint,
      deployment,
      keepOpen
    } = this.props;

    if (overlayState) {
      if (userActionSpy) {
        userActionSpy();
      }

      const config = {
        endpoint: {
          ...overlayState.config.endpoint,
          ...endpoint
        },
        deployment: {
          ...overlayState.config.deployment,
          ...deployment
        }
      };

      if (!keepOpen) {
        overlayState.onClose(config, userAction);
      }
    }
  }

  getEndpoints() {
    if (this.props.getEndpointSpy) {
      return [ {
        id: 'id',
        targetType: CAMUNDA_CLOUD,
        authType: AUTH_TYPES.OAUTH,
        contactPoint: '',
        oauthURL: 'url',
        audience: 'audience',
        scope: 'scope',
        rememberCredentials: false
      } ];
    }
    else return super.getEndpoints();
  }

  async getDefaultEndpoint() {
    const { getEndpointSpy } = this.props;
    const endpoint = await super.getDefaultEndpoint();

    if (getEndpointSpy) {
      getEndpointSpy(endpoint);
    }
    return endpoint;
  }
}


function createDeploymentPlugin({
  zeebeAPI = new MockZeebeAPI(),
  activeTab = createTab(),
  ...props
} = {}, render = shallow) {
  const subscribe = (type, callback) => {
    if (type === 'app.activeTabChanged') {
      callback({
        activeTab: activeTab || { type: 'empty', name: 'testName' }
      });
    }
  };

  const triggerAction = (event, context) => {

    if (event === 'save') {
      return activeTab;
    }

    if (
      props.actionTriggered &&
      props.actionTriggered.emitEvent === event &&
      props.actionTriggered.type === (context ? context.type : undefined)
    ) {
      props.actionTriggered.handler(context);
    }
  };

  const config = new Config({
    get: (_, defaultValue) => defaultValue,
    ...props.config
  });

  const DeploymentPlugin = (
    <TestDeploymentPlugin
      broadcastMessage={ noop }
      subscribeToMessaging={ noop }
      unsubscribeFromMessaging={ noop }
      triggerAction={ triggerAction }
      log={ noop }
      displayNotification={ noop }
      _getGlobal={ key => key === 'zeebeAPI' && zeebeAPI }
      subscribe={ props.subcribe || subscribe }
      getEndpointSpy={ props.getEndpointSpy }
      { ...props }
      config={ config } />
  );

  const DeploymentPluginWithFillSlot = (
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      {DeploymentPlugin}
    </SlotFillRoot>
  );

  const wrapper = render(
    props.withFillSlot ? DeploymentPluginWithFillSlot : DeploymentPlugin
  );

  const instance = wrapper.instance();

  return { wrapper, instance };
}

function noop() {
  return null;
}

function MockZeebeAPI(options = {}) {

  const {
    connectionCheckSpy,
    connectionCheckResult,
    deploySpy,
    deploymentResult,
    getGatewayVersionResult,
    getGatewayVersionSpy
  } = options;

  this.deploy = (...args) => {

    if (deploySpy) {
      deploySpy(...args);
    }

    const result = deploymentResult || {
      success: true,
      response: {
        deployments: [
          {
            process: {
              bpmnProcessId: 'test',
              version: 1
            }
          }
        ]
      }
    };

    return Promise.resolve(result);
  };

  this.checkConnection = (...args) => {
    if (connectionCheckSpy) {
      connectionCheckSpy(...args);
    }

    const result = connectionCheckResult ||
      { success: true, response: {} };

    return Promise.resolve(result);
  };

  this.getGatewayVersion = (...args) => {
    if (getGatewayVersionSpy) {
      getGatewayVersionSpy(...args);
    }

    const result = getGatewayVersionResult ||
      { success: true, response: { gatewayVersion: '0.26.0' } };

    return Promise.resolve(result);
  };

}

function createTab(overrides = {}) {
  return {
    id: 42,
    name: 'foo.bar',
    type: 'cloud-bpmn',
    title: 'unsaved',
    file: {
      name: 'foo.bar',
      contents: '',
      path: null
    },
    ...overrides
  };
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
