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
import {
  omit
} from 'min-dash';

import { Config } from './../../../../app/__tests__/mocks';

import DeploymentTool from '../DeploymentTool';
import AuthTypes from '../../shared/AuthTypes';
import { DeploymentError,
  ConnectionError } from '../../shared/CamundaAPI';


const CONFIG_KEY = 'deployment-tool';
const ENGINE_ENDPOINTS_CONFIG_KEY = 'camundaEngineEndpoints';

const SPRING_DEFAULT_URL = 'http://localhost:8080/rest';
const TOMCAT_DEFAULT_URL = 'http://localhost:8080/engine-rest';


describe('<DeploymentTool>', () => {

  let fetch;

  beforeEach(() => {
    fetch = sinon.stub(window, 'fetch').rejects(new Error('fetch is disabled'));
  });


  afterEach(() => {
    fetch.restore();
  });


  it('should render', () => {
    createDeploymentTool();
  });


  it('should display the button if there is an active tab', () => {

    // given
    const activeTab = createTab({ type: 'bpmn' });

    // when
    const { wrapper } = createDeploymentTool({ activeTab });

    // then
    expect(wrapper.find('Button')).to.have.lengthOf(1);
  });


  it('should NOT display the button if there is no active tab', () => {

    // given
    const activeTab = createTab({ type: 'empty', id: '__empty' });

    // when
    const { wrapper } = createDeploymentTool({ activeTab });

    // then
    expect(wrapper.find('Button')).to.have.lengthOf(0);
  });


  it('should NOT display the button if there is no camunda tab', () => {

    // given
    const activeTab = createTab();

    // when
    const { wrapper } = createDeploymentTool({ activeTab });

    // then
    expect(wrapper.find('Button')).to.have.lengthOf(0);
  });


  describe('deploy', () => {

    it('should derive deployment name from filename', async () => {

      // given
      const deploySpy = sinon.spy();
      const activeTab = createTab({ name: 'foo.bpmn' });
      const {
        instance
      } = createDeploymentTool({ activeTab, deploySpy });

      // when
      await instance.deploy();

      // then
      expect(deploySpy).to.have.been.calledOnce;
      expect(deploySpy.args[0][1].deployment).to.have.property('name', 'foo');
    });


    it('should use saved config for deployed file', async () => {

      // given
      const savedEndpoint = {
        id: 'endpointId',
        authType: AuthTypes.basic,
        username: 'demo',
        password: 'demo',
        url: 'http://localhost:8088/engine-rest',
        rememberCredentials: true
      };

      const savedConfiguration = {
        deployment: {
          name: 'diagram',
          tenantId: '',
          attachments: []
        },
        endpointId: savedEndpoint.id
      };

      const config = {
        get: (key, defaultValue) => {
          if (key === ENGINE_ENDPOINTS_CONFIG_KEY) {
            return [
              { id: 'OTHER_ENDPOINT' },
              savedEndpoint
            ];
          }

          return defaultValue;
        },
        getForFile: sinon.stub().returns(savedConfiguration)
      };

      const deploySpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createDeploymentTool({ activeTab, config, deploySpy });

      // when
      await instance.deployTab(activeTab);

      // then
      expect(deploySpy).to.have.been.calledOnce;
      expect(deploySpy.args[0]).to.eql([
        activeTab,
        {
          deployment: savedConfiguration.deployment,
          endpoint: savedEndpoint
        }
      ]);
    });


    it('should read and save config for deployed file', async () => {

      // given
      const config = {
        getForFile: sinon.spy(),
        setForFile: sinon.spy()
      };

      const configuration = createConfiguration();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createDeploymentTool({ activeTab, config, ...configuration });

      // when
      await instance.deploy();

      // then
      expect(config.getForFile).to.have.been.calledOnce;
      expect(config.getForFile.args[0]).to.eql([
        activeTab.file,
        CONFIG_KEY
      ]);

      expect(config.setForFile).to.have.been.calledOnce;
      expect(config.setForFile.args[0]).to.eql([
        activeTab.file,
        CONFIG_KEY,
        { ...omit(configuration, [ 'endpoint' ]), endpointId: configuration.endpoint.id }
      ]);
    });


    it('should deploy with saved attachments', async () => {

      // given
      const file = {
        path: '/file/path/user.form',
        name: 'user.form',
        contents: []
      };
      const attachments = [{
        path: file.path
      }];
      const configuration = createConfiguration({ attachments });
      const config = {
        get(key, defaultValue) {
          return key === ENGINE_ENDPOINTS_CONFIG_KEY ?
            [ configuration.endpoint ] : defaultValue;
        },
        getForFile() {
          return createSavedConfiguration(configuration);
        }
      };
      const fileSystem = {
        readFile() {
          return file;
        }
      };

      const activeTab = createTab({ name: 'foo.bpmn' });
      const deploySpy = sinon.spy();

      const {
        instance
      } = createDeploymentTool({ activeTab, deploySpy, config, fileSystem });

      // when
      await instance.deploy();

      // then
      expect(deploySpy).to.have.been.calledOnce;

      const { attachments: deployedAttachments } = deploySpy.args[0][1].deployment;

      expect(deployedAttachments[0]).have.property('name', file.name);
      expect(deployedAttachments[0]).have.property('path', file.path);
      expect(deployedAttachments[0]).have.property('contents');
    });


    it('should deploy with user-provided configuration if file read fails', async () => {

      // given
      const file = {
        path: '/file/path/user.form',
        name: 'user.form',
        contents: []
      };
      const attachments = [{
        path: file.path
      }];
      const savedConfiguration = createConfiguration({ attachments });
      const config = {
        get(key, defaultValue) {
          return key === ENGINE_ENDPOINTS_CONFIG_KEY ?
            [ savedConfiguration.endpoint ] : defaultValue;
        },
        getForFile() {
          return createSavedConfiguration(savedConfiguration);
        }
      };
      const fileSystem = {
        readFile() {
          throw new Error('file not found');
        }
      };

      const activeTab = createTab({ name: 'foo.bpmn' });
      const deploySpy = sinon.spy();
      const deployment = { ...savedConfiguration.deployment, attachments: [ file ] };

      const {
        instance
      } = createDeploymentTool({ activeTab, deploySpy, config, fileSystem, deployment });

      // when
      await instance.deploy();

      // then
      expect(deploySpy).to.have.been.calledOnce;

      const { attachments: deployedAttachments } = deploySpy.args[0][1].deployment;

      expect(deployedAttachments[0]).have.property('name', file.name);
      expect(deployedAttachments[0]).have.property('path', file.path);
      expect(deployedAttachments[0]).have.property('contents');
      expect(deployedAttachments[0].contents).not.to.be.null;
    });


    it('should save credentials', async () => {

      // given
      const config = {
        set: sinon.spy()
      };

      const configuration = createConfiguration();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createDeploymentTool({ activeTab, config, ...configuration });

      // when
      await instance.deploy();

      // then
      expect(config.set).to.have.been.calledOnce;
      expect(config.set.args[0]).to.eql([
        ENGINE_ENDPOINTS_CONFIG_KEY,
        [ configuration.endpoint ]
      ]);
    });


    it('should not save credentials if `rememberCredentials` was set to false', async () => {

      // given
      const config = {
        set: sinon.spy()
      };

      const configuration = createConfiguration(null, {
        rememberCredentials: false
      });

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createDeploymentTool({ activeTab, config, ...configuration });

      // when
      await instance.deploy();

      // then
      expect(config.set).to.have.been.calledOnce;
      expect(config.set.args[0]).to.eql([
        ENGINE_ENDPOINTS_CONFIG_KEY,
        [ omit(configuration.endpoint, ['username', 'password']) ]
      ]);
    });


    it('should save process definition after deployment', async () => {

      // given
      const deployedProcessDefinition = { id: 'foo' };

      const config = {
        setForFile: sinon.spy()
      };

      const deployStub = sinon.stub().returns({ deployedProcessDefinition });

      const configuration = createConfiguration();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createDeploymentTool({ activeTab, config, deploySpy: deployStub, ...configuration });

      // when
      await instance.deploy();

      // then
      expect(config.setForFile).to.have.been.calledTwice;

      // 0: deployment-tool, 1: process-definition
      expect(config.setForFile.args[1][2]).to.eql(deployedProcessDefinition);
    });


    it('should handle deployment error given a DeploymentError', async () => {

      // given
      const deploymentErrorSpy = sinon.spy(),
            configuration = createConfiguration(),
            activeTab = createTab({ name: 'foo.bpmn' });

      const errorThrown = new DeploymentError({ status: 500 });

      const {
        instance
      } = createDeploymentTool({ activeTab, errorThrown, deploymentErrorSpy, ...configuration });

      // when
      await instance.deploy();

      // then
      expect(deploymentErrorSpy).to.have.been.calledOnce;
    });


    it('should not handle deployment error given a non DeploymentError', async () => {

      // given
      const deploymentErrorSpy = sinon.spy(),
            configuration = createConfiguration(),
            activeTab = createTab({ name: 'foo.bpmn' });

      const errorThrown = [
        new ConnectionError({ status: 500 }),
        new Error()
      ];

      for (let i = 0; i < errorThrown.length; i++) {

        // given
        const {
          instance
        } = createDeploymentTool({ activeTab, errorThrown: errorThrown[i], deploymentErrorSpy, ...configuration });

        let error;

        // when
        try {
          await instance.deploy();
        } catch (e) {
          error = e;
        }

        // then
        expect(error).to.equal(errorThrown[i]);
        expect(deploymentErrorSpy).to.not.have.been.called;
      }
    });


    describe('emit-event action', () => {

      it('should trigger deployment.done action after successful deployment', async () => {

        // given
        const configuration = createConfiguration(),
              activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.done',
                handler:actionSpy
              };

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, ...configuration });

        // when
        await instance.deploy();

        // then
        expect(actionSpy).to.have.been.calledOnce;
      });


      it('should not trigger deployment.done action after failed deployment', async () => {

        // given
        const configuration = createConfiguration(),
              activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.done',
                handler:actionSpy
              };

        const errorThrown = new DeploymentError({ status: 500 });

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, errorThrown, ...configuration });

        // when
        await instance.deploy();

        // then
        expect(actionSpy).to.not.have.been.called;
      });


      it('should trigger deployment.error action after failed deployment', async () => {

        // given
        const configuration = createConfiguration(),
              activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.error',
                handler:actionSpy
              };

        const errorThrown = new DeploymentError({ status: 500 });

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, errorThrown, ...configuration });

        // when
        await instance.deploy();

        // then
        expect(actionSpy).to.have.been.calledOnce;
      });


      it('should not trigger deployment.error action after successful deployment', async () => {

        // given
        const configuration = createConfiguration(),
              activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.error',
                handler:actionSpy
              };

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, ...configuration });

        // when
        await instance.deploy();

        // then
        expect(actionSpy).to.not.have.been.called;
      });
    });


    describe('default url', () => {

      it('should use Spring-specific endpoint url per default', async () => {

        // given
        const deploySpy = sinon.spy();
        const activeTab = createTab({ name: 'foo.bpmn' });
        const {
          instance
        } = createDeploymentTool({ activeTab, deploySpy });

        // when
        await instance.deploy();

        // then
        expect(deploySpy).to.have.been.calledOnce;
        expect(deploySpy.args[0][1].endpoint).to.have.property('url', SPRING_DEFAULT_URL);
      });


      it('should use Tomcat-specific endpoint url if can be connected to', async () => {

        // given
        const deploySpy = sinon.spy(),
              activeTab = createTab({ name: 'foo.bpmn' });
        const {
          instance
        } = createDeploymentTool({
          activeTab,
          deploySpy
        });

        instance.validator.validateConnectionWithoutCredentials = () => new Promise((resolve) => {
          resolve(null);
        });

        // when
        await instance.deploy();

        // then
        expect(deploySpy).to.have.been.calledOnce;
        expect(deploySpy.args[0][1].endpoint).to.have.property('url', TOMCAT_DEFAULT_URL);
      });
    });

  });


  describe('save', () => {

    it('should save configuration when user decided to only save it', async () => {

      // given
      const configuration = createConfiguration();
      const activeTab = createTab({ name: 'foo.bpmn' });

      const config = {
        set: sinon.spy(),
        setForFile: sinon.spy()
      };

      const {
        instance
      } = createDeploymentTool({ config, userAction: 'save', ...configuration });

      // when
      await instance.deploy();

      // then
      expect(config.set).to.have.been.calledOnce;
      expect(config.set.args[0]).to.eql([
        ENGINE_ENDPOINTS_CONFIG_KEY,
        [ configuration.endpoint ]
      ]);

      expect(config.setForFile).to.have.been.calledOnce;
      expect(config.setForFile.args[0]).to.eql([
        activeTab.file,
        CONFIG_KEY,
        { ...omit(configuration, [ 'endpoint' ]), endpointId: configuration.endpoint.id }
      ]);
    });


    it('should not deploy when user decided to only save configuration', async () => {

      // given
      const deploySpy = sinon.spy();
      const {
        instance
      } = createDeploymentTool({ userAction: 'save' });

      // when
      await instance.deploy();

      // then
      expect(deploySpy).to.have.not.been.called;
    });
  });


  describe('cancel', () => {

    it('should not save config if user cancelled the deployment', async () => {

      // given
      const config = {
        set: sinon.spy(),
        setForFile: sinon.spy()
      };

      const activeTab = createTab({ name: 'foo.bpmn' });
      const {
        instance
      } = createDeploymentTool({ activeTab, config, userAction: 'cancel' });

      // when
      await instance.deploy();

      // then
      expect(config.setForFile).to.not.have.been.called;
      expect(config.set).to.not.have.been.called;
    });
  });
});



