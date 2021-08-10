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

import DeploymentPluginModal from '../DeploymentPluginModal';

describe('<DeploymentPluginModal> (Zeebe)', () => {

  it('should render', () => {
    createDeploymentPluginModal();
  });


  it('should check connection initially', (done) => {

    // given
    const spy = sinon.spy();
    const validator = {
      createConnectionChecker: () => createConnectionChecker({ check: spy })
    };
    createDeploymentPluginModal({ validator });

    // then
    setTimeout(() => {
      expect(spy).to.have.been.called;
      done();
    }, 500);
  });


  it('should deploy', done => {

    // given
    const { wrapper } = createDeploymentPluginModal({ onDeploy });

    // when
    const form = wrapper.find('form');
    form.simulate('submit');

    // then
    function onDeploy() {
      done();
    }
  });


  it('should extract clusterId and clusterRegion', done => {

    // given
    const { wrapper } = createDeploymentPluginModal({
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


  it('should close when pressed on secondary button', async () => {

    // given
    const onClose = sinon.spy();
    const { wrapper, instance } = createDeploymentPluginModal({ onClose });

    // when
    await instance.componentDidMount();
    wrapper.find('.btn-secondary').simulate('click');

    // then
    expect(onClose).to.have.been.called;
  });
});


const createDeploymentPluginModal = ({ ...props } = {}) => {

  const config = createConfig(props.config);
  const validator = new Validator(props.validator);

  const wrapper = mount(<DeploymentPluginModal
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
