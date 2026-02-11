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

import { render, screen, waitFor } from '@testing-library/react';

import UpdateChecksAPI from '../UpdateChecksAPI';

import UpdateChecks from '../UpdateChecks';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

const PRIVACY_PREFERENCES_CONFIG_KEY = 'editor.privacyPreferences';
const UPDATE_CHECKS_CONFIG_KEY = 'editor.updateChecks';
const EDITOR_ID_CONFIG_KEY = 'editor.id';
const OS_INFO_CONFIG_KEY = 'os.info';


describe('<UpdateChecks>', function() {

  beforeEach(function() {
    Metadata.init({ name: 'test-name', version: '3.5.0' });
  });

  afterEach(function() {
    Flags.reset();
    Metadata.init({});
  });


  it('should render', function() {
    createComponent();
  });


  describe('update checks', function() {

    it('should NOT check if DISABLE_REMOTE_INTERACTION flag is set', async function() {

      // given
      Flags.init({
        [ DISABLE_REMOTE_INTERACTION ]: true
      });

      const checkSpy = sinon.spy();

      // when
      createComponent({
        onCheckPerformed: checkSpy
      });

      // then
      expect(checkSpy).not.to.have.been.called;
    });


    it('should subscribe to updateChecks.execute', async function() {

      // given
      const subscribeSpy = sinon.spy();

      // when
      createComponent({
        subscribe: subscribeSpy
      });

      // then
      expect(subscribeSpy).to.have.been.calledWith('updateChecks.execute', sinon.match.func);
    });


    it('should pass stagedRollout=false on manual check', async function() {

      // given
      const {
        callSubscriber,
        subscribe
      } = createSubscribe('updateChecks.execute');

      let requestUrl = '';
      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').callsFake((url) => {
        requestUrl = url;
        return Promise.resolve({});
      });

      createComponent({ subscribe });

      // wait for initial check
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
      });

      sendRequestStub.resetHistory();

      // when
      await callSubscriber();

      // then
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
        expect(requestUrl).to.include('stagedRollout=false');
      });

      sendRequestStub.restore();
    });


    it('should revert latestVersion to current on manual check', async function() {

      // given
      const {
        callSubscriber,
        subscribe
      } = createSubscribe('updateChecks.execute');

      let requestUrl = '';
      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').callsFake((url) => {
        requestUrl = url;
        return Promise.resolve({});
      });

      createComponent({ subscribe });

      // wait for initial check
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
      });

      sendRequestStub.resetHistory();

      Metadata.init({ name: 'test-name', version: '3.0.0' });

      // when
      await callSubscriber();

      // then
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
        expect(requestUrl).to.include('newerThan=v3.0.0');
      });

      sendRequestStub.restore();
    });


    it('should pass stagedRollout=true on scheduled check', async function() {

      // given
      let requestUrl = '';
      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').callsFake((url) => {
        requestUrl = url;
        return Promise.resolve({});
      });

      // when
      createComponent();

      // then
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
        expect(requestUrl).to.include('stagedRollout=true');
      });

      sendRequestStub.restore();
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
      createComponent({
        onCheckPerformed: checkSpy,
        config
      });

      // then
      await waitFor(() => {
        expect(checkSpy).to.have.been.calledOnceWith({
          resolution: 'skipped',
          reason: 'privacy-settings'
        });
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
      createComponent({
        onCheckPerformed: checkSpy,
        config
      });

      // then
      await waitFor(() => {
        expect(checkSpy).to.have.been.calledOnceWith({
          resolution: 'skipped',
          reason: 'privacy-settings'
        });
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
      createComponent({
        onCheckPerformed: checkSpy,
        config
      });

      // then
      await waitFor(() => {
        expect(checkSpy).to.have.been.calledOnceWith({
          reason: 'not-due',
          resolution: 'skipped'
        });
      });
    });


    it('should handle empty server response', async function() {

      let setValue = {};

      const onConfigSet = (key, value) => {
        setValue = value;
      };

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').resolves({});

      createComponent({
        onConfigSet
      });

      await waitFor(() => {
        expect(setValue.lastChecked).to.exist;
      });

      sendRequestStub.restore();
    });


    it('should handle update response', async function() {

      let setValue = {};

      const onConfigSet = (key, value) => {
        setValue = value;
      };

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').resolves({
        update: {
          latestVersion: 'v3.7.0',
          downloadURL: 'test-download-url',
          releases: []
        }
      });

      createComponent({
        onConfigSet
      });

      await waitFor(() => {
        expect(setValue.latestVersion).to.be.eql('v3.7.0');
      });

      sendRequestStub.restore();
    });


    it('should handle update check error', async function() {

      // given
      const checkSpy = sinon.spy();

      const error = new Error('These things happen.');

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').rejects(error);

      // when
      createComponent({
        onCheckPerformed: checkSpy
      });

      // then
      await waitFor(() => {
        expect(checkSpy).to.have.been.calledOnce;
        expect(checkSpy.getCall(0).args[0].resolution).to.eql('failed');
      });

      sendRequestStub.restore();
    });



    it('should check periodically (every N minutes)');


    it('should check with URL encoded parameters', async function() {

      // given
      Flags.init({
        [ UPDATE_SERVER_URL ]: 'http://test-update-server.com'
      });

      let calledURL = '';

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').callsFake((url) => {
        calledURL = url;
        return Promise.resolve({
          update: {
            latestVersion: 'v3.7.0',
            downloadURL: 'test-download-url',
            releases: []
          }
        });
      });

      // when
      createComponent();

      // then
      await waitFor(() => {
        expect(calledURL).to.include('http://test-update-server.com/update-check');
        expect(calledURL).to.include('editorID=test-id');
        expect(calledURL).to.include('newerThan=v3.5.0');
        expect(calledURL).to.include('stagedRollout=true');
      });

      sendRequestStub.restore();
    });

  });


  describe('UI', function() {

    it('should show modal for positive server response', async function() {

      // given
      const {
        callSubscriber,
        subscribe
      } = createSubscribe('updateChecks.execute');

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').resolves({
        update: {
          latestVersion: 'v3.7.0',
          downloadURL: 'test-download-url',
          releases: []
        }
      });

      createComponent({ subscribe });

      // wait for initial check
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
      });

      // when - trigger manual check (non-silent)
      await callSubscriber();

      // then
      await waitFor(() => {
        expect(screen.getByRole('dialog')).to.exist;
      });

      sendRequestStub.restore();
    });


    it('should NOT show modal for empty server response', async function() {

      // given
      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').resolves({});

      const checkSpy = sinon.spy();

      createComponent({ onCheckPerformed: checkSpy });

      // when
      await waitFor(() => {
        expect(checkSpy).to.have.been.called;
      });

      // then
      expect(screen.queryByRole('dialog')).to.be.null;

      sendRequestStub.restore();
    });


    it('should show <no-updates> notification', async function() {

      // given
      const displaySpy = sinon.spy();

      const {
        callSubscriber,
        subscribe
      } = createSubscribe('updateChecks.execute');

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').resolves({});

      createComponent({
        displayNotification: displaySpy,
        subscribe
      });

      // wait for initial check
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
      });

      displaySpy.resetHistory();

      // when - trigger manual check
      await callSubscriber();

      // then
      await waitFor(() => {
        expect(displaySpy).to.have.been.called;
      });

      sendRequestStub.restore();
    });


    it('should NOT show <no-updates> notification on background checks', async function() {

      // given
      const displaySpy = sinon.spy();
      const checkSpy = sinon.spy();

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').resolves({});

      createComponent({
        displayNotification: displaySpy,
        onCheckPerformed: checkSpy
      });

      // when - wait for background check to complete
      await waitFor(() => {
        expect(checkSpy).to.have.been.called;
      });

      // then
      expect(displaySpy).to.not.have.been.called;

      sendRequestStub.restore();
    });


    it('should show <update-check-error> notification', async function() {

      // given
      const displaySpy = sinon.spy();

      const error = new Error('These things happen.');

      const {
        callSubscriber,
        subscribe
      } = createSubscribe('updateChecks.execute');

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest');
      sendRequestStub.onFirstCall().resolves({});
      sendRequestStub.onSecondCall().rejects(error);

      createComponent({
        displayNotification: displaySpy,
        subscribe
      });

      // wait for initial check
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
      });

      displaySpy.resetHistory();

      // when - trigger manual check that will fail
      await callSubscriber();

      // then
      await waitFor(() => {
        expect(displaySpy).to.have.been.calledOnce;
      });

      const notification = displaySpy.getCall(0).args[0];

      expect(
        {
          type: notification.type,
          title: notification.title,
          duration: notification.duration,
          contentType: notification.content.type
        }).to.eql(
        {
          type: 'error',
          title: 'Modeler update check failed',
          duration: 4000,
          contentType: 'button'
        }
      );

      sendRequestStub.restore();
    });


    it('should NOT show <update-check-error> notification on background checks', async function() {

      // given
      const displaySpy = sinon.spy();
      const checkSpy = sinon.spy();

      const error = new Error('These things happen.');

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').rejects(error);

      createComponent({
        displayNotification: displaySpy,
        onCheckPerformed: checkSpy
      });

      // when - wait for background check to complete
      await waitFor(() => {
        expect(checkSpy).to.have.been.called;
      });

      // then
      expect(displaySpy).to.not.have.been.called;

      sendRequestStub.restore();
    });


    it('should show log via <update-check-error> notification', async function() {

      // given
      const displayNotification = sinon.spy();
      const triggerAction = sinon.spy();
      const logSpy = sinon.spy();

      const error = new Error('These things happen.');

      const {
        callSubscriber,
        subscribe
      } = createSubscribe('updateChecks.execute');

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest');
      sendRequestStub.onFirstCall().resolves({});
      sendRequestStub.onSecondCall().rejects(error);

      createComponent({
        displayNotification,
        triggerAction,
        log: logSpy,
        subscribe
      });

      // wait for initial check
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
      });

      displayNotification.resetHistory();
      logSpy.resetHistory();

      // when - trigger manual check that will fail
      await callSubscriber();

      // then
      await waitFor(() => {
        expect(displayNotification).to.have.been.calledOnce;
      });

      const notification = displayNotification.getCall(0).args[0];
      expect(logSpy).to.have.been.calledOnceWith({
        category: 'update-check-error',
        message: error.message,
        silent: true
      });

      expect(triggerAction).to.not.have.been.called;
      notification.content.props.onClick();
      expect(triggerAction).to.have.been.calledOnceWith('open-log');

      sendRequestStub.restore();
    });


    it('should NOT show <update-check-error> log on background checks', async function() {

      // given
      const logSpy = sinon.spy();
      const checkSpy = sinon.spy();

      const error = new Error('These things happen.');

      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').rejects(error);

      createComponent({
        log: logSpy,
        onCheckPerformed: checkSpy
      });

      // when - wait for background check to complete
      await waitFor(() => {
        expect(checkSpy).to.have.been.called;
      });

      // then
      expect(logSpy).to.not.have.been.called;

      sendRequestStub.restore();
    });

    it('should show <update-available> button', async function() {

      // given
      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').resolves({
        update: {
          latestVersion: 'v3.7.0',
          downloadURL: 'test-download-url',
          releases: []
        }
      });

      createComponent();

      // when
      await waitFor(() => {
        expect(sendRequestStub).to.have.been.called;
      });

      // then
      await waitFor(() => {
        expect(screen.getByText('Update')).to.exist;
      });

      sendRequestStub.restore();
    });

    it('should not show <update-available> button if no update', async function() {

      // given
      const sendRequestStub = sinon.stub(UpdateChecksAPI.prototype, 'sendRequest').resolves({});
      const checkSpy = sinon.spy();

      createComponent({ onCheckPerformed: checkSpy });

      // when
      await waitFor(() => {
        expect(checkSpy).to.have.been.called;
      });

      // then
      expect(screen.queryByText('Update')).to.be.null;

      sendRequestStub.restore();
    });

  });

});


// helper /////////////////////


function createComponent(props = {}) {

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

  render(
    <SlotFillRoot>
      <Slot name="status-bar__app" />
      <UpdateChecks
        { ...props }
        config={ config }
        displayNotification={ props.displayNotification || noop }
        log={ props.log || noop }
        _getGlobal={ _getGlobal }
        subscribe={ props.subscribe || noop }
      />
    </SlotFillRoot>
  );
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
