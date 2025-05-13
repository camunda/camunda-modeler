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

import React, { useEffect } from 'react';

import { waitFor } from '@testing-library/react';

import { mount } from 'enzyme';

import EventEmitter from 'events';

import StartInstancePluginOverlay from '../StartInstancePluginOverlay';

import { TARGET_TYPES } from '../../../../remote/ZeebeAPI';

import { CONNECTION_CHECK_ERROR_REASONS } from '../../deployment-plugin/ConnectionCheckErrors';

describe('StartInstancePluginOverlay', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  afterEach(function() {
    document.body.innerHTML = '';
  });


  it('should render (loading)', function() {

    // when
    createStartInstancePluginOverlay();

    // then
    expect(document.querySelector('.loading')).to.exist;
  });


  it('should render start instance config (no connection check result)', async function() {

    // when
    const deploymentConfig = createMockDeploymentConfig();

    const deployment = new MockDeployment({
      getConfigForFile: () => Promise.resolve(deploymentConfig)
    });

    const startInstanceConfig = createMockStartInstanceConfig();

    const startInstance = new MockStartInstance({
      getConfigForFile: () => Promise.resolve(startInstanceConfig)
    });

    createStartInstancePluginOverlay({
      deployment,
      startInstance,
      StartInstanceConfigForm: createMockStartInstanceConfigForm().Form
    });

    // then
    await waitFor(() => {
      expect(document.querySelector('form#start-instance')).to.exist;
    });
  });


  it('should render deployment config (connection check result, no success)', async function() {

    // when
    const connectionChecker = new MockConnectionChecker();

    const deploymentConfig = createMockDeploymentConfig();

    const deployment = new MockDeployment({
      getConfigForFile: () => Promise.resolve(deploymentConfig)
    });

    const startInstanceConfig = createMockStartInstanceConfig();

    const startInstance = new MockStartInstance({
      getConfigForFile: () => Promise.resolve(startInstanceConfig)
    });

    createStartInstancePluginOverlay({
      connectionChecker,
      deployment,
      DeploymentConfigForm: createMockDeploymentConfigForm().Form,
      startInstance,
      StartInstanceConfigForm: createMockStartInstanceConfigForm().Form
    });

    await waitFor(() => {
      expect(document.querySelector('form#start-instance')).to.exist;
    });

    connectionChecker.emit('connectionCheck', {
      success: false,
      reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID
    });

    // then
    await waitFor(() => {
      expect(document.querySelector('form#deployment')).to.exist;
    });
  });


  describe('connection checking', function() {

    it('should start checking on mount', async function() {

      // given
      const connectionChecker = new MockConnectionChecker();

      // when
      createStartInstancePluginOverlay({
        connectionChecker,
        deployment: new MockDeployment({
          getConfigForFile: () => Promise.resolve(createMockDeploymentConfig())
        }),
        startInstance: new MockStartInstance({
          getConfigForFile: () => Promise.resolve(createMockStartInstanceConfig())
        })
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(connectionChecker.on).to.have.been.calledOnce;
      expect(connectionChecker.on).to.have.been.calledWith('connectionCheck', sinon.match.func);

      expect(document.querySelector('.invalid-feedback')).not.to.exist;

      connectionChecker.emit('connectionCheck', {
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID
      });

      // then
      await waitFor(() => {
        expect(document.querySelector('.invalid-feedback')).to.exist;
      });

      expect(document.querySelector('.invalid-feedback').textContent).to.equal('Invalid Client ID.');
    });


    it('should stop checking on unmount', async function() {

      // given
      const connectionChecker = new MockConnectionChecker();

      const wrapper = createStartInstancePluginOverlay({
        connectionChecker,
        deployment: new MockDeployment({
          getConfigForFile: () => Promise.resolve(createMockDeploymentConfig())
        }),
        startInstance: new MockStartInstance({
          getConfigForFile: () => Promise.resolve(createMockStartInstanceConfig())
        })
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(document.querySelector('.invalid-feedback')).not.to.exist;

      // when
      wrapper.unmount();

      connectionChecker.emit('connectionCheck', {
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID
      });

      // then
      expect(connectionChecker.off).to.have.been.calledOnce;
      expect(connectionChecker.off).to.have.been.calledWith('connectionCheck', sinon.match.func);
      expect(connectionChecker.stopChecking).to.have.been.calledOnce;
    });

  });


  describe('form validation', function() {

    it('should validate deployment config form (valid)', async function() {

      // given
      const connectionChecker = new MockConnectionChecker();

      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const deploymentConfigValidator = new MockConfigValidator({
        validateConfig: () => ({})
      });

      const { Form, getProps: getFormProps } = createMockDeploymentConfigForm();

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig)
      });

      createStartInstancePluginOverlay({
        connectionChecker,
        deployment,
        DeploymentConfigForm: Form,
        deploymentConfigValidator,
        startInstance
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(connectionChecker.updateConfig).to.have.been.calledOnce;

      connectionChecker.updateConfig.resetHistory();

      connectionChecker.emit('connectionCheck', {
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID
      });

      await waitFor(() => {
        expect(document.querySelector('form#deployment')).to.exist;
      });

      // when
      getFormProps().validateForm({
        ...deploymentConfig,
        endpoint: {
          ...deploymentConfig.endpoint,
          camundaCloudClientId: 'foo'
        }
      });

      // expect
      expect(connectionChecker.updateConfig).to.have.been.calledOnce;
      expect(connectionChecker.updateConfig).to.have.been.calledWith({
        ...deploymentConfig,
        endpoint: {
          ...deploymentConfig.endpoint,
          camundaCloudClientId: 'foo'
        }
      });
    });


    it('should validate deployment config form (invalid)', async function() {

      // given
      const connectionChecker = new MockConnectionChecker();

      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const deploymentConfigValidator = new MockConfigValidator({
        validateConfig: () => ({
          'endpoint.camundaCloudClientId': 'Invalid Client ID.'
        })
      });

      const { Form, getProps: getFormProps } = createMockDeploymentConfigForm();

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig)
      });

      createStartInstancePluginOverlay({
        connectionChecker,
        deployment,
        DeploymentConfigForm: Form,
        deploymentConfigValidator,
        startInstance
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(connectionChecker.updateConfig).to.have.been.calledOnce;

      connectionChecker.updateConfig.resetHistory();

      connectionChecker.emit('connectionCheck', {
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID
      });

      await waitFor(() => {
        expect(document.querySelector('form#deployment')).to.exist;
      });

      // when
      getFormProps().validateForm({
        ...deploymentConfig,
        endpoint: {
          ...deploymentConfig.endpoint,
          camundaCloudClientId: 'foo'
        }
      });

      // expect
      expect(connectionChecker.updateConfig).to.have.been.calledOnce;
      expect(connectionChecker.updateConfig).to.have.been.calledWith(null);
    });

  });


  describe('form submission', function() {

    it('should submit form (success)', async function() {

      // given
      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult())),
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const displayNotificationSpy = sinon.spy();

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig),
        startInstance: sinon.spy(() => Promise.resolve(createMockStartInstanceResult()))
      });

      const { Form, getProps: getFormProps } = createMockStartInstanceConfigForm();

      createStartInstancePluginOverlay({
        deployment,
        displayNotification: displayNotificationSpy,
        startInstance,
        StartInstanceConfigForm: Form
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(startInstanceConfig);

      // expect
      await waitFor(() => {
        expect(startInstance.startInstance).to.have.been.calledOnce;
      });

      expect(startInstance.startInstance).to.have.been.calledWith('foo', {
        ...deploymentConfig,
        ...startInstanceConfig
      });

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Process instance started',
        type: 'success'
      }));
    });


    it('should submit form (no success)', async function() {

      // given
      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult())),
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const displayNotificationSpy = sinon.spy();

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig),
        startInstance: sinon.spy(() => Promise.resolve(createMockStartInstanceResult({
          success: false,
          response: {
            details: 'foo'
          }
        })))
      });

      const { Form, getProps: getFormProps } = createMockStartInstanceConfigForm();

      createStartInstancePluginOverlay({
        deployment,
        displayNotification: displayNotificationSpy,
        startInstance,
        StartInstanceConfigForm: Form
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(startInstanceConfig);

      // expect
      await waitFor(() => {
        expect(startInstance.startInstance).to.have.been.calledOnce;
      });

      expect(startInstance.startInstance).to.have.been.calledWith('foo', {
        ...deploymentConfig,
        ...startInstanceConfig
      });

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Process instance not started',
        type: 'error'
      }));
    });

  });


  describe('customization', function() {

    it('should render custom start instance header', async function() {

      // when
      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig)
      });

      createStartInstancePluginOverlay({
        deployment,
        renderStartInstanceHeader: <div id="custom-start-instance-header" />,
        startInstance
      });

      // then
      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(document.querySelector('#custom-start-instance-header')).to.exist;
    });


    it('should render custom start instance submit', async function() {

      // when
      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig)
      });

      createStartInstancePluginOverlay({
        deployment,
        renderStartInstanceSubmit: <div id="custom-start-instance-submit" />,
        startInstance
      });

      // then
      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(document.querySelector('#custom-start-instance-submit')).to.exist;
    });


    it('should render custom deployment header', async function() {

      // when
      const connectionChecker = new MockConnectionChecker();

      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig)
      });

      createStartInstancePluginOverlay({
        connectionChecker,
        deployment,
        renderDeploymentHeader: <div id="custom-deployment-header" />,
        startInstance
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      connectionChecker.emit('connectionCheck', {
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID
      });

      // then
      await waitFor(() => {
        expect(document.querySelector('#custom-deployment-header')).to.exist;
      });
    });


    it('should render custom deployment submit', async function() {

      // when
      const connectionChecker = new MockConnectionChecker();

      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig)
      });

      createStartInstancePluginOverlay({
        connectionChecker,
        deployment,
        renderDeploymentSubmit: <div id="custom-deployment-submit" />,
        startInstance
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      connectionChecker.emit('connectionCheck', {
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID
      });

      // then
      await waitFor(() => {
        expect(document.querySelector('#custom-deployment-submit')).to.exist;
      });
    });


    it('should deploy custom resources', async function() {

      // given
      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult({
          response: {
            deployments: [
              {
                process: {
                  bpmnProcessId: 'foo',
                  resourceName: 'foo.bpmn'
                }
              },
              {
                process: {
                  bpmnProcessId: 'bar',
                  resourceName: 'bar.bpmn'
                }
              }
            ]
          }
        }))),
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const displayNotificationSpy = sinon.spy();

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig),
        startInstance: sinon.spy(() => Promise.resolve(createMockStartInstanceResult()))
      });

      const { Form, getProps: getFormProps } = createMockStartInstanceConfigForm();

      const resourceConfigs = [
        {
          path: 'foo.bpmn',
          type: 'bpmn'
        },
        {
          path: 'bar.bpmn',
          type: 'bpmn'
        }
      ];

      createStartInstancePluginOverlay({
        deployment,
        displayNotification: displayNotificationSpy,
        getResourceConfigs: () => resourceConfigs,
        startInstance,
        StartInstanceConfigForm: Form
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(startInstanceConfig);

      // expect
      await waitFor(() => {
        expect(startInstance.startInstance).to.have.been.calledOnce;
      });

      expect(deployment.deploy).to.have.been.calledOnce;
      expect(deployment.deploy).to.have.been.calledWith([
        {
          path: 'foo.bpmn',
          type: 'bpmn'
        },
        {
          path: 'bar.bpmn',
          type: 'bpmn'
        }
      ], deploymentConfig);

      expect(startInstance.startInstance).to.have.been.calledWith('foo', {
        ...deploymentConfig,
        ...startInstanceConfig
      });

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Process instance started',
        type: 'success'
      }));
    });


    it('should display custom success notification', async function() {

      // given
      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult())),
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const displayNotificationSpy = sinon.spy();

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig),
        startInstance: sinon.spy(() => Promise.resolve(createMockStartInstanceResult()))
      });

      const { Form, getProps: getFormProps } = createMockStartInstanceConfigForm();

      createStartInstancePluginOverlay({
        deployment,
        displayNotification: displayNotificationSpy,
        getSuccessNotification: () => ({
          title: 'Custom success notification',
          type: 'success'
        }),
        startInstance,
        StartInstanceConfigForm: Form
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(startInstanceConfig);

      // expect
      await waitFor(() => {
        expect(startInstance.startInstance).to.have.been.calledOnce;
      });

      expect(startInstance.startInstance).to.have.been.calledWith('foo', {
        ...deploymentConfig,
        ...startInstanceConfig
      });

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Custom success notification',
        type: 'success'
      }));
    });


    it('should display custom error notification', async function() {

      // given
      const deploymentConfig = createMockDeploymentConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult())),
        getConfigForFile: () => Promise.resolve(deploymentConfig)
      });

      const displayNotificationSpy = sinon.spy();

      const startInstanceConfig = createMockStartInstanceConfig();

      const startInstance = new MockStartInstance({
        getConfigForFile: () => Promise.resolve(startInstanceConfig),
        startInstance: sinon.spy(() => Promise.resolve(createMockStartInstanceResult({
          success: false,
          response: {
            details: 'foo'
          }
        })))
      });

      const { Form, getProps: getFormProps } = createMockStartInstanceConfigForm();

      createStartInstancePluginOverlay({
        deployment,
        displayNotification: displayNotificationSpy,
        getErrorNotification: () => ({
          title: 'Custom error notification',
          type: 'error'
        }),
        startInstance,
        StartInstanceConfigForm: Form
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(startInstanceConfig);

      // expect
      await waitFor(() => {
        expect(startInstance.startInstance).to.have.been.calledOnce;
      });

      expect(startInstance.startInstance).to.have.been.calledWith('foo', {
        ...deploymentConfig,
        ...startInstanceConfig
      });

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Custom error notification',
        type: 'error'
      }));
    });

  });

});