// helper ////
class TestDeploymentTool extends DeploymentTool {

  /**
   * @param {object} props
   * @param {'cancel'|'save'|'deploy'} [props.userAction='deploy'] user action in configuration modal
   * @param {object} [props.endpoint] overrides for endpoint configuration
   * @param {object} [props.deployment] overrides for deployment configuration
   */
  constructor(props) {
    super(props);
  }

  // removes CamundaAPI dependency
  deployWithConfiguration(...args) {
    if (this.props.errorThrown) {
      throw this.props.errorThrown;
    }

    return this.props.deploySpy && this.props.deploySpy(...args);
  }

  handleDeploymentError(...args) {
    super.handleDeploymentError(...args);

    return this.props.deploymentErrorSpy && this.props.deploymentErrorSpy(...args);
  }

  checkConnection = (...args) => {
    return this.props.checkConnectionSpy && this.props.checkConnectionSpy(...args);
  }

  // closes automatically when modal is opened
  componentDidUpdate(...args) {
    super.componentDidUpdate && super.componentDidUpdate(...args);

    const { modalState } = this.state;
    const {
      userAction,
      endpoint,
      deployment
    } = this.props;

    if (modalState) {
      const action = userAction || 'deploy';

      const configuration = action !== 'cancel' && {
        endpoint: {
          ...modalState.configuration.endpoint,
          ...endpoint
        },
        deployment: {
          ...modalState.configuration.deployment,
          ...deployment
        }
      };

      modalState.handleClose(action, configuration);
    }
  }
}

