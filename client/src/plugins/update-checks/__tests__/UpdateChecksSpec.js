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

import Flags, { DISABLE_REMOTE_INTERACTION, UPDATE_SERVER_URL } from '../../../util/Flags';
import Metadata from '../../../util/Metadata';

import {
  shallow
} from 'enzyme';

import UpdateChecks from '../UpdateChecks';

const PRIVACY_PREFERENCES_CONFIG_KEY = 'editor.privacyPreferences';
const UPDATE_CHECKS_CONFIG_KEY = 'editor.updateChecks';
const EDITOR_ID_CONFIG_KEY = 'editor.id';
const OS_INFO_CONFIG_KEY = 'os.info';


describe('<UpdateChecks>', function() {

  beforeEach(() => {
    Metadata.init({ name: 'test-name', version: '3.5.0' });
  });

  afterEach(() => {
    Flags.reset();
    Metadata.init({});
  });


  it('should render', () => {
    createComponent();
  });


  it('should not check if DISABLE_REMOTE_INTERACTION flag is set', async function() {

    // given
    Flags.init({
      [ DISABLE_REMOTE_INTERACTION ]: true
    });

    const checkSpy = sinon.spy();

    // when
    const {
      component
    } = createComponent({
      onCheckPerformed: checkSpy
    });

    await tick(component);

    // then
    expect(checkSpy).not.to.have.been.called;
  });


  it('should subscribe to updateChecks.execute', async function() {

    // given
    const {
      callSubscriber,
      subscribe
    } = createSubscribe('updateChecks.execute');

    const { instance } = await createComponent({ subscribe });

    const checkLatestVersionSpy = sinon.spy(instance, 'checkLatestVersion');

    // when
    await callSubscriber();

    // then
    expect(checkLatestVersionSpy).to.have.been.called;
  });


  it('should skip without privacy settings', async function() {

    // given
    const checkSpy = sinon.spy();

    const config = {
      get(key) {
        return new Promise((resolve, reject) => {
          if (key === PRIVACY_PREFERENCES_CONFIG_KEY) {
            resolve(null);
          }
        });
      }
    };

    // when
    const {
      component
    } = createComponent({
      onCheckPerformed: checkSpy,
      config
    });

    await tick(component);

    // then
    expect(checkSpy).to.have.been.calledOnceWith({
      resolution: 'skipped',
      reason: 'privacy-settings'
    });

  });


  it('should skip if disallowed via privacy settings', async function() {

    // given
    const checkSpy = sinon.spy();

    const config = {
      get(key) {
        return new Promise((resolve, reject) => {
          if (key === PRIVACY_PREFERENCES_CONFIG_KEY) {
            resolve({
              ENABLE_UPDATE_CHECKS: false
            });
          }
        });
      }
    };

    // when
    const {
      component
    } = createComponent({
      onCheckPerformed: checkSpy,
      config
    });

    await tick(component);

    // then
    expect(checkSpy).to.have.been.calledOnceWith({
      resolution: 'skipped',
      reason: 'privacy-settings'
    });
  });


  it('should skip if not due yet', async function() {

    // given
    const checkSpy = sinon.spy();

    const config = {
      get(key) {
        return new Promise((resolve, reject) => {
          if (key === PRIVACY_PREFERENCES_CONFIG_KEY) {
            return resolve({
              ENABLE_UPDATE_CHECKS: true
            });
          }

          if (key === UPDATE_CHECKS_CONFIG_KEY) {
            return resolve({ lastChecked: new Date().getTime() });
          }
        });
      }
    };

    // when
    const {
      component
    } = createComponent({
      onCheckPerformed: checkSpy,
      config
    });

    await tick(component);

    // then
    expect(checkSpy).to.have.been.calledOnceWith({
      reason: 'not-due',
      resolution: 'skipped'
    });
  });


  it('should handle empty server response', async function() {

    let setValue = {};

    const onConfigSet = (key, value) => {
      setValue = value;
    };

    const {
      component
    } = createComponent({
      onConfigSet
    });

    mockServerResponse(component, {});

    await tick(component);

    expect(setValue.lastChecked).to.exist;
  });


  it('should handle update response', async function() {

    let setValue = {};

    const onConfigSet = (key, value) => {
      setValue = value;
    };

    const {
      component
    } = createComponent({
      onConfigSet
    });

    mockServerResponse(component, {
      update: {
        latestVersion: 'v3.7.0',
        downloadURL: 'test-download-url',
        releases: []
      }
    });

    await tick(component);

    expect(setValue.latestVersion).to.be.eql('v3.7.0');
  });


  it('should not show modal for empty server response', async () => {

    // given
    const {
      component
    } = createComponent();

    mockServerResponse(component, {});

    // when
    await tick(component);

    // then
    expect(component.state().showModal).to.be.false;
  });


  it('should show notification for empty server response', async () => {

    // given
    const displaySpy = sinon.spy();

    const {
      component,
      instance
    } = createComponent({
      displayNotification: displaySpy
    });

    mockServerResponse(component, {});

    // when
    instance.checkLatestVersion(null, true);

    // then
    expect(displaySpy).to.not.have.been.called;
  });


  it('should not show notification for empty server response if not configured', async () => {

    // given
    const displaySpy = sinon.spy();

    const {
      component
    } = createComponent({
      displayNotification: displaySpy
    });

    mockServerResponse(component, {});

    // when
    await tick(component);

    // then
    expect(displaySpy).to.not.have.been.called;
  });


  it('should show modal for positive server response', async () => {

    // given
    const {
      component
    } = createComponent();

    mockServerResponse(component, {
      update: {
        latestVersion: 'v3.7.0',
        downloadURL: 'test-download-url',
        releases: []
      }
    });

    // when
    await tick(component);

    // then
    expect(component.state().showModal).to.be.true;
  });


  it('should handle update check error', async () => {

    // given
    const checkSpy = sinon.spy();

    const error = new Error('These things happen.');

    const {
      component
    } = createComponent({
      onCheckPerformed: checkSpy
    });

    component.instance().updateChecksAPI.sendRequest = () => {
      throw error;
    };

    // when
    await tick(component);

    // then
    expect(checkSpy).to.have.been.calledOnceWith({
      error,
      resolution: 'failed'
    });
  });


  it('should check periodically (every N minutes)');


  it('should check with URL encoded parameters', async () => {

    // given

    Flags.init({
      [ UPDATE_SERVER_URL ]: 'http://test-update-server.com'
    });

    const {
      component,
      instance
    } = createComponent();

    instance.updateChecksAPI.productName = 'Camunda Modeler';

    let calledURL = '';

    mockServerResponse(component, {
      update: {
        latestVersion: 'v3.7.0',
        downloadURL: 'test-download-url',
        releases: []
      }
    }, (url) => { calledURL = url; });

    // when
    await tick(component);

    // then
    expect(calledURL).to.eql('http://test-update-server.com/update-check?editorID=test-id&newerThan=v3.5.0&modelerVersion=v3.5.0&os=windows&osVersion=98&productName=Camunda+Modeler&plugins%5Bid%5D=plugin1&plugins%5Bname%5D=plugin1&plugins%5Bid%5D=plugin2&plugins%5Bname%5D=plugin2');
  });

});