class Mock {
  constructor(overrides = {}) {
    Object.assign(this, overrides);
  }
}

class MockConnectionChecker extends Mock {
  constructor(overrides = {}) {
    super(overrides);

    this.eventEmitter = new EventEmitter();
  }

  on = sinon.spy((...args) => {
    return this.eventEmitter.on(...args);
  });

  off = sinon.spy((...args) => {
    return this.eventEmitter.off(...args);
  });

  emit = sinon.spy((...args) => {
    return this.eventEmitter.emit(...args);
  });

  updateConfig = sinon.spy();

  startChecking = sinon.spy();

  stopChecking = sinon.spy();
}

class MockDeployment extends Mock {
  deploy() {}

  getConfigForFile() {}

  setConfigForFile() {}
}

class MockConfigValidator extends Mock {
  static validateConfigValue() {}

  static validateConfig() {
    return {};
  }
}

class MockStartInstance extends Mock {
  getConfigForFile() {}

  setConfigForFile() {}

  startInstance() {}
}

function createMockDeploymentConfigForm() {
  const _props = {};

  const Form = function MockForm(props) {
    const {
      getFieldError,
      initialFieldValues,
      onSubmit = () => {},
      validateForm = () => {},
      validateField = (name, value) => MockConfigValidator.validateConfigValue(name, value)
    } = props;

    useEffect(() => {
      _props.getFieldError = getFieldError;
      _props.initialFieldValues = initialFieldValues;
      _props.onSubmit = onSubmit;
      _props.validateForm = validateForm;
      _props.validateField = validateField;
    }, []);

    return (
      <form id="deployment" onSubmit={ onSubmit }>
        <button type="submit">Submit</button>
      </form>
    );
  };

  return {
    Form,
    getProps: () => _props
  };
}

