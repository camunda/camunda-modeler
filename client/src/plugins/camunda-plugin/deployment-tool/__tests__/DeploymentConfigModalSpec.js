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

import pDefer from 'p-defer';

import {
  mount,
  shallow
} from 'enzyme';

import AuthTypes from '../../shared/AuthTypes';
import DeploymentConfigModal from '../DeploymentConfigModal';
import DeploymentConfigValidator from '../DeploymentConfigValidator';


let mounted;

describe('<DeploymentConfigModal>', () => {

  it('should render', () => {
    createModal();
  });


  it('should render with customizations', () => {

    // given
    const options = {
      title: 'title',
      intro: 'intro',
      primaryAction: 'primaryAction'
    };

    // when
    const { wrapper } = createModal(options, mount);

    const titleWrapper = wrapper.find('.modal-title'),
          introWrapper = wrapper.find('.intro'),
          primaryActionWrapper = wrapper.find('.btn-primary');

    // then
    expect(titleWrapper.text()).to.eql(options.title);
    expect(introWrapper.text()).to.eql(options.intro);
    expect(primaryActionWrapper.text()).to.eql(options.primaryAction);
  });


  describe('connection check', () => {

    afterEach(() => {
      if (mounted && mounted.exists()) {
        mounted.unmount();
        mounted = null;
      }
    });


    it('should run connection check on mount with provided defaults', () => {

      // given
      const configuration = {
        deployment: {
          name: 'diagram',
          tenantId: ''
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AuthTypes.basic,
          username: 'demo',
          password: 'demo'
        }
      };

      const connectionChecker = new MockConnectionChecker();

      // when
      createModal({
        connectionChecker,
        configuration
      }, mount);

      // then
      expect(connectionChecker.check).to.have.been.calledOnce;
      expect(connectionChecker.check).to.have.been.calledWith(configuration.endpoint);
    });


    it('should display hint if the username and password are missing', async () => {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AuthTypes.basic
        }
      };

      const connectionChecker = new MockConnectionChecker();

      const {
        wrapper
      } = createModal({
        connectionChecker,
        configuration
      }, mount);

      // when
      await connectionChecker.triggerComplete({});

      wrapper.update();

      // then
      expect(wrapper.find('.hint.error')).to.have.length(2);
    });


    it('should display hint if token is missing', async () => {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AuthTypes.bearer
        }
      };

      const connectionChecker = new MockConnectionChecker();

      const {
        wrapper
      } = createModal({
        connectionChecker,
        configuration
      }, mount);

      // when
      await connectionChecker.triggerComplete({});

      wrapper.update();

      // then
      expect(wrapper.find('.hint.error')).to.have.length(1);
    });


    it('should disable deploy button when connection cannot be established', async () => {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AuthTypes.none
        }
      };

      const connectionChecker = new MockConnectionChecker();

      const {
        wrapper
      } = createModal({
        connectionChecker,
        configuration
      }, mount);

      // when
      await connectionChecker.triggerComplete({ connectionError: true });

      wrapper.update();

      // then
      expect(wrapper.find('.btn-primary').props()).to.have.property('disabled', true);
    });
  });


  it('should disable deploy button when form is invalid', async () => {

    // given
    const configuration = {
      deployment: {
        tenantId: '',
        name: ''
      },
      endpoint: {
        url: 'http://localhost:8088/engine-rest',
        authType: AuthTypes.none
      }
    };

    const connectionChecker = new MockConnectionChecker();

    const {
      wrapper
    } = createModal({
      connectionChecker,
      configuration
    }, mount);

    // when
    await connectionChecker.triggerComplete({});

    wrapper.update();

    // then
    expect(wrapper.find('.btn-primary').props()).to.have.property('disabled', true);
  });
});



// helpers //////////

function createModal(props={}, renderFn = shallow) {

  const {
    configuration,
    onClose,
    connectionChecker,
    title,
    primaryAction,
    intro,
    ...apiOverrides
  } = props;

  const validator = new MockValidator(
    connectionChecker || new MockConnectionChecker(), apiOverrides
  );

  const wrapper = renderFn(
    <DeploymentConfigModal
      validator={ validator }
      configuration={ configuration || getDefaultConfiguration() }
      onClose={ onClose || noop }
      title={ title }
      primaryAction={ primaryAction }
      intro={ intro }
    />
  );

  mounted = wrapper;

  return {
    wrapper,
    instance: wrapper.instance()
  };
}

function noop() {}

function getDefaultConfiguration() {
  return {
    deployment: {
      name: 'diagram',
      tenantId: ''
    },
    endpoint: {
      url: 'http://localhost:8080/engine-rest',
      authType: AuthTypes.none
    }
  };
}

class MockConnectionChecker {

  constructor() {
    sinon.spy(this, 'check');
  }

  subscribe(hooks) {
    this.hooks = hooks;
  }

  unsubscribe() {
    this.hooks = null;
  }

  check(endpoint) {

    this.deferred = pDefer();

    return this.deferred.promise.then(result => {

      this.hooks && this.hooks.onComplete(result);

      return result;
    });
  }

  triggerStart() {
    this.hooks && this.hooks.onStart();

    return new Promise(resolve => {
      setTimeout(resolve, 5);
    });
  }

  triggerComplete(result) {

    this.deferred && this.deferred.resolve(result);

    return new Promise(resolve => {
      setTimeout(resolve, 5);
    });
  }

}

class MockValidator extends DeploymentConfigValidator {

  constructor(connectionChecker, apiStubs) {
    super();

    Object.assign(this, {
      connectionChecker,
      ...apiStubs
    });
  }

  createConnectionChecker() {
    return this.connectionChecker;
  }

}
