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

describe('<DeploymentPluginModal> (Zeebe)', () => {

  var anchor;

  beforeEach(function() {
    anchor = document.createElement('button');
  });

  it('should render', () => {
    createDeploymentPluginModal({ anchor });
  });


  it('should check connection initially', (done) => {

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


  it('should deploy', done => {

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


  it('should check connection with updated cluster values on input change', (done) => {

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
          targetType: 'camundaCloud',
          camundaCloudClusterUrl: '7edda473-891c-4978-aa27-2e727d8560ff.ber-5.zeebe.camunda.io:443'
        }
      }
    });

    // assume
    expect(spy).to.have.been.calledOnce;
    expect(spy.getCall(0).args[0].camundaCloudClusterId).to.equal('7edda473-891c-4978-aa27-2e727d8560ff');
    expect(spy.getCall(0).args[0].camundaCloudClusterRegion).to.equal('ber-5');

    // when
    const input = wrapper.find('input[id="endpoint.camundaCloudClusterUrl"]');
    input.instance().value = 'a-b-c.foo-1.zeebe.camunda.io:443';
    input.simulate('change');

    // then
    expect(spy).to.have.been.calledTwice;
    expect(spy.getCall(1).args[0].camundaCloudClusterId).to.equal('a-b-c');
    expect(spy.getCall(1).args[0].camundaCloudClusterRegion).to.equal('foo-1');

    done();
  });


  it('should extract clusterId and clusterRegion', done => {

    // given
    const { wrapper } = createDeploymentPluginModal({
      anchor,
      onDeploy,
      config: {
        endpoint: {
          targetType: 'camundaCloud',
          camundaCloudClusterUrl: '7edda473-891c-4978-aa27-2e727d8560ff.ber-5.zeebe.camunda.io:443'
        }
      } });

    // when
    const form = wrapper.find('form');
    form.simulate('submit');

    // then
    function onDeploy(values) {
      const { endpoint } = values;

      expect(endpoint.camundaCloudClusterId).to.equal('7edda473-891c-4978-aa27-2e727d8560ff');
      expect(endpoint.camundaCloudClusterRegion).to.equal('ber-5');
      done();
    }
  });


  it('should extract clusterId with https', done => {

    // given
    const { wrapper } = createDeploymentPluginModal({
      anchor,
      onDeploy,
      config: {
        endpoint: {
          targetType: 'camundaCloud',
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
      targetType: 'selfHosted',
      authType: 'none',
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
