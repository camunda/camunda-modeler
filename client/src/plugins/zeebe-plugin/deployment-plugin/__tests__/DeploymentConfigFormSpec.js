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

import { act } from 'react-dom/test-utils';

import { mount } from 'enzyme';

import { merge } from 'min-dash';

import DeploymentConfigForm from '../DeploymentConfigForm';

import { AUTH_TYPES, TARGET_TYPES } from '../../../../remote/ZeebeAPI';

describe('<DeploymentConfigForm>', function() {

  it('should render', function() {

    // when
    const wrapper = createDeploymentConfigForm();

    // then
    expect(wrapper.exists()).to.be.true;
  });


  it('should render no header by default', function() {

    // when
    const wrapper = createDeploymentConfigForm();

    // then
    expect(wrapper.find('.section__header').exists()).to.be.false;
  });


  it('should render custom header', function() {

    // given
    const renderHeader = 'Custom Header';

    // when
    const wrapper = createDeploymentConfigForm({
      renderHeader
    });

    // then
    expect(wrapper.find('.section__header').exists()).to.be.true;
  });


  it('should render default submit button', function() {

    // when
    const wrapper = createDeploymentConfigForm();

    // then
    expect(wrapper.find('button[type="submit"]').text()).to.eql('Submit');
  });


  it('should render custom submit button', function() {

    // given
    const renderSubmit = 'Custom Submit';

    // when
    const wrapper = createDeploymentConfigForm({
      renderSubmit
    });

    // then
    expect(wrapper.find('button[type="submit"]').text()).to.eql(renderSubmit);
  });


  describe('fields', function() {

    describe('target', function() {

      it('should render', function() {

        // when
        const wrapper = createDeploymentConfigForm();

        // then
        expect(wrapper.find('label[htmlFor="endpoint.targetType"]').exists()).to.be.true;
        expect(wrapper.find('input[name="endpoint.targetType"][value="camundaCloud"]').exists()).to.be.true;
        expect(wrapper.find('input[name="endpoint.targetType"][value="camundaCloud"]').prop('checked')).to.be.true;
        expect(wrapper.find('input[name="endpoint.targetType"][value="selfHosted"]').exists()).to.be.true;
      });

    });


    describe('self-managed and no auth', function() {

      it('should render', function() {

        // when
        const wrapper = createDeploymentConfigForm({
          initialFieldValues: {
            endpoint: {
              targetType: TARGET_TYPES.SELF_HOSTED,
              authType: AUTH_TYPES.NONE
            }
          }
        });

        // then
        expect(wrapper.find('label[htmlFor="endpoint.targetType"]').exists()).to.be.true;
        expect(wrapper.find('input[name="endpoint.targetType"][value="selfHosted"]').prop('checked')).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.contactPoint"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="deployment.tenantId"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.operateUrl"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.authType"]').exists()).to.be.true;
        expect(wrapper.find('input[type="checkbox"][name="endpoint.rememberCredentials"]').exists()).to.be.true;
      });

    });


    describe('self-managed and basic auth', function() {

      it('should render', function() {

        // when
        const wrapper = createDeploymentConfigForm({
          initialFieldValues: {
            endpoint: {
              targetType: TARGET_TYPES.SELF_HOSTED,
              authType: AUTH_TYPES.BASIC
            }
          }
        });

        // then
        expect(wrapper.find('label[htmlFor="endpoint.targetType"]').exists()).to.be.true;
        expect(wrapper.find('input[name="endpoint.targetType"][value="selfHosted"]').prop('checked')).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.contactPoint"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="deployment.tenantId"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.operateUrl"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.authType"]').exists()).to.be.true;
        expect(wrapper.find('input[name="endpoint.authType"][value="basic"]').prop('checked')).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.basicAuthUsername"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.basicAuthPassword"]').exists()).to.be.true;
        expect(wrapper.find('input[type="checkbox"][name="endpoint.rememberCredentials"]').exists()).to.be.true;
      });

    });


    describe('self-managed and oauth', function() {

      it('should render', function() {

        // when
        const wrapper = createDeploymentConfigForm({
          initialFieldValues: {
            endpoint: {
              targetType: TARGET_TYPES.SELF_HOSTED,
              authType: AUTH_TYPES.OAUTH
            }
          }
        });

        // then
        expect(wrapper.find('label[htmlFor="endpoint.targetType"]').exists()).to.be.true;
        expect(wrapper.find('input[name="endpoint.targetType"][value="selfHosted"]').prop('checked')).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.contactPoint"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="deployment.tenantId"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.operateUrl"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.authType"]').exists()).to.be.true;
        expect(wrapper.find('input[name="endpoint.authType"][value="oauth"]').prop('checked')).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.clientId"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.clientSecret"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.oauthURL"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.audience"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.scope"]').exists()).to.be.true;
        expect(wrapper.find('input[type="checkbox"][name="endpoint.rememberCredentials"]').exists()).to.be.true;
      });

    });


    describe('saas', function() {

      it('should render', function() {

        // when
        const wrapper = createDeploymentConfigForm({
          initialFieldValues: {
            endpoint: {
              targetType: TARGET_TYPES.CAMUNDA_CLOUD
            }
          }
        });

        // then
        expect(wrapper.find('label[htmlFor="endpoint.targetType"]').exists()).to.be.true;
        expect(wrapper.find('input[name="endpoint.targetType"][value="camundaCloud"]').prop('checked')).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.camundaCloudClusterUrl"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.camundaCloudClientId"]').exists()).to.be.true;
        expect(wrapper.find('label[htmlFor="endpoint.camundaCloudClientSecret"]').exists()).to.be.true;
        expect(wrapper.find('input[type="checkbox"][name="endpoint.rememberCredentials"]').exists()).to.be.true;
      });

    });


    describe('remember credentials', function() {

      it('should render', function() {

        // when
        const wrapper = createDeploymentConfigForm({
          initialFieldValues: {
            endpoint: {
              rememberCredentials: true
            }
          }
        });

        // then
        expect(wrapper.find('input[type="checkbox"][name="endpoint.rememberCredentials"]').exists()).to.be.true;
        expect(wrapper.find('input[type="checkbox"][name="endpoint.rememberCredentials"]').prop('checked')).to.be.true;
      });

    });

  });


  describe('submission', function() {

    it('should submit', async function() {

      // given
      const onSubmitSpy = sinon.spy();

      const wrapper = createDeploymentConfigForm({
        onSubmit: onSubmitSpy
      });

      // when
      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClusterUrl"]').simulate('change', {
          target: { name: 'endpoint.camundaCloudClusterUrl', value: 'http://foo.com' }
        });

        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('change', {
          target: { name: 'endpoint.camundaCloudClientId', value: 'foo' }
        });

        wrapper.find('input[name="endpoint.camundaCloudClientSecret"]').simulate('change', {
          target: { name: 'endpoint.camundaCloudClientSecret', value: 'bar' }
        });
      });

      wrapper.update();

      await act(async () => {
        wrapper.find('form').simulate('submit');
      });

      wrapper.update();

      // then
      expect(onSubmitSpy).to.have.been.calledOnce;
      expect(onSubmitSpy).to.have.been.calledWith(merge({}, DEFAULT_INITIAL_FIELD_VALUES, {
        endpoint: {
          camundaCloudClusterUrl: 'http://foo.com',
          camundaCloudClientId: 'foo',
          camundaCloudClientSecret: 'bar'
        }
      }));
    });


    it('should submit (self-managed, basic auth, with tenant)', async function() {

      // given
      const onSubmitSpy = sinon.spy();

      const wrapper = createDeploymentConfigForm({
        onSubmit: onSubmitSpy,
        initialFieldValues: {
          deployment: {},
          endpoint: {
            targetType: TARGET_TYPES.SELF_HOSTED,
            authType: AUTH_TYPES.BASIC
          }
        }
      });

      // when
      await act(async () => {
        wrapper.find('input[name="endpoint.contactPoint"]').simulate('change', {
          target: { name: 'endpoint.contactPoint', value: 'http://localhost:26500' }
        });

        wrapper.find('input[name="endpoint.basicAuthUsername"]').simulate('change', {
          target: { name: 'endpoint.basicAuthUsername', value: 'username' }
        });

        wrapper.find('input[name="endpoint.basicAuthPassword"]').simulate('change', {
          target: { name: 'endpoint.basicAuthPassword', value: 'password' }
        });

        wrapper.find('input[name="deployment.tenantId"]').simulate('change', {
          target: { name: 'deployment.tenantId', value: 'my-tenant' }
        });
      });

      wrapper.update();

      await act(async () => {
        wrapper.find('form').simulate('submit');
      });

      wrapper.update();

      // then
      expect(onSubmitSpy).to.have.been.calledOnce;
      expect(onSubmitSpy).to.have.been.calledWith(merge({}, DEFAULT_INITIAL_FIELD_VALUES, {
        deployment: {
          tenantId: 'my-tenant'
        },
        endpoint: {
          targetType: TARGET_TYPES.SELF_HOSTED,
          authType: AUTH_TYPES.BASIC,
          contactPoint: 'http://localhost:26500',
          basicAuthUsername: 'username',
          basicAuthPassword: 'password'
        }
      }));
    });


    it('should be disabled when submitting', async function() {

      // given
      const onSubmitSpy = sinon.spy((_, props) => {

        // then
        expect(props.isSubmitting).to.be.true;
        expect(wrapper.find('button[type="submit"]').prop('disabled')).to.be.true;

        return Promise.resolve();
      });

      const wrapper = createDeploymentConfigForm({
        onSubmit: onSubmitSpy
      });

      // when
      await act(async () => {
        wrapper.find('form').simulate('submit');
      });

      wrapper.update();

      // then
      expect(onSubmitSpy).to.have.been.calledOnce;
    });

  });


  describe('validation', function() {

    it('should validate form and fields on mount', async function() {

      // given
      const validateFieldSpy = sinon.spy(),
            validateFormSpy = sinon.spy();

      createDeploymentConfigForm({
        validateField: validateFieldSpy,
        validateForm: validateFormSpy
      });

      // then
      expect(validateFieldSpy.callCount).to.eql(3);

      expect(validateFieldSpy).to.have.been.calledWith('endpoint.camundaCloudClusterUrl', undefined);
      expect(validateFieldSpy).to.have.been.calledWith('endpoint.camundaCloudClientId', undefined);
      expect(validateFieldSpy).to.have.been.calledWith('endpoint.camundaCloudClientSecret', undefined);

      expect(validateFormSpy).to.have.been.calledOnce;

      expect(validateFormSpy).to.have.been.calledWith({
        deployment: {},
        endpoint: {
          authType: AUTH_TYPES.NONE,
          targetType: TARGET_TYPES.CAMUNDA_CLOUD
        }
      });
    });


    it('should validate form on submit', async function() {

      // given
      const validateFieldSpy = sinon.spy(),
            validateFormSpy = sinon.spy();

      const wrapper = createDeploymentConfigForm({
        validateField: validateFieldSpy,
        validateForm: validateFormSpy
      });

      // then
      expect(validateFormSpy).to.have.been.calledWith({
        deployment: {},
        endpoint: {
          authType: AUTH_TYPES.NONE,
          targetType: TARGET_TYPES.CAMUNDA_CLOUD
        }
      });

      // when
      validateFieldSpy.resetHistory();
      validateFormSpy.resetHistory();

      await act(async () => {
        wrapper.find('form').simulate('submit');
      });

      wrapper.update();

      // then
      expect(validateFieldSpy.callCount).to.eql(3);
      expect(validateFormSpy.callCount).to.eql(1);
    });


    it('should validate form on blur', async function() {

      // given
      const validateFieldSpy = sinon.spy(),
            validateFormSpy = sinon.spy();

      const wrapper = createDeploymentConfigForm({
        validateField: validateFieldSpy,
        validateForm: validateFormSpy
      });

      // then
      expect(validateFormSpy).to.have.been.calledWith({
        deployment: {},
        endpoint: {
          authType: AUTH_TYPES.NONE,
          targetType: TARGET_TYPES.CAMUNDA_CLOUD
        }
      });

      // when
      validateFieldSpy.resetHistory();
      validateFormSpy.resetHistory();

      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('blur', {
          target: { name: 'endpoint.camundaCloudClientId', value: 'foo' }
        });
      });

      wrapper.update();

      // then
      expect(validateFieldSpy.callCount).to.eql(3);
      expect(validateFormSpy.callCount).to.eql(1);
    });


    it('should validate field value on change', async function() {

      // given
      const validateFieldSpy = sinon.spy();

      const wrapper = createDeploymentConfigForm({
        validateField: validateFieldSpy
      });

      // when
      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('change', {
          target: { name: 'endpoint.camundaCloudClientId', value: 'foo' }
        });
      });

      wrapper.update();

      // then
      expect(validateFieldSpy).to.have.been.calledWith('endpoint.camundaCloudClientId', 'foo');
    });


    it('should add field error (getFieldError)', async function() {

      // given
      const wrapper = createDeploymentConfigForm({
        getFieldError: (fieldName) => {
          return fieldName === 'endpoint.camundaCloudClientId' ? 'Error' : undefined;
        }
      });

      // then
      expect(wrapper.find('.invalid-feedback').text()).to.eql('Error');
    });


    it('should add field error (meta.error)', async function() {

      // given
      const wrapper = createDeploymentConfigForm({
        validateField: (name, value) => name === 'endpoint.camundaCloudClientId' && value === 'foo' ? 'Error' : undefined
      });

      // when
      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('change', {
          target: { name: 'endpoint.camundaCloudClientId', value: 'foo' }
        });
      });

      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('blur');
      });

      wrapper.update();

      // then
      expect(wrapper.find('.invalid-feedback').text()).to.eql('Error');
    });


    it('should remove field error (getFieldError)', async function() {

      // given
      let error = 'Error';

      const getFieldError = (meta, fieldName) => fieldName === 'endpoint.camundaCloudClientId' ? error : undefined;

      const wrapper = createDeploymentConfigForm({
        getFieldError,
        initialFieldValues: {
          endpoint: {
            camundaCloudClientId: 'foo'
          }
        }
      });

      // when
      error = undefined;

      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('change', {
          target: { name: 'endpoint.camundaCloudClientId', value: 'bar' }
        });
      });

      wrapper.update();

      // then
      expect(wrapper.find('.invalid-feedback').exists()).to.be.false;
    });


    it('should remove field error (meta.error)', async function() {

      // given
      const wrapper = createDeploymentConfigForm({
        validateField: (name, value) => name === 'endpoint.camundaCloudClientId' && value === 'foo' ? 'Error' : undefined
      });

      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('change', {
          target: { name: 'endpoint.camundaCloudClientId', value: 'foo' }
        });
      });

      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('blur');
      });

      wrapper.update();

      // when
      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('change', {
          target: { name: 'endpoint.camundaCloudClientId', value: 'bar' }
        });
      });

      await act(async () => {
        wrapper.find('input[name="endpoint.camundaCloudClientId"]').simulate('blur');
      });

      wrapper.update();


      expect(wrapper.find('.invalid-feedback').exists()).to.be.false;
    });

  });

});

const DEFAULT_INITIAL_FIELD_VALUES = {
  deployment: {},
  endpoint: {
    authType: AUTH_TYPES.NONE,
    targetType: TARGET_TYPES.CAMUNDA_CLOUD
  }
};

function createDeploymentConfigForm(props = {}) {
  let {
    getFieldError = (meta, fieldName) => {},
    initialFieldValues = {},
    onSubmit = () => {},
    renderHeader = null,
    renderSubmit = 'Submit',
    validateField = () => {},
    validateForm = () => {}
  } = props;

  initialFieldValues = merge({}, DEFAULT_INITIAL_FIELD_VALUES, initialFieldValues);

  return mount(<DeploymentConfigForm
    getFieldError={ getFieldError }
    initialFieldValues={ initialFieldValues }
    onSubmit={ onSubmit }
    renderHeader={ renderHeader }
    renderSubmit={ renderSubmit }
    validateField={ validateField }
    validateForm={ validateForm } />);
}