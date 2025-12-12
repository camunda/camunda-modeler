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

import DeploymentPluginOverlay from '../DeploymentPluginOverlay';

import { TARGET_TYPES } from '../../../../remote/ZeebeAPI';

describe('DeploymentPluginOverlay', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  afterEach(function() {
    document.body.innerHTML = '';
  });


  describe('form submission', function() {

    it('should submit form (success)', async function() {

      // given
      const config = createMockConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult())),
        getConfigForFile: () => Promise.resolve(config)
      });

      const displayNotificationSpy = sinon.spy();

      const { Form, getProps: getFormProps } = createMockDeploymentConfigForm();

      createDeploymentPluginOverlay({
        deployment,
        DeploymentConfigForm: Form,
        displayNotification: displayNotificationSpy
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(config);

      // expect
      await waitFor(() => {
        expect(deployment.deploy).to.have.been.calledOnce;
      });

      expect(deployment.deploy).to.have.been.calledWith([
        {
          path: 'foo.bpmn',
          type: 'bpmn'
        }
      ], config);

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Process definition deployed',
        type: 'success'
      }));
    });


    it('should submit form (no success)', async function() {

      // given
      const config = createMockConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult({
          success: false,
          response: {
            details: 'foo'
          }
        }))),
        getConfigForFile: () => Promise.resolve(config)
      });

      const displayNotificationSpy = sinon.spy();

      const { Form, getProps: getFormProps } = createMockDeploymentConfigForm();

      const logSpy = sinon.spy();

      createDeploymentPluginOverlay({
        deployment,
        DeploymentConfigForm: Form,
        displayNotification: displayNotificationSpy,
        log: logSpy
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(config);

      // expect
      await waitFor(() => {
        expect(deployment.deploy).to.have.been.calledOnce;
      });

      expect(deployment.deploy).to.have.been.calledWith([
        {
          path: 'foo.bpmn',
          type: 'bpmn'
        }
      ], config);

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Deployment failed',
        type: 'error'
      }));

      expect(logSpy).to.have.been.calledOnce;
      expect(logSpy).to.have.been.calledWith(sinon.match({
        category: 'deploy-error',
        message: 'foo',
        silent: true
      }));
    });

  });


  describe('user journey statistics', function() {

    it('should emit event (success)', async function() {

      // given
      const config = createMockConfig();

      const mockDeploymentResult = createMockDeploymentResult();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(mockDeploymentResult)),
        on: sinon.spy(),
        getConfigForFile: () => Promise.resolve(config)
      });

      const triggerActionSpy = sinon.spy();

      createDeploymentPluginOverlay({
        deployment,
        triggerAction: triggerActionSpy
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(deployment.on).to.have.been.calledOnce;
      expect(deployment.on).to.have.been.calledWith('deployed', sinon.match.func);

      // when
      deployment.on.getCall(0).args[1]({
        deploymentResult: mockDeploymentResult,
        endpoint: config.endpoint,
        gatewayVersion: '7.0.0'
      });

      // then
      expect(triggerActionSpy).to.have.been.calledOnce;
      expect(triggerActionSpy).to.have.been.calledWith('emit-event', sinon.match({
        type: 'deployment.done',
        payload: {
          deployment: mockDeploymentResult.response,
          context: 'deploymentTool',
          targetType: 'camundaCloud',
          deployedTo: {
            executionPlatformVersion: '7.0.0',
            executionPlatform: 'Camunda Cloud'
          }
        }
      }));
    });


    it('should emit event (error)', async function() {

      // given
      const config = createMockConfig();

      const mockDeploymentResult = createMockDeploymentResult({
        success: false,
        response: createMockDeploymentErrorResponse()
      });

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(mockDeploymentResult)),
        on: sinon.spy(),
        getConfigForFile: () => Promise.resolve(config)
      });

      const triggerActionSpy = sinon.spy();

      createDeploymentPluginOverlay({
        deployment,
        triggerAction: triggerActionSpy
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(deployment.on).to.have.been.calledOnce;
      expect(deployment.on).to.have.been.calledWith('deployed', sinon.match.func);

      // when
      deployment.on.getCall(0).args[1]({
        deploymentResult: mockDeploymentResult,
        endpoint: config.endpoint,
        gatewayVersion: '7.0.0'
      });

      // then
      expect(triggerActionSpy).to.have.been.calledOnce;
      expect(triggerActionSpy).to.have.been.calledWith('emit-event', sinon.match({
        type: 'deployment.error',
        payload: {
          error: {
            ...mockDeploymentResult.response,
            code: 'INVALID_ARGUMENT'
          },
          context: 'deploymentTool',
          targetType: 'camundaCloud',
          deployedTo: {
            executionPlatformVersion: '7.0.0',
            executionPlatform: 'Camunda Cloud'
          }
        }
      }));
    });


    it('should emit event (custom context)', async function() {

      // given
      const config = createMockConfig({ context: 'testSuite' });

      const mockDeploymentResult = createMockDeploymentResult();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(mockDeploymentResult)),
        on: sinon.spy(),
        getConfigForFile: () => Promise.resolve(config)
      });

      const triggerActionSpy = sinon.spy();

      createDeploymentPluginOverlay({
        deployment,
        triggerAction: triggerActionSpy
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(deployment.on).to.have.been.calledOnce;
      expect(deployment.on).to.have.been.calledWith('deployed', sinon.match.func);

      // when
      deployment.on.getCall(0).args[1]({
        deploymentResult: mockDeploymentResult,
        endpoint: config.endpoint,
        gatewayVersion: '7.0.0',
        context: 'testSuite'
      });

      // then
      expect(triggerActionSpy).to.have.been.calledOnce;
      expect(triggerActionSpy).to.have.been.calledWith('emit-event', sinon.match({
        type: 'deployment.done',
        payload: {
          deployment: mockDeploymentResult.response,
          context: 'testSuite',
          targetType: 'camundaCloud',
          deployedTo: {
            executionPlatformVersion: '7.0.0',
            executionPlatform: 'Camunda Cloud'
          }
        }
      }));
    });

  });


  describe('customization', function() {

    it('should render custom header', async function() {

      // when
      const config = createMockConfig();

      const deployment = new MockDeployment({
        getConfigForFile: () => Promise.resolve(config)
      });

      createDeploymentPluginOverlay({
        deployment,
        renderHeader: <div id="custom-header" />
      });

      // then
      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(document.querySelector('#custom-header')).to.exist;
    });


    it('should render custom submit', async function() {

      // when
      const config = createMockConfig();

      const deployment = new MockDeployment({
        getConfigForFile: () => Promise.resolve(config)
      });

      createDeploymentPluginOverlay({
        deployment,
        renderSubmit: <div id="custom-submit" />
      });

      // then
      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      expect(document.querySelector('#custom-submit')).to.exist;
    });


    it('should deploy custom resources', async function() {

      // given
      const config = createMockConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult())),
        getConfigForFile: () => Promise.resolve(config)
      });

      const displayNotificationSpy = sinon.spy();

      const { Form, getProps: getFormProps } = createMockDeploymentConfigForm();

      const resourceConfigs = [
        {
          path: 'bar.bpmn',
          type: 'bpmn'
        }
      ];

      createDeploymentPluginOverlay({
        deployment,
        DeploymentConfigForm: Form,
        displayNotification: displayNotificationSpy,
        getResourceConfigs: () => resourceConfigs
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(config);

      // expect
      await waitFor(() => {
        expect(deployment.deploy).to.have.been.calledOnce;
      });

      expect(deployment.deploy).to.have.been.calledWith([
        {
          path: 'bar.bpmn',
          type: 'bpmn'
        }
      ], config);

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Process definition deployed',
        type: 'success'
      }));
    });


    it('should display custom success notification', async function() {

      // given
      const config = createMockConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult())),
        getConfigForFile: () => Promise.resolve(config)
      });

      const displayNotificationSpy = sinon.spy();

      const { Form, getProps: getFormProps } = createMockDeploymentConfigForm();

      createDeploymentPluginOverlay({
        deployment,
        DeploymentConfigForm: Form,
        displayNotification: displayNotificationSpy,
        getSuccessNotification: () => ({
          title: 'Custom success notification',
          type: 'success'
        })
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(config);

      // expect
      await waitFor(() => {
        expect(deployment.deploy).to.have.been.calledOnce;
      });

      expect(deployment.deploy).to.have.been.calledWith([
        {
          path: 'foo.bpmn',
          type: 'bpmn'
        }
      ], config);

      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWith(sinon.match({
        title: 'Custom success notification',
        type: 'success'
      }));
    });


    it('should display custom error notification', async function() {

      // given
      const config = createMockConfig();

      const deployment = new MockDeployment({
        deploy: sinon.spy(() => Promise.resolve(createMockDeploymentResult({
          success: false,
          response: {
            details: 'foo'
          }
        }))),
        getConfigForFile: () => Promise.resolve(config)
      });

      const displayNotificationSpy = sinon.spy();

      const { Form, getProps: getFormProps } = createMockDeploymentConfigForm();

      createDeploymentPluginOverlay({
        deployment,
        DeploymentConfigForm: Form,
        displayNotification: displayNotificationSpy,
        getErrorNotification: () => ({
          title: 'Custom error notification',
          type: 'error'
        })
      });

      await waitFor(() => {
        expect(document.querySelector('.loading')).not.to.exist;
      });

      // when
      getFormProps().onSubmit(config);

      // expect
      await waitFor(() => {
        expect(deployment.deploy).to.have.been.calledOnce;
      });

      expect(deployment.deploy).to.have.been.calledWith([
        {
          path: 'foo.bpmn',
          type: 'bpmn'
        }
      ], config);

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

  off() {}

  on() {}

  setConfigForFile() {}
}

class MockConfigValidator extends Mock {
  static validateConfigValue() {}

  static validateConfig() {
    return {};
  }
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
      <form onSubmit={ onSubmit }>
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
            bpmnProcessId: 'foo'
          }
        }
      ]
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

