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

import Flags, { DISABLE_SERVER_INTERACTION } from '../../../util/Flags';
import Metadata from '../../../util/Metadata';

import {
  shallow
} from 'enzyme';

import UpdateChecks from '../UpdateChecks';

const PRIVACY_PREFERENCES_CONFIG_KEY = 'editor.privacyPreferences';
const LATEST_UPDATE_CHECK_INFO_CONFIG_KEY = 'editor.latestUpdateCheckInfo';
const EDITOR_ID_CONFIG_KEY = 'editor.id';
const OS_INFO_CONFIG_KEY = 'os.info';

describe('<UpdateChecks>', () => {

  beforeEach(() => {
    Metadata.init({ name: 'test-name', version: '3.5.0' });
  });


  afterEach(() => {
    Flags.reset();
    Metadata.init({});
  });


  it('should render', () => {
    shallow(<UpdateChecks />);
  });


  it('should not be initialized if DISABLE_SERVER_INTERACTION flag existent', () => {

    Flags.init({
      [ DISABLE_SERVER_INTERACTION ]: true
    });

    const component = shallow(<UpdateChecks />);

    expect(component.state()).to.be.null;
  });



  it('should be initialized if DISABLE_SERVER_INTERACTION flag missing', () => {

    const component = shallow(<UpdateChecks />);

    expect(component.state('showModal')).to.be.false;
  });


  it('should be in checkNotAllowed state if privacy preference non existent', async () => {

    const component = shallow(<UpdateChecks config={ {
      get(key) {
        return new Promise((resolve, reject) => {
          if (key === PRIVACY_PREFERENCES_CONFIG_KEY) {
            resolve(null);
          }
        });
      }
    } } />);

    await waitForNPromises(component, 1);

    expect(component.state().checkNotAllowed).to.be.true;

  });


  it('should be in checkNotAllowed state if ENABLE_UPDATE_CHECKS preference is false', async () => {

    const component = shallow(<UpdateChecks config={ {
      get(key) {
        return new Promise((resolve, reject) => {
          if (key === PRIVACY_PREFERENCES_CONFIG_KEY) {
            resolve({
              ENABLE_UPDATE_CHECKS: false
            });
          }
        });
      }
    } } />);

    await waitForNPromises(component, 1);

    expect(component.state().checkNotAllowed).to.be.true;
  });


  it('should be in isChecking state if ENABLE_UPDATE_CHECKS preference is true', async () => {

    const component = shallow(<UpdateChecks config={ {
      get(key) {
        return new Promise((resolve, reject) => {
          if (key === PRIVACY_PREFERENCES_CONFIG_KEY) {
            resolve({
              ENABLE_UPDATE_CHECKS: true
            });
          } else if (key === LATEST_UPDATE_CHECK_INFO_CONFIG_KEY) {
            resolve(null);
          }
        });
      }
    } } />);

    await waitForNPromises(component, 2);

    expect(component.state().isChecking).to.be.true;
  });


  it('should be in checkNotNeeded state if last update check time not exceeded', async () => {

    const component = shallow(<UpdateChecks config={ {
      get(key) {
        return new Promise((resolve, reject) => {
          if (key === LATEST_UPDATE_CHECK_INFO_CONFIG_KEY) {
            resolve({ latestUpdateTime: new Date().getTime() });
          } else {
            resolve({
              ENABLE_UPDATE_CHECKS: true
            });
          }
        });
      }
    } } />);

    await waitForNPromises(component, 2);

    expect(component.state().checkNotNeeded).to.be.true;
  });


  it('should update latest update check config for empty server response', async () => {

    let setValue = {};

    const onConfigSet = (key, value) => {
      setValue = value;
    };

    const component = getUpdateCheckerComponent({ onConfigSet: onConfigSet });

    mockServerResponse(component, {});

    await waitForNPromises(component, 5);

    expect(setValue.latestUpdateTime).to.exist;
  });


  it('should update latest update check config based on server response', async () => {

    let setValue = {};

    const onConfigSet = (key, value) => {
      setValue = value;
    };

    const component = getUpdateCheckerComponent({ onConfigSet: onConfigSet });

    mockServerResponse(component, {
      latestVersion: 'v3.7.0',
      downloadURL: 'test-download-url',
      releases: []
    });

    await waitForNPromises(component, 5);

    expect(setValue.latestCheckedVersion).to.be.eql('v3.7.0');
  });


  it('should not show modal for empty server response', async () => {

    const component = getUpdateCheckerComponent();

    mockServerResponse(component, {});

    await waitForNPromises(component, 5);

    expect(component.state().showModal).to.be.false;
  });


  it('should show modal for positive server response', async () => {

    const component = getUpdateCheckerComponent();

    mockServerResponse(component, {
      latestVersion: 'v3.7.0',
      downloadURL: 'test-download-url',
      releases: []
    });

    await waitForNPromises(component, 5);

    expect(component.state().showModal).to.be.true;
  });


  it('should be in requestError state if server connection fails', async () => {

    const component = getUpdateCheckerComponent();

    component.instance().updateChecksAPI.sendRequest = () => {
      throw new Error('These things happen.');
    };

    await waitForNPromises(component, 4);

    expect(component.state().requestError).to.be.true;
  });
});

const getUpdateCheckerComponent = (confs) => {
  return shallow(<UpdateChecks config={ {
    get(key) {
      return new Promise((resolve, reject) => {
        if (key === LATEST_UPDATE_CHECK_INFO_CONFIG_KEY) {
          resolve({ latestUpdateTime: 0, latestCheckedVersion: 'v3.5.0' });
        } else if (key === PRIVACY_PREFERENCES_CONFIG_KEY) {
          resolve({
            ENABLE_UPDATE_CHECKS: true
          });
        } else if (key === EDITOR_ID_CONFIG_KEY) {
          resolve('test-id');
        } else if (key === OS_INFO_CONFIG_KEY) {
          resolve({ platform: 'window', release: '98' });
        }
      });
    },
    set(key, value) {
      if (confs && confs.onConfigSet) {
        confs.onConfigSet(key, value);
      }
    }
  } } _getGlobal={ (key) => {
    if (key === 'plugins') {
      return {
        appPlugins: [
          { name: 'plugin1', id: 'pluginID1' },
          { name: 'plugin2', id: 'pluginID2' }
        ]
      };
    }
  } } />);
};

const waitForNPromises = async (component, n) => {
  for (let i = 0; i < n; i ++) {
    await component.update();
  }
};

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