function createDeploymentTool({
  activeTab = createTab(),
  ...props
} = {}, render = shallow) {
  const subscribe = (event, callback) => {
    event === 'app.activeTabChanged' && callback({ activeTab });
  };

  const triggerAction = (event, context) => {
    switch (true) {
    case (event === 'save-tab'):
      return activeTab;
    case (props.actionTriggered &&
      props.actionTriggered.emitEvent == event &&
      props.actionTriggered.type == context.type):
      return props.actionTriggered.handler();
    }
  };

  const config = new Config({
    get: (_, defaultValue) => defaultValue,
    ...props.config
  });

  const wrapper = render(<TestDeploymentTool
    subscribe={ subscribe }
    triggerAction={ triggerAction }
    displayNotification={ noop }
    log={ noop }
    _getGlobal={ (name) => (name === 'fileSystem' && createFileSystem(props.fileSystem)) }
    { ...props }
    config={ config }
  />);

  return {
    wrapper,
    instance: wrapper.instance()
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

function createConfiguration(deployment, endpoint) {
  return {
    deployment: {
      name: 'diagram',
      tenantId: '',
      attachments: [],
      ...deployment
    },
    endpoint: {
      id: 'endpointId',
      url: 'http://localhost:8088/engine-rest',
      authType: AuthTypes.basic,
      username: 'demo',
      password: 'demo',
      rememberCredentials: true,
      ...endpoint
    }
  };
}

function createSavedConfiguration(configuration) {
  return {
    deployment: configuration.deployment,
    endpointId: configuration.endpoint.id
  };
}

function createFileSystem(overrides = {}) {
  return {
    readFile() {},
    ...overrides
  };
}

function noop() {}