function createMockConfig(overrides = {}) {
  return {
    deployment: {},
    endpoint: createMockEndpoint(),
    ...overrides
  };
}

function createMockDeploymentErrorResponse() {
  return {
    message: "3 INVALID_ARGUMENT: Command 'CREATE' rejected with code 'INVALID_ARGUMENT': ...",
    code: 3,
    details: "Command 'CREATE' rejected with code 'INVALID_ARGUMENT': ..."
  };
}

function createDeploymentPluginOverlay(props = {}) {
  const {
    activeTab = DEFAULT_ACTIVE_TAB,
    anchor = new MockAnchor(),
    connectionChecker = new MockConnectionChecker(),
    deployment = new MockDeployment(),
    deploymentConfigValidator = MockConfigValidator,
    displayNotification = () => {},
    DeploymentConfigForm,
    getErrorNotification,
    getResourceConfigs,
    getSuccessNotification,
    log = () => {},
    onClose = () => {},
    renderHeader = 'Deploy',
    renderSubmit = 'Deploy',
    triggerAction = () => {},
  } = props;

  return mount(
    <DeploymentPluginOverlay
      activeTab={ activeTab }
      anchor={ anchor }
      connectionChecker={ connectionChecker }
      deployment={ deployment }
      deploymentConfigValidator={ deploymentConfigValidator }
      displayNotification={ displayNotification }
      DeploymentConfigForm={ DeploymentConfigForm }
      getErrorNotification={ getErrorNotification }
      getResourceConfigs={ getResourceConfigs }
      getSuccessNotification={ getSuccessNotification }
      log={ log }
      onClose={ onClose }
      renderHeader={ renderHeader }
      renderSubmit={ renderSubmit }
      triggerAction={ triggerAction } />
  );
}