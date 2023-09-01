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
import {
  omit
} from 'min-dash';

import { Config } from './../../../../app/__tests__/mocks';

import DeploymentTool from '../DeploymentTool';
import AuthTypes from '../../shared/AuthTypes';
import { DeploymentError,
  ConnectionError } from '../../shared/CamundaAPI';
import { Slot, SlotFillRoot } from '../../../../app/slot-fill';

const CONFIG_KEY = 'deployment-tool';
const ENGINE_ENDPOINTS_CONFIG_KEY = 'camundaEngineEndpoints';

const SPRING_DEFAULT_URL = 'http://localhost:8080/rest';
const TOMCAT_DEFAULT_URL = 'http://localhost:8080/engine-rest';

const BUTTON_SELECTOR = '[title="Deploy current diagram"]';


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


  it('should display the button if there is an active bpmn tab', () => {

    // given
    const activeTab = createTab({ type: 'bpmn' });

    // when
    const { wrapper } = createDeploymentTool({ activeTab });

    // then
    expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(1);
  });


  it('should display the button if there is an active form tab', () => {

    // given
    const activeTab = createTab({ type: 'form' });

    // when
    const { wrapper } = createDeploymentTool({ activeTab });

    // then
    expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(1);
  });


  it('should NOT display the button if there is no active tab', () => {

    // given
    const activeTab = createTab({ type: 'empty', id: '__empty' });

    // when
    const { wrapper } = createDeploymentTool({ activeTab });

    // then
    expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(0);
  });


  it('should NOT display the button if there is no camunda tab', () => {

    // given
    const activeTab = createTab();

    // when
    const { wrapper } = createDeploymentTool({ activeTab });

    // then
    expect(wrapper.find(BUTTON_SELECTOR)).to.have.lengthOf(0);
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
      const attachments = [ {
        path: file.path
      } ];
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
      const attachments = [ {
        path: file.path
      } ];
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
        [ withoutCredentials(configuration.endpoint) ]
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


    it('should not handle deployment error given a non DeploymentError during getVersion', async () => {

      // given
      const deploymentErrorSpy = sinon.spy(),
            configuration = createConfiguration(),
            activeTab = createTab({ name: 'foo.bpmn' });

      const errorThrown = [
        new ConnectionError({ status: 500 }),
        new Error()
      ];

      errorThrown.forEach(async (err) => {

        // given
        const {
          instance
        } = createDeploymentTool({ activeTab, getVersionErrorThrown: err, deploymentErrorSpy, ...configuration });

        let error;

        // when
        try {
          await instance.deploy();
        } catch (e) {
          error = e;
        }

        // then
        expect(error).to.equal(err);
        expect(deploymentErrorSpy).to.not.have.been.called;
      });
    });


    it('should not handle deployment error given a non DeploymentError during deployment', async () => {

      // given
      const deploymentErrorSpy = sinon.spy(),
            configuration = createConfiguration(),
            activeTab = createTab({ name: 'foo.bpmn' });

      const errorThrown = [
        new ConnectionError({ status: 500 }),
        new Error()
      ];

      errorThrown.forEach(async (err) => {

        // given
        const {
          instance
        } = createDeploymentTool({ activeTab, errorThrown: err, deploymentErrorSpy, ...configuration });

        let error;

        // when
        try {
          await instance.deploy();
        } catch (e) {
          error = e;
        }

        // then
        expect(error).to.equal(err);
        expect(deploymentErrorSpy).to.not.have.been.called;
      });
    });


    it('should fetch the executionPlatformVersion', async () => {

      // given
      const deploySpy = sinon.spy();
      const getVersionSpy = sinon.spy(() => { return { version: '7.15.0' }; });
      const activeTab = createTab({ name: 'foo.bpmn' });
      const {
        instance
      } = createDeploymentTool({ activeTab, deploySpy, getVersionSpy });

      // when
      await instance.deploy();

      // then
      expect(getVersionSpy).to.have.been.calledOnce;
    });


    it('should fetch the executionPlatformVersion but no version is available', async () => {

      // given
      const deploySpy = sinon.spy();
      const getVersionSpy = sinon.spy(() => { return { version: null }; });
      const activeTab = createTab({ name: 'foo.bpmn' });
      const {
        instance
      } = createDeploymentTool({ activeTab, deploySpy, getVersionSpy });

      // when
      await instance.deploy();

      // then
      expect(getVersionSpy).to.have.been.calledOnce;
    });


    it('should use saved config to fetch executionPlatformVersion', async () => {

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

      const getVersionSpy = sinon.spy(() => { return { version: '7.15.0' }; });

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createDeploymentTool({ activeTab, config, getVersionSpy });

      // when
      await instance.deployTab(activeTab);

      // then
      expect(getVersionSpy).to.have.been.calledOnce;
      expect(getVersionSpy.args[0][0].endpoint).to.equal(savedEndpoint);
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
                handler: actionSpy
              };

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, ...configuration });

        // when
        await instance.deploy();

        // then
        expect(actionSpy).to.have.been.calledOnce;
      });

      it('should send target type on deployment.done', async () => {

        // given
        const configuration = createConfiguration(),
              activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.done',
                handler: actionSpy
              };

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, ...configuration });

        // when
        await instance.deploy(({
          isStart: true,
          onClose: () => { }
        }));

        const targetType = actionSpy.getCall(0).args[0].payload.targetType;

        // then
        expect(actionSpy).to.have.been.calledOnce;
        expect(targetType).to.eql('selfHosted');
      });


      it('should include executionPlatform metrics in deployment.done', async () => {

        // given
        const configuration = createConfiguration(),
              activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.done',
                handler:actionSpy
              };

        const getVersionSpy = sinon.spy(() => { return { version: '7.14.0' }; });

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, getVersionSpy, ...configuration });

        // when
        await instance.deploy();

        // then
        expect(actionSpy).to.have.been.calledOnce;

        const deployedTo = actionSpy.args[0][0].payload.deployedTo;
        expect(deployedTo.executionPlatform).to.eql('Camunda Platform');
        expect(deployedTo.executionPlatformVersion).to.eql('7.14.0');
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


      it('should trigger deployment.error action given deployment error', async () => {

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


      it('should not trigger deployment.error action given non-deployment error', async () => {

        // given
        const configuration = createConfiguration(),
              activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.error',
                handler:actionSpy
              };

        const errorThrown = new ConnectionError({ status: 500 });

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, errorThrown, ...configuration });

        // when
        let error;
        try {
          await instance.deploy();
        } catch (err) {
          error = err;
        }

        // then
        expect(actionSpy).to.not.have.been.called;

        expect(error).to.exist;
        expect(error).to.equal(errorThrown);
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


      it('should include executionPlatform metrics in deployment.error given deploymentError', async () => {

        // given
        const configuration = createConfiguration(),
              activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.error',
                handler:actionSpy
              };

        const getVersionSpy = sinon.spy(() => { return { version: '7.14.0' }; });

        const errorThrown = new DeploymentError({ status: 500 });

        const {
          instance
        } = createDeploymentTool({ activeTab, actionTriggered, getVersionSpy, errorThrown, ...configuration });

        // when
        await instance.deploy();

        // then
        expect(actionSpy).to.have.been.calledOnce;

        const deployedTo = actionSpy.args[0][0].payload.deployedTo;
        expect(deployedTo.executionPlatform).to.eql('Camunda Platform');
        expect(deployedTo.executionPlatformVersion).to.eql('7.14.0');
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
      } = createDeploymentTool({ userAction: 'save', deploySpy });

      // when
      await instance.deploy();

      // then
      expect(deploySpy).to.have.not.been.called;
    });


    it('should not get version when user decided to only save configuration', async () => {

      // given
      const getVersionSpy = sinon.spy();
      const {
        instance
      } = createDeploymentTool({ userAction: 'save', getVersionSpy });

      // when
      await instance.deploy();

      // then
      expect(getVersionSpy).to.have.not.been.called;
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


  describe('#saveCredentials', () => {

    it('should save credentials', async () => {

      // given
      const configSetSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const savedEndpoint = {
        id: 'endpointId',
        authType: AuthTypes.basic,
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
              savedEndpoint
            ];
          }

          return defaultValue;
        },
        getForFile: sinon.stub().returns(savedConfiguration),
        set: configSetSpy
      };

      const credentials = {
        username: 'username',
        password: 'password',
        token: 'token'
      };

      const {
        instance
      } = createDeploymentTool({
        activeTab,
        config
      });

      // when
      await instance.saveCredentials(credentials);

      // then
      expect(configSetSpy).to.have.been.calledOnce;
      expect(configSetSpy.args[0][1]).to.eql([
        {
          ...savedEndpoint,
          ...credentials
        }
      ]);
    });


    it('should NOT save credentials - no configuration saved', async () => {

      // given
      const configSetSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const config = {
        set: configSetSpy
      };

      const credentials = {
        username: 'username',
        password: 'password',
        token: 'token'
      };

      const {
        instance
      } = createDeploymentTool({
        activeTab,
        config
      });

      // when
      await instance.saveCredentials(credentials);

      // then
      expect(configSetSpy).to.not.have.been.called;
    });


    it('should NOT save credentials - no endpoint available', async () => {

      // given
      const configSetSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const savedConfiguration = {
        deployment: {
          name: 'diagram',
          tenantId: '',
        },
        endpointId: null
      };

      const config = {
        getForFile: sinon.stub().returns(savedConfiguration),
        set: configSetSpy
      };

      const credentials = {
        username: 'username',
        password: 'password',
        token: 'token'
      };

      const {
        instance
      } = createDeploymentTool({
        activeTab,
        config
      });

      // when
      await instance.saveCredentials(credentials);

      // then
      expect(configSetSpy).to.not.have.been.called;
    });

  });


  describe('#removeCredentials', () => {

    it('should remove credentials', async () => {

      // given
      const configSetSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const savedEndpoint = {
        id: 'endpointId',
        username: 'username',
        password: 'password',
        authType: AuthTypes.basic,
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
              savedEndpoint
            ];
          }

          return defaultValue;
        },
        getForFile: sinon.stub().returns(savedConfiguration),
        set: configSetSpy
      };

      const {
        instance
      } = createDeploymentTool({
        activeTab,
        config
      });

      // when
      await instance.removeCredentials();

      // then
      expect(configSetSpy).to.have.been.calledOnce;
      expect(configSetSpy.args[0][1]).to.eql([
        {
          ...withoutCredentials(savedEndpoint),
          rememberCredentials: false
        }
      ]);
    });


    it('should NOT remove credentials - no configuration saved', async () => {

      // given
      const configSetSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const config = {
        set: configSetSpy
      };

      const {
        instance
      } = createDeploymentTool({
        activeTab,
        config
      });

      // when
      await instance.removeCredentials();

      // then
      expect(configSetSpy).to.not.have.been.calledOnce;
    });


    it('should NOT remove credentials - no endpoint available', async () => {

      // given
      const configSetSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const savedConfiguration = {
        deployment: {
          name: 'diagram',
          tenantId: '',
        },
        endpointId: null
      };

      const config = {
        getForFile: sinon.stub().returns(savedConfiguration),
        set: configSetSpy
      };

      const {
        instance
      } = createDeploymentTool({
        activeTab,
        config
      });

      // when
      await instance.removeCredentials();

      // then
      expect(configSetSpy).to.not.have.been.called;
    });


    describe('overlay', function() {

      it('should open', async () => {

        // given
        const activeTab = createTab({ type: 'bpmn' });

        const {
          wrapper
        } = createDeploymentTool({
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


      it('should close when active tab changes', async () => {

        // given
        const activeTab = createTab({ type: 'bpmn' });
        const { subscribe, callSubscriber } = createSubscribe(activeTab);

        const {
          wrapper
        } = createDeploymentTool({
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
        expect(wrapper.html().includes('form')).to.not.be.true;
      });

    });


    describe('Cockpit link', function() {

      function testCockpitLink(expectedCockpitLink) {

        return done => {

          // given
          const activeTab = createTab({ name: 'foo.bpmn' });

          const deploySpy = sinon.stub().returns({ id: 'foo' });

          const configuration = createConfiguration();

          const {
            instance
          } = createDeploymentTool({
            activeTab,
            configuration,
            displayNotification,
            deploySpy
          });

          // when
          instance.deploy();

          function displayNotification(notification) {

            // then
            try {
              const cockpitLink = shallow(notification.content).find('a').first();
              const { href } = cockpitLink.props();

              expect(href).to.eql(expectedCockpitLink);

              done();
            } catch (error) {
              done(error);
            }
          }
        };
      }

      function query(id) {
        return `deploymentsQuery=%5B%7B%22type%22:%22id%22,%22operator%22:%22eq%22,%22value%22:%22${id}%22%7D%5D`;
      }


      it('should display Spring-specific Cockpit link', testCockpitLink(
        `http://localhost:8080/app/cockpit/default/#/repository/?${query('foo')}`
      ));
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

    getVersion(...args) {
      if (this.props.getVersionErrorThrown) {
        throw this.props.getVersionErrorThrown;
      }

      if (this.props.getVersionSpy) {
        return this.props.getVersionSpy && this.props.getVersionSpy(...args);
      }

      return { version: '7.15.0' };
    }

    handleDeploymentError(...args) {
      super.handleDeploymentError(...args);

      return this.props.deploymentErrorSpy && this.props.deploymentErrorSpy(...args);
    }

    checkConnection = (...args) => {
      return this.props.checkConnectionSpy && this.props.checkConnectionSpy(...args);
    };

    // closes automatically when modal is opened
    componentDidUpdate(...args) {
      super.componentDidUpdate && super.componentDidUpdate(...args);

      const { overlayState } = this.state;
      const {
        userAction,
        endpoint,
        deployment,
        keepOpen
      } = this.props;

      if (overlayState) {
        const action = userAction || 'deploy';

        const configuration = action !== 'cancel' && {
          endpoint: {
            ...overlayState.configuration.endpoint,
            ...endpoint
          },
          deployment: {
            ...overlayState.configuration.deployment,
            ...deployment
          }
        };

        if (!keepOpen) {
          overlayState.handleClose(action, configuration);
        }
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
        return props.actionTriggered.handler(context);
      }
    };

    const config = new Config({
      get: (_, defaultValue) => defaultValue,
      ...props.config
    });

    const DeploymentTool = (
      <TestDeploymentTool
        subscribe={ props.subcribe || subscribe }
        triggerAction={ triggerAction }
        displayNotification={ noop }
        log={ noop }
        _getGlobal={ (name) => (name === 'fileSystem' && createFileSystem(props.fileSystem)) }
        { ...props }
        config={ config }
      />
    );

    const DeploymentToolWithFillSlot = (
      <SlotFillRoot>
        <Slot name="status-bar__file" />
        {DeploymentTool}
      </SlotFillRoot>
    );

    const wrapper = render(
      props.withFillSlot ? DeploymentToolWithFillSlot : DeploymentTool
    );

    return {
      wrapper,
      instance: wrapper.instance()
    };
  }});

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

function withoutCredentials(endpoint) {
  return omit(endpoint, [ 'username', 'password', 'token' ]);
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
