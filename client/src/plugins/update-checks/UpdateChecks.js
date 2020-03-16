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

import UpdateChecksAPI from './UpdateChecksAPI';

import Flags, { DISABLE_REMOTE_INTERACTION, FORCE_UPDATE_CHECKS, UPDATE_SERVER_URL } from '../../util/Flags';

import Metadata from '../../util/Metadata';

const log = debug('UpdateChecks');

class NoopComponent extends PureComponent {
  render() {
    return null;
  }
}

const DEFAULT_UPDATE_SERVER_URL = process.env.NODE_ENV === 'production'
  ? 'https://camunda-modeler-updates.camunda.com/'
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

    this.state = {
      showModal: false
    };
  }

  componentDidMount() {
    this.scheduleCheck();
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
      this.checkFailed(error);
    });
  }

  checkPerformed(result) {
    if (typeof this.props.onCheckPerformed === 'function') {
      this.props.onCheckPerformed(result);
    }
  }

  checkFailed(error) {
    log('failed', error);

    this.checkPerformed({
      resolution: 'failed',
      error
    });
  }

  checkSkipped(reason) {
    log('skipped', reason);

    this.checkPerformed({
      resolution: 'skipped',
      reason
    });
  }

  checkCompleted(update) {
    this.checkPerformed({
      resolution: 'completed',
      update
    });
  }

  async performCheck() {
    const {
      config
    } = this.props;

    const privacyPreferences = await config.get(PRIVACY_PREFERENCES_CONFIG_KEY);
    if (!privacyPreferences || !privacyPreferences.ENABLE_UPDATE_CHECKS) {
      return this.checkSkipped('privacy-settings');
    }

    const updateCheckInfo = await config.get(UPDATE_CHECKS_CONFIG_KEY);

    if (!Flags.get(FORCE_UPDATE_CHECKS) && !this.isTimeExceeded(updateCheckInfo && updateCheckInfo.lastChecked || 0)) {
      return this.checkSkipped('not-due');
    }

    return this.checkLatestVersion(updateCheckInfo);
  }

  async checkLatestVersion(updateCheckInfo) {

    log('Checking for update');

    const {
      config,
      _getGlobal
    } = this.props;

    const responseJSON = await this.updateChecksAPI.checkLatestVersion(
      config, _getGlobal, updateCheckInfo && updateCheckInfo.latestVersion
    );

    if (!responseJSON.isSuccessful) {
      const {
        error
      } = responseJSON;

      return this.checkFailed(error);
    }

    const responseBody = responseJSON.response;
    const update = responseBody.update;

    let newUpdateCheckInfo = updateCheckInfo || {};

    if (update) {
      log('Found update', update.latestVersion);

      const currentVersion = 'v' + Metadata.data.version;
      const latestVersion = update.latestVersion;
      const downloadURL = update.downloadURL;
      const releases = update.releases;

      this.setState({
        currentVersion,
        latestVersionInfo: {
          latestVersion,
          downloadURL,
          releases
        },
        showModal: true
      });

      newUpdateCheckInfo.latestVersion = latestVersion;
    } else {
      log('No update');
    }

    newUpdateCheckInfo.lastChecked = Date.now();

    await config.set(UPDATE_CHECKS_CONFIG_KEY, newUpdateCheckInfo);

    return this.checkCompleted(update);
  }

  isTimeExceeded(previousTime) {
    return Math.abs(Date.now() - previousTime) >= TWENTY_FOUR_HOURS_MS;
  }

  onClose = () => {
    this.setState({
      showModal: false
    });
  }

  onGoToDownloadPage = () => {
    const {
      latestVersionInfo
    } = this.state;

    const {
      _getGlobal
    } = this.props;

    _getGlobal('backend').send('external:open-url', { url: latestVersionInfo.downloadURL });
    this.onClose();
  }

  render() {
    const {
      showModal,
      latestVersionInfo,
      currentVersion
    } = this.state;

    return <React.Fragment>
      { showModal && <NewVersionInfoView
        onClose={ this.onClose }
        onGoToDownloadPage={ this.onGoToDownloadPage }
        latestVersionInfo={ latestVersionInfo }
        currentVersion={ currentVersion } /> }
    </React.Fragment>;
  }
}
