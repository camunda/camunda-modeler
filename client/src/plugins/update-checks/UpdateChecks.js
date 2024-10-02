/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import debug from 'debug';

import React, { PureComponent } from 'react';

import NewVersionInfoView from './NewVersionInfoView';

import PrivacyPreferencesLink from './PrivacyPreferencesLink';

import UpdateChecksAPI from './UpdateChecksAPI';

import Flags, { DISABLE_REMOTE_INTERACTION, FORCE_UPDATE_CHECKS, UPDATE_SERVER_URL } from '../../util/Flags';

import { Fill } from '../../app/slot-fill';

import Metadata from '../../util/Metadata';

import { UpdateAvailableOverlay } from './UpdateAvailableOverlay';

const log = debug('UpdateChecks');

class NoopComponent extends PureComponent {
  render() {
    return null;
  }
}

const DEFAULT_UPDATE_SERVER_URL = process.env.NODE_ENV === 'production'
  ? 'https://camunda-modeler-updates.camunda.com'
  : 'https://camunda-modeler-update-server-staging.camunda.com';

const PRIVACY_PREFERENCES_CONFIG_KEY = 'editor.privacyPreferences';
const UPDATE_CHECKS_CONFIG_KEY = 'editor.updateChecks';

const FIVE_MINUTES_MS = 1000 * 60 * 5;
const TWENTY_FOUR_HOURS_MS = 1000 * 60 * 60 * 24;


export default class UpdateChecks extends PureComponent {

  constructor(props) {
    super(props);
    if (Flags.get(DISABLE_REMOTE_INTERACTION)) {
      return new NoopComponent();
    }

    const updateServerUrl = Flags.get(UPDATE_SERVER_URL, DEFAULT_UPDATE_SERVER_URL);

    this.updateChecksAPI = new UpdateChecksAPI(updateServerUrl);

    this._buttonRef = React.createRef(null);

    this.state = {
      showModal: false,
      openUpdateAvailablePopUp: false,
      updateAvailable: false
    };
  }

  componentDidMount() {
    const {
      config,
      subscribe
    } = this.props;

    const self = this;

    self.scheduleCheck();

    subscribe('updateChecks.execute', async () => {

      const updateCheckInfo = await config.get(UPDATE_CHECKS_CONFIG_KEY) || {};
      self.checkLatestVersion({
        ...updateCheckInfo,
        stagedRollout: false,
        latestVersion: `v${Metadata.data.version}`
      }, false);
    });
  }

  componentWillUnmount() {
    this.unscheduleChecks();
  }

  rescheduleCheck() {
    if (process.env.NODE_ENV !== 'test') {
      this._checkTimeout = setTimeout(() => {
        this.scheduleCheck();
      }, FIVE_MINUTES_MS);
    }
  }

  unscheduleChecks() {
    clearTimeout(this._checkTimeout);
  }

  scheduleCheck() {

    this.unscheduleChecks();

    this.rescheduleCheck();

    return this.performCheck().catch(error => {
      this.handleUpdateCheckFailed(error);
    });
  }

  handleUpdateCheckPerformed(result) {
    if (typeof this.props.onCheckPerformed === 'function') {
      this.props.onCheckPerformed(result);
    }
  }

  handleUpdateCheckFailed(error, silentCheck = true) {
    const {
      displayNotification,
      triggerAction,
      log: appLog
    } = this.props;

    if (!silentCheck) {

      const logMessage = {
        category: 'update-check-error',
        message: error.message,
        silent: true
      };

      appLog(logMessage);

      const content = <button
        onClick={ () => triggerAction('open-log') }>
        See the log for further details.
      </button>;

      return displayNotification({
        type: 'error',
        title: 'Modeler update check failed',
        content: content,
        duration: 4000
      });
    } else {

      // don't disturb the user on background checks
      log('failed', error);
    }

    this.handleUpdateCheckPerformed({
      resolution: 'failed',
      error
    });
  }

  checkSkipped(reason) {
    log('skipped', reason);

    this.handleUpdateCheckPerformed({
      resolution: 'skipped',
      reason
    });
  }

  handleUpdateCheckCompleted(update) {
    this.handleUpdateCheckPerformed({
      resolution: 'completed',
      update
    });
  }

  async areUpdateChecksEnabled() {
    const {
      config
    } = this.props;

    const privacyPreferences = await config.get(PRIVACY_PREFERENCES_CONFIG_KEY);

    return privacyPreferences && privacyPreferences.ENABLE_UPDATE_CHECKS;
  }

  openPrivacyPreferences = () => {
    const {
      triggerAction
    } = this.props;

    triggerAction('emit-event', {
      type: 'show-privacy-preferences',
      payload: {
        autoFocusKey: 'ENABLE_UPDATE_CHECKS'
      }
    });
  };