function createMockStartInstanceConfigForm() {
  const _props = {};

  const Form = function MockForm(props) {
    const {
      initialFieldValues,
      onSubmit,
      validateForm,
      validateField
    } = props;

    useEffect(() => {
      _props.initialFieldValues = initialFieldValues;
      _props.onSubmit = onSubmit;
      _props.validateForm = validateForm;
      _props.validateField = validateField;
    }, []);

    return (
      <form id="start-instance" onSubmit={ onSubmit }>
        <button type="submit">Submit</button>
      </form>
    );
  };

  return {
    Form,
    getProps: () => _props
  };
}

function createMockDeploymentResult(overrides = {}) {
  return {
    success: true,
    response: {
      deployments: [
        {
          process: {
            bpmnProcessId: 'foo',
            resourceName: 'foo.bpmn'
          }
        }
      ]
    },
    ...overrides
  };
}

function createMockStartInstanceResult(overrides = {}) {
  return {
    success: true,
    response: {
      processInstanceKey: 'bar'
    },
    ...overrides
  };
}

class MockAnchor extends Mock {
  getBoundingClientRect() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0
    };
  }
}

const DEFAULT_ACTIVE_TAB = {
  type: 'cloud-bpmn',
  file: {
    name: 'foo.bpmn',
    path: 'foo.bpmn'
  }
};

