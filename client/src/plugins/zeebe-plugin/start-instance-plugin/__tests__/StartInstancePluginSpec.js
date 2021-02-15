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

import { shallow } from 'enzyme';

import { Config } from '../../../../app/__tests__/mocks';

import StartInstancePlugin from '../StartInstancePlugin';


describe('<StartInstancePlugin> (Zeebe)', () => {

  it('should render', () => {
    createStartInstancePlugin();
  });


  it('should display for active zeebe tabs', () => {

    // when
    const { wrapper } = createStartInstancePlugin({
      activeTab: {
        type: 'cloud-bpmn'
      }
    });

    // then
    expect(wrapper.find('Button')).to.have.lengthOf(1);
  });


  it('should NOT display when no active tab', () => {

    // when
    const { wrapper } = createStartInstancePlugin({
      activeTab: false
    });

    // then
    expect(wrapper.find('Button')).to.have.lengthOf(0);
  });


  it('should NOT display for other tabs', () => {

    // when
    const { wrapper } = createStartInstancePlugin();

    // then
    expect(wrapper.find('Button')).to.have.lengthOf(0);
  });


  it('should start process instance if deployment was successful', async () => {

    // given
    const runSpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ runSpy });
    const { instance } = createStartInstancePlugin({ zeebeAPI });

    // when
    await instance.startInstance();

    // then
    expect(runSpy).to.have.been.calledOnce;
  });


  it('should NOT start process instance if deployment failed', async () => {

    // given
    const runSpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ runSpy });
    const { instance } = createStartInstancePlugin({ deploymentResult: { success: false }, zeebeAPI });

    // when
    await instance.startInstance();

    // then
    expect(runSpy).not.to.have.been.called;
  });


  it('should NOT start process instance if deployment was cancelled', async () => {

    // given
    const runSpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ runSpy });
    const { instance } = createStartInstancePlugin({ deploymentResult: null, zeebeAPI });

    // when
    await instance.startInstance();

    // then
    expect(runSpy).not.to.have.been.called;
  });


  it('should invoke zeebe API with the process id', async () => {

    // given
    const processId = '123';
    const deploymentResult = {
      success: true, response: { workflows: [ { bpmnProcessId: processId } ] }
    };
    const runSpy = sinon.spy();
    const zeebeAPI = new MockZeebeAPI({ runSpy });
    const { instance } = createStartInstancePlugin({ deploymentResult, zeebeAPI });

    // when
    await instance.startInstance();

    // then
    expect(runSpy).to.have.been.calledOnce;
  });


  it('should display notification after starting process instance', async () => {

    // given
    const displayNotification = sinon.spy();
    const { instance } = createStartInstancePlugin({ displayNotification });

    // when
    await instance.startInstance();

    // then
    expect(displayNotification).to.have.been.calledWith({
      type: 'success',
      title: 'Process instance deployed and started successfully',
      duration: 10000
    });
  });
});

function createStartInstancePlugin({
  zeebeAPI = new MockZeebeAPI(),
  activeTab = createTab(),
  deploymentResult = {
    success: true, response: { workflows: [ { bpmnProcessId: 'test' } ] }
  },
  deploymentEndpoint = {},
  ...props
} = {}) {
  const subscribe = (key, callback) => {
    if (key === 'app.activeTabChanged') {
      callback({
        activeTab: activeTab || { type: 'empty', name: 'testName' }
      });
    }
  };

  const config = new Config({
    get: (_, defaultValue) => defaultValue,
    ...props.config
  });

  const broadcastMessage = (key, body) => {
    if (key === 'deploy') {
      body.done({ deploymentResult, endpoint: deploymentEndpoint });
    }
  };

  const wrapper = shallow(<StartInstancePlugin
    subscribe={ subscribe }
    _getGlobal={ key => key === 'zeebeAPI' && zeebeAPI }
    displayNotification={ noop }
    log={ noop }
    triggerAction={ key => key === 'save' && activeTab }
    subscribeToMessaging={ noop }
    unsubscribeFromMessaging={ noop }
    broadcastMessage={ broadcastMessage }
    { ...props }
    config={ config }
  />);

  const instance = wrapper.instance();

  return { wrapper, instance };
}

function noop() {
  return null;
}

function MockZeebeAPI({ runSpy, runResult } = {}) {
  this.run = (...args) => {
    if (runSpy) {
      runSpy(...args);
    }

    const result = runResult ||
      { success: true, response: {} };

    return Promise.resolve(result);
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
