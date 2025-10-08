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
import { utmTag } from '../../util/utmTag';

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

    this.updateAvailableButtonRef = React.createRef(null);

    this.state = {
      newVersionInfoViewOpen: false,
      updateAvailable: false,
      updateAvailableOverlayOpen: false
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
        See the log for further details
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
        newVersionInfoViewOpen: true
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

  openNewVersionInfoView = () => {
    this.setState({ newVersionInfoViewOpen: true });
  };

  closeNewVersionInfoView = () => {
    this.setState({ newVersionInfoViewOpen: false });
  };

  toggleUpdateAvailableOverlay = () => {
    if (this.state.updateAvailableOverlayOpen) {
      this.closeUpdateAvailableOverlay();
    } else {
      this.openUpdateAvailableOverlay();
    }
  };

  openUpdateAvailableOverlay = () => {
    this.setState({ updateAvailableOverlayOpen: true });
  };

  closeUpdateAvailableOverlay = () => {
    this.setState({ updateAvailableOverlayOpen: false });
  };

  onOpenDownloadUrl = () => {
    const {
      latestVersionInfo
    } = this.state;

    const {
      _getGlobal
    } = this.props;

    let downloadURL = latestVersionInfo.downloadURL;

    _getGlobal('backend').send('external:open-url', {
      url: utmTag(downloadURL, { campaign: 'update-check' })
    });

    this.closeNewVersionInfoView();
  };

  render() {
    const {
      newVersionInfoViewOpen,
      latestVersionInfo,
      currentVersion,
      updateChecksEnabled,
      updateAvailableOverlayOpen,
      updateAvailable
    } = this.state;

    // using group starting with Z to display at the end of the status bar
    // cf. https://github.com/camunda/camunda-modeler/commit/b79fe1dec26fac603980b2639a46dc8656661dcd#r149356417
    return (
      <React.Fragment>
        {
          updateAvailable && <Fill slot="status-bar__app" group="Z_update_checks">
            <button
              className="btn btn--primary"
              title="Toggle update info"
              onClick={ this.toggleUpdateAvailableOverlay }
              ref={ this.updateAvailableButtonRef }>Update</button>
          </Fill>
        }
        {
          updateAvailableOverlayOpen && <UpdateAvailableOverlay
            anchor={ this.updateAvailableButtonRef.current }
            onOpenNewVersionInfoView={ this.openNewVersionInfoView }
            onOpenDownloadUrl={ this.onOpenDownloadUrl }
            onClose={ this.closeUpdateAvailableOverlay }
            version={ latestVersionInfo.latestVersion } />
        }
        {
          newVersionInfoViewOpen && <NewVersionInfoView
            onClose={ this.closeNewVersionInfoView }
            onOpenDownloadUrl={ this.onOpenDownloadUrl }
            onOpenPrivacyPreferences={ this.openPrivacyPreferences }
            latestVersionInfo={ latestVersionInfo }
            updateChecksEnabled={ updateChecksEnabled }
            currentVersion={ currentVersion } />
        }
      </React.Fragment>

    );
  }
}