  async performCheck() {
    const {
      config
    } = this.props;

    const areUpdateChecksEnabled = await this.areUpdateChecksEnabled();

    if (!areUpdateChecksEnabled) {
      return this.checkSkipped('privacy-settings');
    }

    const updateCheckInfo = await config.get(UPDATE_CHECKS_CONFIG_KEY) || {};

    updateCheckInfo.stagedRollout = true;

    if (!Flags.get(FORCE_UPDATE_CHECKS) && !this.isTimeExceeded(updateCheckInfo && updateCheckInfo.lastChecked || 0)) {
      return this.checkSkipped('not-due');
    }

    return this.checkLatestVersion({
      ...updateCheckInfo,
      latestVersion: `v${Metadata.data.version}`
    });
  }

  async handleUpdateCheckSuccess(update, silentCheck = true) {
    const {
      displayNotification
    } = this.props;

    const updateChecksEnabled = await this.areUpdateChecksEnabled();

    if (!update) {

      log('No update');

      if (!silentCheck) {
        displayNotification({
          type: 'success',
          title: 'You are running the latest version.',
          content: (
            <PrivacyPreferencesLink
              updateChecksEnabled={ updateChecksEnabled }
              onOpenPrivacyPreferences={ this.openPrivacyPreferences } />
          ),
          duration: 8000
        });
      }

      return;
    }

    const {
      latestVersion,
      downloadURL,
      releases
    } = update;

    log('Found update', update.latestVersion);

    const currentVersion = 'v' + Metadata.data.version;

    this.setState({
      currentVersion,
      updateAvailable : true,
      latestVersionInfo: {
        latestVersion,
        downloadURL,
        releases
      },
      updateChecksEnabled,
    });

    if (!silentCheck) {
      this.setState({
        showModal: true
      });
    }

  }

  async checkLatestVersion(updateCheckInfo, silentCheck = true) {

    log('Checking for update');
    const {
      config,
      _getGlobal,
    } = this.props;

    // (1) Send request to check for updates
    const responseJSON = await this.updateChecksAPI.checkLatestVersion(
      config, _getGlobal, updateCheckInfo && updateCheckInfo.latestVersion, updateCheckInfo && updateCheckInfo.stagedRollout
    );

    // (2a) Handle check failures
    if (!responseJSON.isSuccessful) {
      const {
        error
      } = responseJSON;

      return this.handleUpdateCheckFailed(error, silentCheck);
    }

    const responseBody = responseJSON.response;
    const update = responseBody.update;

    let newUpdateCheckInfo = updateCheckInfo || {};

    // (2b) Response to user in case of success
    this.handleUpdateCheckSuccess(update, silentCheck);

    // (3) Persist configuration with latest check timestamp
    if (update) {
      const {
        latestVersion
      } = update;

      newUpdateCheckInfo.latestVersion = latestVersion;
    }

    newUpdateCheckInfo.lastChecked = Date.now();

    await config.set(UPDATE_CHECKS_CONFIG_KEY, newUpdateCheckInfo);

    return this.handleUpdateCheckCompleted(update);
  }

  isTimeExceeded(previousTime) {
    return Math.abs(Date.now() - previousTime) >= TWENTY_FOUR_HOURS_MS;
  }

  onClose = () => {
    this.setState({
      showModal: false
    });
  };

  toggle = () => {
    log('toggle');
    if (this.state.openUpdateAvailablePopUp) {
      this.close();
    } else {
      this.open();
    }
  };

  open = () => {
    this.setState({ openUpdateAvailablePopUp: true });
  };

  close = () => {
    this.setState({ openUpdateAvailablePopUp: false });
  };

  onGoToDownloadPage = () => {
    const {
      latestVersionInfo
    } = this.state;

    const {
      _getGlobal
    } = this.props;

    _getGlobal('backend').send('external:open-url', { url: latestVersionInfo.downloadURL });
    this.onClose();
  };

  openVersionInfoPage = () => {
    this.setState({
      showModal: true,
    });
  };

  render() {
    const {
      showModal,
      latestVersionInfo,
      currentVersion,
      updateChecksEnabled,
      openUpdateAvailablePopUp,
      updateAvailable
    } = this.state;

    const {
      toggle,
      _buttonRef: buttonRef,
      close,
      openVersionInfoPage,
    } = this;
    return (
      <React.Fragment>
        {updateAvailable && <Fill slot="status-bar__app" group="9_update_checks">
          <button
            className="btn btn-primary update-btn"
            title="Toggle update info"
            onClick={ toggle }
            ref={ buttonRef }
          >{ 'Update' } </button>
        </Fill>}
        {openUpdateAvailablePopUp && <UpdateAvailableOverlay
          anchor={ buttonRef.current }
          openVersionInfoPage={ openVersionInfoPage }
          onGoToDownloadPage={ this.onGoToDownloadPage }
          onClose={ close }
          version={ latestVersionInfo.latestVersion }
        />}
        {showModal && (
          <NewVersionInfoView
            onClose={ this.onClose }
            onGoToDownloadPage={ this.onGoToDownloadPage }
            onOpenPrivacyPreferences={ this.openPrivacyPreferences }
            latestVersionInfo={ latestVersionInfo }
            updateChecksEnabled={ updateChecksEnabled }
            currentVersion={ currentVersion }
          />
        )}
      </React.Fragment>

    );
  }
}
