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

import {
  mount,
  shallow
} from 'enzyme';

import { merge } from 'min-dash';

import AUTH_TYPES from '../../shared/AuthTypes';
import DeploymentConfigOverlay from '../DeploymentConfigOverlay';
import DeploymentConfigValidator from '../validation/DeploymentConfigValidator';
import { GenericApiErrors } from '../../shared/RestAPI';

let mounted;

describe('<DeploymentConfigOverlay>', function() {

  var anchor;

  beforeEach(function() {
    anchor = document.createElement('button');
  });

  it('should render', function() {
    createOverlay();
  });


  it('should render with customizations', function() {

    // given
    const options = {
      title: 'title',
      intro: 'intro',
      primaryAction: 'primaryAction',
      anchor
    };

    // when

    const { wrapper } = createOverlay(options, mount);

    const titleWrapper = wrapper.find('.section__header').first(),
          introWrapper = wrapper.find('.intro'),
          primaryActionWrapper = wrapper.find('.btn-primary');

    // then
    expect(titleWrapper.text()).to.eql(options.title);
    expect(introWrapper.text()).to.eql(options.intro);
    expect(primaryActionWrapper.text()).to.eql(options.primaryAction);
  });


  describe('connection check', function() {

    afterEach(function() {
      if (mounted && mounted.exists()) {
        mounted.unmount();
        mounted = null;
      }
    });


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
        validateConnection: () => new Promise((resolve, err) => {
          resolve({
            code: GenericApiErrors.UNAUTHORIZED
          });
        })
      });

      const {
        wrapper,
        instance
      } = createOverlay({
        anchor,
        configuration,
        validator
      }, mount);

      setTimeout(() => {

        // delayed execution because it is async that the deployment
        // tool knows if the authentication is necessary
        instance.isOnBeforeSubmit = true;
        wrapper.find('.btn-primary').simulate('submit');
      });

      // then
      await waitFor(() => {
        wrapper.update();
        expect(wrapper.find('.invalid-feedback')).to.have.length(2);
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
        })
      });

      const {
        wrapper,
        instance
      } = createOverlay({
        anchor,
        configuration,
        validator
      }, mount);


      setTimeout(() => {

        // delayed execution because it is async that the deployment
        // tool knows if the authentication is necessary
        instance.isOnBeforeSubmit = true;
        wrapper.find('.btn-primary').simulate('submit');
      });

      // then
      await waitFor(() => {
        wrapper.update();
        expect(wrapper.find('.invalid-feedback')).to.have.length(1);
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
        wrapper
      } = createOverlay({
        anchor,
        configuration,
        validator
      }, mount);

      // when
      wrapper.find('.btn-primary').simulate('submit');

      // then
      await waitFor(() => {
        wrapper.update();
        expect(wrapper.find('.invalid-feedback')).to.have.length(0);
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
        wrapper,
        instance
      } = createOverlay({
        anchor,
        configuration,
        validator
      }, mount);

      // when
      instance.isOnBeforeSubmit = true;
      wrapper.find('.btn-primary').simulate('submit');

      // then
      await waitFor(() => {
        wrapper.setProps({});
        expect(wrapper.find('.btn-primary').props()).to.have.property('disabled', false);
      });
    });


    it('should hide username password fields if auth is not needed', async function() {

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
        wrapper
      } = createOverlay({
        anchor,
        configuration,
        validator
      }, mount);

      // then
      await waitFor(() => {
        wrapper.update();
        expect(wrapper.find('[id="endpoint.username"]')).to.have.length(0);
        expect(wrapper.find('[id="endpoint.password"]')).to.have.length(0);
      });
    });


    it('should hide token field if auth is not needed', async function() {

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
        wrapper
      } = createOverlay({
        anchor,
        configuration,
        validator
      }, mount);

      // then
      await waitFor(() => {
        wrapper.update();
        expect(wrapper.find('[id="endpoint.token"]')).to.have.length(0);
      });
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
      wrapper
    } = createOverlay({
      anchor,
      configuration
    }, mount);

    // when
    wrapper.find('.btn-primary').simulate('click');

    // then
    await waitFor(() => {
      wrapper.update();
      expect(wrapper.find('.btn-primary').props()).to.have.property('disabled', false);
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

    const {
      wrapper
    } = createOverlay({
      anchor,
      configuration,
      saveCredentials,
    }, mount);

    // when
    wrapper.instance().onClose('save', null, true);

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
      wrapper
    } = createOverlay({
      anchor,
      configuration,
      removeCredentials
    }, mount);

    // when
    wrapper.instance().onClose('save', null, true);

    // then
    expect(removeCredentials).to.have.been.called;
  });


  it('should subscribe to focus change event when mounted', function() {

    // given
    const subscribeToFocusChange = sinon.spy();

    createOverlay({
      anchor,
      subscribeToFocusChange
    }, mount);

    // then
    expect(subscribeToFocusChange).to.have.been.called;
  });


  it('should subscribe to focus change event on mount', function() {

    // given
    const subscribeToFocusChange = sinon.spy();

    createOverlay({
      anchor,
      subscribeToFocusChange
    }, mount);

    // then
    expect(subscribeToFocusChange).to.have.been.called;
  });


  it('should unsubscribe from focus change event when unmounted', function() {

    // given
    const unsubscribeFromFocusChange = sinon.spy();

    const {
      wrapper
    } = createOverlay({
      anchor,
      unsubscribeFromFocusChange
    }, mount);

    // when
    wrapper.unmount();

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

    const {
      wrapper
    } = createOverlay({
      anchor,
      validator,
      configuration
    }, mount);

    // when
    wrapper.update();

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

    const {
      wrapper
    } = createOverlay({
      anchor,
      validator,
      configuration
    }, mount);

    // when
    wrapper.update();

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
      anchor,
      validator
    }, mount);

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

    const { instance } = createOverlay({ anchor }, mount);

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

    const { instance } = createOverlay({ anchor, validator }, mount);

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

    const { instance } = createOverlay({ anchor, validator }, mount);

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

    const { instance } = createOverlay({ anchor, validator }, mount);

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

    const validator = new MockValidator({ anchor, validateConnection });

    const {
      instance
    } = createOverlay({
      anchor,
      validator
    }, mount);

    const valuesCache = { endpoint: { test: true } };

    instance.valuesCache = valuesCache;
    instance.setFieldErrorCache = noop;
    instance.externalErrorCodeCache = 'UNAUTHORIZED';

    // when
    instance.onAppFocusChange();

    // then
    expect(validateConnection).to.not.have.been.calledWith(valuesCache.endpoint);
  });


  it('should reset validator cancel flag when mounted', function() {

    // given
    const resetCancel = sinon.spy();

    const validator = new MockValidator({ resetCancel });

    // when
    createOverlay({
      anchor,
      validator
    }, mount);

    // then
    expect(resetCancel).to.have.been.called;
  });
});



// helpers //////////

function createOverlay(props = {}, renderFn = shallow) {

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
    anchor,
    ...apiOverrides
  } = props;

  const validator = props.validator || new MockValidator(apiOverrides);

  const wrapper = renderFn(
    <DeploymentConfigOverlay
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

  mounted = wrapper;

  return {
    wrapper,
    instance: wrapper.instance()
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
