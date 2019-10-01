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
import { omit } from 'min-dash';

import DeploymentTool from '../DeploymentTool';
import DeploymentDetailsModal from '../DeploymentDetailsModal';
import AuthTypes from '../AuthTypes';


describe('<DeploymentTool>', () => {

  it('should render', () => {
    createDeploymentTool();
  });


  describe('#deploy', () => {

    let fetchStub,
        mounted;

    beforeEach(() => {
      fetchStub = sinon.stub(window, 'fetch').resolves({ ok: true, json: () => ({}) });
    });

    afterEach(() => {
      fetchStub.restore();

      if (mounted && mounted.exists()) {
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


    it('should read and save config for deployed file', async () => {

      // given
      const config = sinon.stub({
        getForFile() {
          return {};
        },
        setForFile() {}
      });
      const details = {
        endpointUrl: 'http://localhost:8088/engine-rest',
        tenantId: '',
        deploymentName: 'diagram',
        authType: AuthTypes.basic,
        username: 'demo',
        password: 'demo'
      };

      const activeTab = createTab({ name: 'foo.bpmn' });
      const {
        wrapper,
        instance
      } = createDeploymentTool({ activeTab, config }, mount);

      mounted = wrapper;

      // when
      instance.deploy();

      await nextTick();
      wrapper.update();

      const { handleClose } = wrapper.state('modalState');

      handleClose(details);

      await nextTick();

      // then
      expect(config.getForFile).to.have.been.calledOnce;
      expect(config.getForFile.getCall(0).args).to.eql([
        activeTab.file,
        'deployment-config'
      ]);

      expect(config.setForFile).to.have.been.calledOnce;
      expect(config.setForFile.getCall(0).args).to.eql([
        activeTab.file,
        'deployment-config',
        omit(details, [ 'username', 'password' ])
      ]);
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

  const config = {
    getForFile() {
      return {};
    },
    setForFile() {}
  };

  const wrapper = render(<DeploymentTool
    config={ config }
    subscribe={ subscribe }
    triggerAction={ triggerAction }
    displayNotification={ noop }
    log={ noop }
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

function noop() {}
