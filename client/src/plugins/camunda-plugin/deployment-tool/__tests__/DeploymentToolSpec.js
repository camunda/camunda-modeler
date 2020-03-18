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


const CONFIG_KEY = 'deployment-tool';
const ENGINE_ENDPOINTS_CONFIG_KEY = 'camundaEngineEndpoints';

const SPRING_DEFAULT_URL = 'http://localhost:8080/rest';
const TOMCAT_DEFAULT_URL = 'http://localhost:8080/engine-rest';


describe('<DeploymentTool>', () => {

  it('should render', () => {
    createDeploymentTool();
  });


  it('should not display the button if there is no active tab', () => {

    // given
    const { wrapper } = createDeploymentTool({ activeTab: { type: 'empty', id: '__empty' } });

    // then
    expect(wrapper).to.be.empty;
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


    it('should handle deployment error');


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
    return this.props.deploySpy && this.props.deploySpy(...args);
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
    event === 'app.activeTabChanged' && callback(activeTab);
  };

  const triggerAction = event => {
    switch (event) {
    case 'save-tab':
      return activeTab;
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

function noop() {}
