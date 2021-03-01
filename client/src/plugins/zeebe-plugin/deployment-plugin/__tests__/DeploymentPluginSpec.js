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

import DeploymentPlugin from '../DeploymentPlugin';

const DEPLOYMENT_CONFIG_KEY = 'zeebe-deployment-tool';
const ZEEBE_ENDPOINTS_CONFIG_KEY = 'zeebeEndpoints';


describe('<DeploymentPlugin> (Zeebe)', () => {

  it('should render', () => {
    createDeploymentPlugin();
  });


  it('should deploy', async () => {

    // given
    const deploySpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploySpy });
    const { instance } = createDeploymentPlugin({ zeebeAPI });

    // when
    await instance.deploy();

    // then
    expect(deploySpy).to.have.been.calledOnce;
  });


  it('should deploy immediately if configured', async () => {

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
      }
    };

    const { instance } = createDeploymentPlugin({
      config,
      zeebeAPI,
      userActionSpy
    });

    // when
    await instance.deploy({
      isStart: true
    });

    // then
    expect(deploySpy).to.have.been.calledOnce;
    expect(userActionSpy).to.not.have.been.called;
  });


  it('should ask for configuration - missing endpoint', async () => {

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


  it('should ask for configuration - missing deployment', async () => {

    // given
    const storedTabConfiguration = {
      endpointId: 'bar'
    };

    const storedEndpoints = [{ id: storedTabConfiguration.endpointId }];

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


  it('should ask for configuration - connection failed', async () => {

    // given
    const userActionSpy = sinon.spy();

    const storedTabConfiguration = {
      deployment: { name: 'foo' },
      endpointId: 'bar'
    };

    const config = {
      getForFile(_, key) {
        return key === DEPLOYMENT_CONFIG_KEY && storedTabConfiguration;
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
      isStart: true
    });

    // then
    expect(connectionCheckSpy).to.have.been.calledOnce;
    expect(userActionSpy).to.have.been.calledOnce;
  });


  it('should save tab before deploy', async () => {

    // given
    const config = { set: sinon.spy() };
    const { instance } = createDeploymentPlugin({ config });

    // when
    await instance.deploy();

    // then
    expect(config.set).to.have.been.called;
  });


  describe('ui', () => {

    it('should display button if there is active zeebe tab', () => {

      // given
      const { wrapper } = createDeploymentPlugin({
        activeTab: {
          type: 'cloud-bpmn'
        }
      });

      // then
      expect(wrapper.find('Button')).to.have.lengthOf(1);
    });


    it('should NOT display button if there is no active zeebe tab', () => {

      // given
      const { wrapper } = createDeploymentPlugin();

      // then
      expect(wrapper.find('Button')).to.have.lengthOf(0);
    });


    it('should NOT display button if there is no active tab', () => {

      // given
      const { wrapper } = createDeploymentPlugin();

      // then
      expect(wrapper.find('Button')).to.have.lengthOf(0);
    });
  });


  it('should use stored endpoint configuration', async () => {

    // given
    const deploySpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ deploySpy });
    const storedTabConfiguration = {
      deployment: { name: 'foo' },
      endpointId: 'bar'
    };
    const storedEndpoints = [{ id: storedTabConfiguration.endpointId }];

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
  });


  it('should save tab configuration', async () => {

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


  it('should save endpoint', async () => {

    // given
    const setEndpointsSpy = sinon.spy();
    const storedTabConfiguration = {
      deployment: { name: 'foo' },
      endpointId: 'bar'
    };
    const storedEndpoints = [{ id: storedTabConfiguration.endpointId }];

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


  it('should display notification on deployment success', async () => {

    // given
    const displayNotificationSpy = sinon.spy();
    const { instance } = createDeploymentPlugin({
      displayNotification: displayNotificationSpy
    });

    // when
    await instance.deploy();

    // then
    expect(displayNotificationSpy).to.have.been.calledWith({
      type: 'success',
      title: 'Deployment succeeded',
      duration: 4000
    });
  });


  it('should display notification on deployment failure', async () => {

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
    expect(displayNotificationSpy).to.have.been.calledWith({
      type: 'error',
      title: 'Deployment failed',
      content: 'See the log for further details.',
      duration: 10000
    });
  });


  it('should allow to deploy via message', done => {

    // given
    const subscribeToMessaging = (_, callback) => {
      callback('deploy', { done: doneCallback });
    };

    // when
    createDeploymentPlugin({ subscribeToMessaging });

    // then
    function doneCallback() {
      done();
    }
  });


  it('should pass deploymentResult=null if tab was not saved', done => {

    // given
    const subscribeToMessaging = (_, callback) => {
      callback('deploy', { done: doneCallback });
    };

    // when
    createDeploymentPlugin({ subscribeToMessaging, triggerAction: noop });

    // then
    function doneCallback(result) {
      let error;

      try {
        expect(result).to.eql({
          deploymentResult: null
        });
      } catch (err) {
        error = err;
      } finally {
        done(error);
      }
    }
  });


  it('should pass deploymentResult=null if config was not provided', done => {

    // given
    const subscribeToMessaging = (_, callback) => {
      callback('deploy', { done: doneCallback });
    };

    // when
    createDeploymentPlugin({ subscribeToMessaging, userAction: 'cancel' });

    // then
    function doneCallback(result) {
      let error;

      try {
        expect(result).to.eql({
          deploymentResult: null
        });
      } catch (err) {
        error = err;
      } finally {
        done(error);
      }
    }
  });


  it('should pass both the deployment result and endpoint config', done => {

    // given
    const deploySpy = sinon.spy();
    const deploymentResult = { success: true, response: {} };
    const zeebeAPI = new MockZeebeAPI({ deploySpy, deploymentResult });
    const subscribeToMessaging = (_, callback) => {
      callback('deploy', { done: doneCallback });
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


  it('should subscribe to messaging when mounted', () => {

    // given
    const subscribeToMessaging = sinon.spy();
    createDeploymentPlugin({ subscribeToMessaging });

    // then
    expect(subscribeToMessaging).to.have.been.calledWith('deploymentPlugin');
  });


  it('should unsubscribe from messaging when unmounted', () => {

    // given
    const unsubscribeFromMessaging = sinon.spy();
    const { wrapper } = createDeploymentPlugin({ unsubscribeFromMessaging });

    // when
    wrapper.unmount();

    // then
    expect(unsubscribeFromMessaging).to.have.been.calledWith('deploymentPlugin');
  });


  it('should not display notification if skipNotificationOnSuccess is true', async () => {

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


  describe('emit-event action', () => {

    it('should trigger deployment.done action after successful deployment', async () => {

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


    it('should send target type on deployment.done', async () => {

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
        isStart: true
      }));

      const targetType = actionSpy.getCall(0).args[0].payload.targetType;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(targetType).to.eql('selfHosted');
    });


    it('should trigger deployment.done with start instance context', async () => {

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
        isStart: true
      }));

      const context = actionSpy.getCall(0).args[0].payload.context;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(context).to.eql('startInstanceTool');
    });


    it('should not trigger deployment.done action after failed deployment', async () => {

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
      expect(actionSpy).to.not.have.been.calledOnce;
    });


    it('should trigger deployment.error action after failed deployment', async () => {

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


    it('should send target type on deployment.error', async () => {

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
        isStart: true
      }));

      const targetType = actionSpy.getCall(0).args[0].payload.targetType;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(targetType).to.eql('selfHosted');
    });


    it('should trigger deployment.done with start instance context', async () => {

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
        isStart: true
      }));

      const context = actionSpy.getCall(0).args[0].payload.context;

      // then
      expect(actionSpy).to.have.been.calledOnce;
      expect(context).to.eql('startInstanceTool');
    });



    it('should not trigger deployment.error action after successful deployment', async () => {

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
      expect(actionSpy).to.not.have.been.calledOnce;
    });

  });

});

class TestDeploymentPlugin extends DeploymentPlugin {

  /**
   * @param {object} props
   * @param {'cancel'|'deploy'} [props.userAction='deploy'] user action in configuration modal
   * @param {sinon.SinonSpy} [props.userActionSpy] spy on user configuration modal
   * @param {object} [props.endpoint] overrides for endpoint configuration
   * @param {object} [props.deployment] overrides for deployment configuration
   */
  constructor(props) {
    super(props);
  }

  // closes automatically when modal is opened
  componentDidUpdate(...args) {
    super.componentDidUpdate && super.componentDidUpdate(...args);

    const { modalState } = this.state;
    const {
      userAction,
      userActionSpy,
      endpoint,
      deployment
    } = this.props;

    if (modalState) {
      const action = userAction || 'deploy';

      if (userActionSpy) {
        userActionSpy();
      }

      const config = action !== 'cancel' && {
        endpoint: {
          ...modalState.config.endpoint,
          ...endpoint
        },
        deployment: {
          ...modalState.config.deployment,
          ...deployment
        }
      };

      modalState.onClose(config);
    }
  }
}


function createDeploymentPlugin({
  zeebeAPI = new MockZeebeAPI(),
  activeTab = createTab(),
  ...props
} = {}) {
  const subscribe = (type, callback) => {
    if (type === 'app.activeTabChanged') {
      callback({
        activeTab: activeTab || { type: 'empty', name: 'testName' }
      });
    }
  };

  const triggerAction = (event, context) => {
    switch (true) {
    case (event === 'save'):
      return activeTab;
    case (props.actionTriggered &&
      props.actionTriggered.emitEvent == event &&
      props.actionTriggered.type == context.type):
      props.actionTriggered.handler(context);
    }
  };

  const config = new Config({
    get: (_, defaultValue) => defaultValue,
    ...props.config
  });

  const wrapper = shallow(<TestDeploymentPlugin
    broadcastMessage={ noop }
    subscribeToMessaging={ noop }
    unsubscribeFromMessaging={ noop }
    triggerAction={ triggerAction }
    log={ noop }
    displayNotification={ noop }
    _getGlobal={ key => key === 'zeebeAPI' && zeebeAPI }
    subscribe={ subscribe }
    { ...props }
    config={ config }
  />);

  const instance = wrapper.instance();

  return { wrapper, instance };
}

function noop() {
  return null;
}

function MockZeebeAPI(options = {}) {

  const {
    deploySpy,
    deploymentResult,
    connectionCheckSpy,
    connectionCheckResult
  } = options;

  this.deploy = (...args) => {
    if (deploySpy) {
      deploySpy(...args);
    }

    const result = deploymentResult ||
      { success: true, response: { workflows: [ { bpmnProcessId: 'test' } ] } };

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
