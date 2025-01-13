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

import { mount } from 'enzyme';

import DeploymentPluginOverlay from '../DeploymentPluginOverlay';

import { AUTH_TYPES } from '../../shared/ZeebeAuthTypes';

import {
  SELF_HOSTED,
  CAMUNDA_CLOUD
} from '../../shared/ZeebeTargetTypes';

describe('<DeploymentPluginModal> (Zeebe)', function() {

  var anchor;

  beforeEach(function() {
    anchor = document.createElement('button');
  });

  it('should render', function() {
    createDeploymentPluginModal({ anchor });
  });


  it('should check connection initially', function(done) {

    // given
    const spy = sinon.spy();
    const validator = {
      createConnectionChecker: () => createConnectionChecker({ check: spy })
    };
    createDeploymentPluginModal({ anchor, validator });

    // then
    setTimeout(() => {
      expect(spy).to.have.been.called;
      done();
    }, 500);
  });


  it('should deploy', function(done) {

    // given
    const { wrapper } = createDeploymentPluginModal({ anchor, onDeploy });

    // when
    const form = wrapper.find('form');
    form.simulate('submit');

    // then
    function onDeploy() {
      done();
    }
  });


  it('should check connection with updated cluster values on input change', function(done) {

    // given
    const spy = sinon.stub();
    const validator = {
      createConnectionChecker: () => createConnectionChecker({ check: spy })
    };

    const { wrapper } = createDeploymentPluginModal({
      anchor,
      validator,
      config: {
        endpoint: {
          targetType: CAMUNDA_CLOUD,
          camundaCloudClusterUrl: '7edda473-891c-4978-aa27-2e727d8560ff.ber-5.zeebe.camunda.io:443'
        }
      }
    });

    // assume
    expect(spy).to.have.been.calledOnce;
    expect(spy.getCall(0).args[0].camundaCloudClusterUrl).to.equal('7edda473-891c-4978-aa27-2e727d8560ff.ber-5.zeebe.camunda.io:443');

    // when
    const input = wrapper.find('input[id="endpoint.camundaCloudClusterUrl"]');
    input.instance().value = 'a-b-c.foo-1.zeebe.camunda.io:443';
    input.simulate('change');

    // then
    expect(spy).to.have.been.calledTwice;
    expect(spy.getCall(1).args[0].camundaCloudClusterUrl).to.equal('a-b-c.foo-1.zeebe.camunda.io:443');

    done();
  });


  describe('tenantId', function() {

    it('should not show for self-managed without OAuth', function() {

      // given
      const { wrapper } = createDeploymentPluginModal({
        anchor,
        config: {
          endpoint: {
            targetType: SELF_HOSTED,
            authType: AUTH_TYPES.NONE,
            contactPoint: 'https://google.com'
          },
          deployment: {
            tenantId: 'tenant-1'
          }
        }
      });

      // when
      const tenantIdInput = wrapper.find('input[name="deployment.tenantId"]');

      // then
      expect(tenantIdInput.exists()).to.be.false;
    });


    it('should show for self-managed with OAuth', function() {

      // given
      const { wrapper } = createDeploymentPluginModal({
        anchor,
        config: {
          endpoint: {
            targetType: SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'https://google.com'
          },
          deployment: {
            tenantId: 'tenant-1'
          }
        }
      });

      // when
      const tenantIdInput = wrapper.find('input[name="deployment.tenantId"]');

      // then
      expect(tenantIdInput.exists()).to.be.true;
      expect(tenantIdInput.instance().value).to.eql('tenant-1');
    });


    it('should not pass on deploy without OAuth', function(done) {

      // given
      const { wrapper } = createDeploymentPluginModal({
        anchor,
        onDeploy,
        config: {
          endpoint: {
            targetType: SELF_HOSTED,
            authType: AUTH_TYPES.NONE,
            contactPoint: 'https://google.com',
          },
          deployment: {
            tenantId: 'tenant-1'
          }
        }
      });

      // when deploy
      wrapper.find('form').simulate('submit');

      // then
      function onDeploy(values) {
        const { deployment } = values;

        expect(deployment.tenantId).not.to.exist;

        done();
      }
    });


    it('should pass on deploy with OAuth', function(done) {

      // given
      const { wrapper } = createDeploymentPluginModal({
        anchor,
        onDeploy,
        config: {
          endpoint: {
            targetType: SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'https://google.com'
          },
          deployment: {
            tenantId: 'tenant-1'
          }
        }
      });

      // when deploy
      wrapper.find('form').simulate('submit');

      // then
      function onDeploy(values) {
        const { deployment } = values;

        expect(deployment.tenantId).to.eql('tenant-1');

        done();
      }
    });


    it('should not show for SaaS', function() {

      // given
      const { wrapper } = createDeploymentPluginModal({
        anchor,
        config: {
          endpoint: {
            targetType: CAMUNDA_CLOUD,
            camundaCloudClusterUrl: '7edda473-891c-4978-aa27-2e727d8560ff.ber-5.zeebe.camunda.io:443'
          }
        }
      });

      // when
      const tenantIdInput = wrapper.find('input[name="deployment.tenantId"]');

      // then
      expect(tenantIdInput.exists()).to.be.false;
    });

  });


  describe('basic auth', function() {

    it('should pass config on deploy', function(done) {

      // given
      const { wrapper } = createDeploymentPluginModal({
        anchor,
        onDeploy,
        config: {
          endpoint: {
            targetType: SELF_HOSTED,
            authType: AUTH_TYPES.BASIC,
            basicAuthUsername: 'username',
            basicAuthPassword: 'password'
          }
        }
      });

      // when deploy
      wrapper.find('form').simulate('submit');

      // then
      function onDeploy(values) {

        const { endpoint } = values;

        expect(endpoint.basicAuthUsername).to.eql('username');
        expect(endpoint.basicAuthPassword).to.eql('password');

        done();
      }
    });

  });


  describe('oAuth', function() {

    it('should pass config on deploy', function(done) {

      // given
      const { wrapper } = createDeploymentPluginModal({
        anchor,
        onDeploy,
        config: {
          endpoint: {
            targetType: SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'https://google.com',
            audience: 'audience'
          }
        }
      });

      // when deploy
      wrapper.find('form').simulate('submit');

      // then
      function onDeploy(values) {

        const { endpoint } = values;

        expect(endpoint.scope).not.to.exists;
        expect(endpoint.audience).to.eql('audience');

        done();
      }
    });


    it('should pass <scope> on deploy', function(done) {

      // given
      const { wrapper } = createDeploymentPluginModal({
        anchor,
        onDeploy,
        config: {
          endpoint: {
            targetType: SELF_HOSTED,
            authType: AUTH_TYPES.OAUTH,
            contactPoint: 'https://google.com',
            audience: 'audience',
            scope: 'scope'
          }
        }
      });

      // when deploy
      wrapper.find('form').simulate('submit');

      // then
      function onDeploy(values) {

        const { endpoint } = values;

        expect(endpoint.scope).to.eql('scope');
        expect(endpoint.audience).to.eql('audience');

        done();
      }
    });

  });


  it('should extract clusterId and clusterRegion', function(done) {

    // given
    const { wrapper } = createDeploymentPluginModal({
      anchor,
      onDeploy,
      config: {
        endpoint: {
          targetType: CAMUNDA_CLOUD,
          camundaCloudClusterUrl: '7edda473-891c-4978-aa27-2e727d8560ff.ber-5.zeebe.camunda.io:443'
        }
      } });

    // when
    wrapper.find('form').simulate('submit');

    // then
    function onDeploy(values) {
      const { endpoint } = values;

      expect(endpoint.camundaCloudClusterId).to.equal('7edda473-891c-4978-aa27-2e727d8560ff');
      expect(endpoint.camundaCloudClusterRegion).to.equal('ber-5');
      done();
    }
  });


  it('should extract clusterId with https', function(done) {

    // given
    const { wrapper } = createDeploymentPluginModal({
      anchor,
      onDeploy,
      config: {
        endpoint: {
          targetType: CAMUNDA_CLOUD,
          camundaCloudClusterUrl: 'https://7edda473-891c-4978-aa27-2e727d8560ff.ber-5.zeebe.camunda.io:443'
        }
      } });

    // when
    const form = wrapper.find('form');
    form.simulate('submit');

    // then
    function onDeploy(values) {
      const { endpoint } = values;

      expect(endpoint.camundaCloudClusterId).to.equal('7edda473-891c-4978-aa27-2e727d8560ff');
      done();
    }
  });
});


const createDeploymentPluginModal = ({ ...props } = {}) => {

  const config = createConfig(props.config);
  const validator = new Validator(props.validator);

  const wrapper = mount(<DeploymentPluginOverlay
    validator={ validator }
    onDeploy={ noop }
    onClose={ noop }
    { ...props }
    config={ config }
  />);

  const instance = wrapper.instance();

  return { wrapper, instance };
};

function Validator({ ...overrides } = {}) {
  this.createConnectionChecker = createConnectionChecker;

  Object.assign(this, overrides);
}

function createConfig({ endpoint = {}, deployment = {} } = {}) {
  return {
    deployment: {
      name: 'name',
      ...deployment
    },
    endpoint: {
      targetType: SELF_HOSTED,
      authType: AUTH_TYPES.NONE,
      contactPoint: 'https://google.com',
      ...endpoint
    }
  };
}

function noop() {}

function createConnectionChecker({ ...overrides } = {}) {
  return {
    subscribe: noop,
    check() {
      return { connectionResult: { success: true } };
    },
    ...overrides
  };
}
