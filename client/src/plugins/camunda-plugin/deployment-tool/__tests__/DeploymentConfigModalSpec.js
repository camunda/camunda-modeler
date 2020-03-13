/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import {
  mount,
  shallow
} from 'enzyme';

import AuthTypes from '../../shared/AuthTypes';
import DeploymentConfigModal from '../DeploymentConfigModal';
import DeploymentConfigValidator from '../validation/DeploymentConfigValidator';


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


    it('should display hint if the username and password are missing when submitting', (done) => {

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

      const validator = new MockValidator({
        validateConnection: () => new Promise((resolve, err) => {
          resolve({
            code: 'UNAUTHORIZED'
          });
        })
      });

      const {
        wrapper,
        instance
      } = createModal({
        configuration,
        validator
      }, mount);

      // when
      setTimeout(() => {

        // delayed execution because it is async that the deployment
        // tool knows if the authentication is necessary
        instance.isOnBeforeSubmit = true;
        wrapper.find('.btn-primary').simulate('submit');
      });

      // then
      setTimeout(() => {
        wrapper.update();
        expect(wrapper.find('.invalid-feedback')).to.have.length(2);
        done();
      }, 200);
    });


    it('should display hint if token is missing', (done) => {

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

      const {
        wrapper
      } = createModal({
        configuration
      }, mount);

      // when
      wrapper.find('.btn-primary').simulate('submit');

      // then
      setTimeout(() => {
        wrapper.update();
        expect(wrapper.find('.invalid-feedback')).to.have.length(1);
        done();
      });
    });


    it('should not display hint if the username and password are complete', async () => {

      // given
      const configuration = {
        deployment: {
          tenantId: '',
          name: 'diagram'
        },
        endpoint: {
          url: 'http://localhost:8088/engine-rest',
          authType: AuthTypes.basic,
          username: 'demo',
          password: 'demo'
        }
      };

      const {
        wrapper
      } = createModal({
        configuration
      }, mount);

      // when

      wrapper.update();

      // then
      expect(wrapper.find('.invalid-feedback')).to.have.length(0);
    });


    it('should not disable deploy button when connection cannot be established', (done) => {

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

      const {
        wrapper
      } = createModal({
        configuration
      }, mount);

      // when
      wrapper.find('.btn-primary').simulate('submit');

      // then
      setTimeout(() => {
        wrapper.update();
        expect(wrapper.find('.btn-primary').props()).to.have.property('disabled', false);
        done();
      });
    });
  });


  it('should not disable deploy button when form is invalid', (done) => {

    // given
    const configuration = {
      deployment: {
        tenantId: '',
        name: ''
      },
      endpoint: {
        url: 'http://localhost:8088/engine-rest',
        authType: AuthTypes.basic
      }
    };

    const {
      wrapper
    } = createModal({
      configuration
    }, mount);

    // when
    wrapper.find('.btn-primary').simulate('click');

    // then
    setTimeout(() => {
      wrapper.update();
      expect(wrapper.find('.btn-primary').props()).to.have.property('disabled', false);
      done();
    });
  });
});



// helpers //////////

function createModal(props={}, renderFn = shallow) {

  const {
    configuration,
    onClose,
    title,
    primaryAction,
    intro,
    ...apiOverrides
  } = props;

  const validator = new MockValidator(apiOverrides);

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
      authType: AuthTypes.basic
    }
  };
}

class MockValidator extends DeploymentConfigValidator {

  constructor(apiStubs) {
    super();

    Object.assign(this, {
      ...apiStubs
    });
  }
}
