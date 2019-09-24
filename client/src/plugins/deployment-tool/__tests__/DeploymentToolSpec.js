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

import { mount, shallow } from 'enzyme';

import DeploymentTool from '../DeploymentTool';
import DeploymentDetailsModal from '../DeploymentDetailsModal';


describe('<DeploymentTool>', () => {

  it('should render', () => {
    createDeploymentTool();
  });


  it('should derive the default deployment name from filename', () => {

    // given
    const { instance } = createDeploymentTool();

    // when
    const details = instance.getInitialDetails({ name });

    // then
    expect(details).to.have.property('deploymentName', name);
  });


  describe('#deploy', () => {

    let fetchStub,
        mounted;

    beforeEach(() => {
      fetchStub = sinon.stub(window, 'fetch');
    });

    afterEach(() => {
      fetchStub.restore();

      if (mounted) {
        mounted.unmount();
      }
    });


    it('should derive deployment name from filename', async () => {

      // given
      const activeTab = createTab({ name: 'foo.bpmn' });
      const {
        wrapper,
        instance
      } = createDeploymentTool({ activeTab }, mount);

      mounted = wrapper;

      // when
      instance.deploy();

      await nextTick();
      wrapper.update();

      // then
      const modal = wrapper.find(DeploymentDetailsModal).first();

      const onClose = modal.prop('onClose');
      const deploymentName = modal.find('input[name="deploymentName"]').first().getDOMNode().value;

      expect(deploymentName).to.eql('foo');

      onClose();
    });

  });
});



// helper ////
function createDeploymentTool({
  activeTab = createTab(),
  ...props
} = {}, render = shallow) {
  const subscribe = (event, callback) => {
    event === 'app.activeTabChanged' && callback(activeTab);
  };

  const triggerAction = event => {
    switch (event) {
    case 'save':
      return activeTab;
    }
  };

  const wrapper = render(<DeploymentTool
    subscribe={ subscribe }
    triggerAction={ triggerAction }
    { ...props }
  />);

  return {
    wrapper,
    instance: wrapper.instance()
  };
}

function createTab(overrides = {}) {
  return {
    id: 42,
    name: 'foo.bar',
    type: 'bar',
    title: 'unsaved',
    file: {
      name: 'foo.bar',
      contents: '',
      path: null
    },
    ...overrides
  };
}

function nextTick() {
  return new Promise(resolve => process.nextTick(() => resolve()));
}