// helper /////////////////////

async function tick(component, n=10) {
  for (let i = 0; i < n; i ++) {
    await component.update();
  }
}

const mockServerResponse = (component, resp, callback) => {
  component.instance().updateChecksAPI.sendRequest = (url) => {
    if (callback) {
      callback(url);
    }
    return new Promise((resolve, reject) => {
      resolve(resp);
    });
  };
};


function createComponent(props={}) {

  const onConfigSet = props.onConfigSet || function() {};

  const _getGlobal = props._getGlobal || function(key) {
    if (key === 'plugins') {
      return {
        appPlugins: [
          { name: 'plugin1', id: 'pluginID1' },
          { name: 'plugin2', id: 'pluginID2' }
        ]
      };
    }
  };

  const config = props.config || {
    get(key) {
      return new Promise((resolve, reject) => {
        if (key === UPDATE_CHECKS_CONFIG_KEY) {
          resolve({ lastChecked: 0, latestVersion: 'v3.5.0' });
        } else if (key === PRIVACY_PREFERENCES_CONFIG_KEY) {
          resolve({
            ENABLE_UPDATE_CHECKS: true
          });
        } else if (key === EDITOR_ID_CONFIG_KEY) {
          resolve('test-id');
        } else if (key === OS_INFO_CONFIG_KEY) {
          resolve({ platform: 'windows', release: '98' });
        }
      });
    },
    set: onConfigSet
  };

  const component = shallow(
    <UpdateChecks
      { ...props }
      config={ config }
      displayNotification={ props.displayNotification || noop }
      _getGlobal={ _getGlobal }
      subscribe={ props.subscribe || noop }
    />
  );

  const instance = component.instance();

  return {
    component,
    instance
  };
}

function noop() {}

function createSubscribe(event) {
  let callback = null;

  function subscribe(_event, _callback) {
    if (event === _event) {
      callback = _callback;
    }

    return function cancel() {
      callback = null;
    };
  }

  async function callSubscriber(...args) {
    if (callback) {
      await callback(...args);
    }
  }

  return {
    callSubscriber,
    subscribe
  };
}