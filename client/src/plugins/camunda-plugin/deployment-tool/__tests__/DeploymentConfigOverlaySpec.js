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

import { waitFor } from '@testing-library/react';

import { render, fireEvent, act } from '@testing-library/react';

import { merge } from 'min-dash';

import AUTH_TYPES from '../../shared/AuthTypes';
import DeploymentConfigOverlay from '../DeploymentConfigOverlay';
import DeploymentConfigValidator from '../validation/DeploymentConfigValidator';
import { GenericApiErrors } from '../../shared/RestAPI';

describe('<DeploymentConfigOverlay>', function() {

  it('should render', function() {
    createOverlay();
  });


  it('should render with customizations', function() {

    // given
    const options = {
      title: 'title',
      intro: 'intro',
      primaryAction: 'primaryAction'
    };

    // when

    const { getByText } = createOverlay(options);

    // then
    expect(getByText(options.title)).to.exist;
    expect(getByText(options.intro)).to.exist;
    expect(getByText(options.primaryAction)).to.exist;
  });


  describe('connection check', function() {

    it('should display hint if the username and password are missing when submitting', async function() {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AUTH_TYPES.BASIC
        }
      };

      const validator = new MockValidator({
        validateConnection: async () => ({
          code: GenericApiErrors.UNAUTHORIZED
        }),
        validateConnectionWithoutCredentials: async () => ({
          code: GenericApiErrors.UNAUTHORIZED
        })
      });

      const {
        getByRole,
        getByLabelText
      } = createOverlay({
        configuration,
        validator
      });

      // when - wait for the auth fields to appear
      await waitFor(() => {
        expect(getByLabelText('Username')).to.exist;
      });

      act(() => {
        fireEvent.click(getByRole('button', { name: 'Deploy' }));
      });

      // then
      await waitFor(() => {
        const overlay = getByRole('dialog');
        expect(overlay.querySelectorAll('.invalid-feedback')).to.have.length(2);
      });
    });


    it('should display hint if token is missing', async function() {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AUTH_TYPES.BEARER
        }
      };

      const validator = new MockValidator({
        validateConnection: () => Promise.resolve({
          code: GenericApiErrors.UNAUTHORIZED
        }),
        validateConnectionWithoutCredentials: () => Promise.resolve({
          code: GenericApiErrors.UNAUTHORIZED
        })
      });

      const {
        getByRole,
        getByLabelText
      } = createOverlay({
        configuration,
        validator
      });

      // when
      await waitFor(() => {
        expect(getByLabelText('Token')).to.exist;
      });

      act(() => {
        fireEvent.click(getByRole('button', { name: 'Deploy' }));
      });

      // then
      await waitFor(() => {
        const overlay = getByRole('dialog');
        expect(overlay.querySelectorAll('.invalid-feedback')).to.have.length(1);
      });
    });


    it('should not display hint if the username and password are complete', async function() {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AUTH_TYPES.BASIC,
          username: 'demo',
          password: 'demo'
        }
      };

      const validator = new MockValidator({
        validateConnection: () => new Promise((resolve, err) => {
          resolve(null);
        })
      });

      const {
        getByRole
      } = createOverlay({
        configuration,
        validator
      });

      // when
      const submitButton = getByRole('button', { name: 'Deploy' });
      act(() => {
        fireEvent.click(submitButton);
      });

      // then
      await waitFor(() => {
        const overlay = getByRole('dialog');
        expect(overlay.querySelectorAll('.invalid-feedback')).to.have.length(0);
      });
    });


    it('should not disable deploy button when connection cannot be established', async function() {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AUTH_TYPES.BASIC
        }
      };

      const validator = new MockValidator({
        validateConnection: () => new Promise((resolve, err) => {
          resolve({ code: 'NOT_FOUND' });
        })
      });

      const {
        getByRole
      } = createOverlay({
        configuration,
        validator
      });

      // when
      const submitButton = getByRole('button', { name: 'Deploy' });
      act(() => {
        fireEvent.click(submitButton);
      });

      // then
      await waitFor(() => {
        expect(submitButton).to.have.property('disabled', false);
      });
    });


    it('should hide username password fields if auth is not needed', function() {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AUTH_TYPES.BASIC
        }
      };

      const validator = new MockValidator({
        validateConnectionWithoutCredentials: () => new Promise((resolve, reject) => {
          resolve(null);
        })
      });

      const {
        queryByText
      } = createOverlay({
        configuration,
        validator
      });

      // then
      expect(queryByText('Username')).to.not.exist;
      expect(queryByText('Password')).to.not.exist;
    });


    it('should hide token field if auth is not needed', function() {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AUTH_TYPES.BEARER
        }
      };

      const validator = new MockValidator({
        validateConnectionWithoutCredentials: () => new Promise((resolve, reject) => {
          resolve(null);
        })
      });

      const {
        queryByText
      } = createOverlay({
        configuration,
        validator
      });

      // then
      expect(queryByText('Token')).to.not.exist;
    });
  });


  it('should not disable deploy button when form is invalid', async function() {

    // given
    const configuration = {
      deployment: {
        tenantId: '',
        name: ''
      },
      endpoint: {
        url: 'http://localhost:8088/engine-rest',
        authType: AUTH_TYPES.BASIC
      }
    };

    const {
      getByRole
    } = createOverlay({
      configuration
    });

    // when
    const submitButton = getByRole('button', { name: 'Deploy' });
    act(() => {
      fireEvent.click(submitButton);
    });

    // then
    await waitFor(() => {
      expect(submitButton).to.have.property('disabled', false);
    });
  });


  it('should save credentials when closed and rememberCredentials is checked', function() {

    // given
    const configuration = {
      deployment: {
        tenantId: '',
        name: ''
      },
      endpoint: {
        url: 'http://localhost:8088/engine-rest',
        authType: AUTH_TYPES.BASIC,
        rememberCredentials: true,
        username: 'username1',
        password: '12345',
        token: 'testToken'
      }
    };

    const saveCredentials = sinon.spy();

    const { instance } = createOverlay({
      configuration,
      saveCredentials,
    });

    // when
    instance.onClose('save', null, true);

    // then
    expect(saveCredentials).to.have.been.called;
  });


  it('should remove credentials when closed and rememberCredentials is not checked', function() {

    // given
    const configuration = {
      deployment: {
        tenantId: '',
        name: ''
      },
      endpoint: {
        url: 'http://localhost:8088/engine-rest',
        authType: AUTH_TYPES.BASIC,
        rememberCredentials: false
      }
    };

    const removeCredentials = sinon.spy();

    const {
      instance
    } = createOverlay({
      configuration,
      removeCredentials
    });

    // when
    instance.onClose('save', null, true);

    // then
    expect(removeCredentials).to.have.been.called;
  });


  it('should subscribe to focus change event when mounted', function() {

    // given
    const subscribeToFocusChange = sinon.spy();

    createOverlay({
      subscribeToFocusChange
    });

    // then
    expect(subscribeToFocusChange).to.have.been.called;
  });


  it('should subscribe to focus change event on mount', function() {

    // given
    const subscribeToFocusChange = sinon.spy();

    createOverlay({
      subscribeToFocusChange
    });

    // then
    expect(subscribeToFocusChange).to.have.been.called;
  });


  it('should unsubscribe from focus change event when unmounted', function() {

    // given
    const unsubscribeFromFocusChange = sinon.spy();

    const {
      unmount
    } = createOverlay({
      unsubscribeFromFocusChange
    });

    // when
    unmount();

    // then
    expect(unsubscribeFromFocusChange).to.have.been.called;
  });


  it('should validate connection when overlay is opened if endpoint has a connection error', function() {

    // given
    const configuration = {
      deployment: {
        tenantId: '',
        name: ''
      },
      endpoint: {
        url: 'http://localhost:8088/engine-rest',
        authType: AUTH_TYPES.BASIC
      }
    };

    const validateConnection = sinon.spy();
    const validator = new MockValidator({ validateConnection });

    // when
    createOverlay({
      validator,
      configuration
    });

    // then
    expect(validateConnection).to.have.been.calledWith(configuration.endpoint);
  });


  it('should not validate connection when overlay is opened if endpoint does not have a connection error', function() {

    // given
    const configuration = {
      deployment: {
        tenantId: '',
        name: ''
      },
      endpoint: {
        url: 'http://localhost:8088/engine-rest',
        authType: AUTH_TYPES.BASIC
      }
    };

    const updateEndpointURLError = sinon.spy();
    const validateConnection = () => new Promise((resolve) => {
      resolve({ code: 'NOT_A_CONNECTION_ERROR' });
    });
    const validator = new MockValidator({ validateConnection, updateEndpointURLError });

    // when
    createOverlay({
      validator,
      configuration
    });

    // then
    expect(updateEndpointURLError).to.not.have.been.called;
  });


  it('should validate connection when app gains focus if endpoint has a connection error', function() {

    // given
    const validateConnection = sinon.spy();

    const validator = new MockValidator({ validateConnection });

    const {
      instance
    } = createOverlay({
      validator
    });

    const valuesCache = { endpoint: { test: true } };

    instance.valuesCache = valuesCache;
    instance.setFieldErrorCache = noop;
    instance.externalErrorCodeCache = 'NO_INTERNET_CONNECTION';

    // when
    instance.onAppFocusChange();

    // then
    expect(validateConnection).to.have.been.calledWith(valuesCache.endpoint);
  });


  it('should check auth status on focus change', function() {

    // given
    const checkAuthStatusSpy = sinon.spy();

    const { instance } = createOverlay();

    instance.checkAuthStatus = checkAuthStatusSpy;
    instance.valuesCache = {};
    instance.setFieldErrorCache = noop;

    // when
    instance.onAppFocusChange();

    // then
    expect(checkAuthStatusSpy).to.have.been.called;
  });


  it('should clear endpoint url errors on focus change if connection validated', async function() {

    // given
    const valuesCache = {};
    const setFieldErrorCache = noop;
    const clearEndpointURLError = sinon.spy();
    const validateConnection = () => new Promise((resolve) => {
      resolve(null);
    });

    const validator = new MockValidator({ clearEndpointURLError, validateConnection });

    const { instance } = createOverlay({ validator });

    instance.checkAuthStatus = noop;
    instance.valuesCache = valuesCache;
    instance.setFieldErrorCache = setFieldErrorCache;
    instance.externalErrorCodeCache = 'NO_INTERNET_CONNECTION';

    // when
    await instance.onAppFocusChange();

    // then
    expect(clearEndpointURLError).to.have.been.calledWith(noop);
  });


  it('should update endpoint url errors on focus change if connection not validated', async function() {

    // given
    const valuesCache = {};
    const setFieldErrorCache = noop;
    const updateEndpointURLError = sinon.spy();
    const validateConnection = () => new Promise((resolve) => {
      resolve({ code: 'NOT_FOUND' });
    });

    const validator = new MockValidator({ updateEndpointURLError, validateConnection });

    const { instance } = createOverlay({ validator });

    instance.checkAuthStatus = noop;
    instance.valuesCache = valuesCache;
    instance.setFieldErrorCache = setFieldErrorCache;
    instance.externalErrorCodeCache = 'NO_INTERNET_CONNECTION';

    // when
    await instance.onAppFocusChange();

    // then
    expect(updateEndpointURLError).to.have.been.called;
  });


  it('should not update endpoint url errors on focus change if connection invalidated with a connection error', async function() {

    // given
    const valuesCache = {};
    const setFieldErrorCache = noop;
    const updateEndpointURLError = sinon.spy();
    const validateConnection = () => new Promise((resolve) => {
      resolve({ code: 'NOT_A_CONNECTION_ERROR' });
    });

    const validator = new MockValidator({ updateEndpointURLError, validateConnection });

    const { instance } = createOverlay({ validator });

    instance.checkAuthStatus = noop;
    instance.valuesCache = valuesCache;
    instance.setFieldErrorCache = setFieldErrorCache;
    instance.externalErrorCodeCache = 'NO_INTERNET_CONNECTION';

    // when
    await instance.onAppFocusChange();

    // then
    expect(updateEndpointURLError).to.not.have.been.calledWith('NOT_A_CONNECTION_ERROR' ,noop);
  });


  it('should not validate connection when app gains focus if endpoint does not have a connection error', function() {

    // given
    const validateConnection = sinon.spy();

    const validator = new MockValidator({ validateConnection });

    const {
      instance
    } = createOverlay({
      validator
    });

    const valuesCache = { endpoint: { test: true } };

    instance.valuesCache = valuesCache;
    instance.setFieldErrorCache = noop;
    instance.externalErrorCodeCache = 'UNAUTHORIZED';

    // when
    instance.onAppFocusChange();

    // then
    expect(validateConnection).to.not.have.been.calledWith(valuesCache.endpoint);
  });


  it('should reset validator cancel flag when mounted', async function() {

    // given
    const resetCancel = sinon.spy();

    const validator = new MockValidator({ resetCancel });

    // when
    createOverlay({
      validator
    });

    // then
    await waitFor(() => {
      expect(resetCancel).to.have.been.called;
    });
  });
});