function createMockEndpoint(overrides = {}) {
  return {
    targetType: TARGET_TYPES.CAMUNDA_CLOUD,
    id: 'foo',
    camundaCloudClientId: 'bar',
    camundaCloudClientSecret: 'baz',
    camundaCloudClusterUrl: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443',
    ...overrides
  };
}

function createMockDeploymentConfig(overrides = {}) {
  return {
    deployment: {},
    endpoint: createMockEndpoint(),
    ...overrides
  };
}

function createMockStartInstanceConfig(overrides = {}) {
  return {
    variables: '{}',
    ...overrides
  };
}

function createStartInstancePluginOverlay(props = {}) {
  const {
    activeTab = DEFAULT_ACTIVE_TAB,
    anchor = new MockAnchor(),
    connectionChecker = new MockConnectionChecker(),
    deployment = new MockDeployment(),
    DeploymentConfigForm,
    deploymentConfigValidator = MockConfigValidator,
    displayNotification = () => {},
    getErrorNotification,
    getResourceConfigs,
    getSuccessNotification,
    log = () => {},
    onClose = () => {},
    renderDeploymentDescription,
    renderDeploymentHeader,
    renderDeploymentSubmit,
    renderStartInstanceDescription,
    renderStartInstanceHeader,
    renderStartInstanceSubmit,
    startInstance = new MockStartInstance(),
    StartInstanceConfigForm,
    startInstanceConfigValidator = MockConfigValidator,
    triggerAction = () => {},
  } = props;

  return mount(
    <StartInstancePluginOverlay
      activeTab={ activeTab }
      anchor={ anchor }
      connectionChecker={ connectionChecker }
      deployment={ deployment }
      DeploymentConfigForm={ DeploymentConfigForm }
      deploymentConfigValidator={ deploymentConfigValidator }
      displayNotification={ displayNotification }
      getErrorNotification={ getErrorNotification }
      getResourceConfigs={ getResourceConfigs }
      getSuccessNotification={ getSuccessNotification }
      log={ log }
      onClose={ onClose }
      renderDeploymentDescription={ renderDeploymentDescription }
      renderDeploymentHeader={ renderDeploymentHeader }
      renderDeploymentSubmit={ renderDeploymentSubmit }
      renderStartInstanceDescription={ renderStartInstanceDescription }
      renderStartInstanceHeader={ renderStartInstanceHeader }
      renderStartInstanceSubmit={ renderStartInstanceSubmit }
      startInstance={ startInstance }
      StartInstanceConfigForm={ StartInstanceConfigForm }
      startInstanceConfigValidator={ startInstanceConfigValidator }
      triggerAction={ triggerAction } />
  );
}