// helpers //////////

function createOverlay(props = {}) {

  const {
    configuration,
    onClose,
    title,
    primaryAction,
    intro,
    saveCredentials,
    removeCredentials,
    subscribeToFocusChange,
    unsubscribeFromFocusChange,
    ...apiOverrides
  } = props;

  const validator = props.validator || new MockValidator(apiOverrides);

  const { container } = render(<button />);
  const anchor = container.firstChild;

  const ref = React.createRef();

  const rendered = render(
    <DeploymentConfigOverlay
      ref={ ref }
      validator={ validator }
      configuration={ getConfiguration(configuration) }
      onClose={ onClose || noop }
      title={ title }
      primaryAction={ primaryAction }
      saveCredentials={ saveCredentials || noop }
      removeCredentials={ removeCredentials || noop }
      intro={ intro }
      subscribeToFocusChange={ subscribeToFocusChange || noop }
      unsubscribeFromFocusChange={ unsubscribeFromFocusChange || noop }
      anchor={ anchor }
    />
  );

  return {
    ...rendered,
    instance: ref.current
  };
}

function noop() {}

function getConfiguration(overrides = {}) {
  return merge({}, getDefaultConfiguration(), overrides);
}

function getDefaultConfiguration() {
  return {
    deployment: {
      name: 'diagram',
      tenantId: '',
      attachments: []
    },
    endpoint: {
      url: 'http://localhost:8080/engine-rest',
      authType: AUTH_TYPES.BASIC
    }
  };
}

class MockValidator extends DeploymentConfigValidator {

  constructor(apiStubs) {
    super();

    Object.assign(this, { ...apiStubs });
  }
}
