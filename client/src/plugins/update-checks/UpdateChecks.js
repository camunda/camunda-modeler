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

import Flags, { DISABLE_SERVER_INTERACTION, FORCE_UPDATE_CHECKS, UPDATES_SERVER_URL } from '../../util/Flags';

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
const LATEST_UPDATE_CHECK_INFO_CONFIG_KEY = 'editor.latestUpdateCheckInfo';

const HOURS_DENOMINATOR = 3600000;
const HOURS_LIMIT = 24;


export default class UpdateChecks extends PureComponent {

  constructor(props) {
    super(props);

    if (Flags.get(DISABLE_SERVER_INTERACTION)) {
      return new NoopComponent();
    }

    const updateServerUrl = Flags.get(UPDATES_SERVER_URL, DEFAULT_UPDATE_SERVER_URL);

    this.updateChecksAPI = new UpdateChecksAPI(updateServerUrl);

    this.state = {
      showModal: false
    };
  }

  async componentDidMount() {

    const {
      config
    } = this.props;

    const privacyPreferences = await config.get(PRIVACY_PREFERENCES_CONFIG_KEY);
    if (!privacyPreferences || !privacyPreferences.ENABLE_UPDATE_CHECKS) {
      this.setState({ checkNotAllowed: true });
      return;
    }

    const latestUpdateCheckInfo = await config.get(LATEST_UPDATE_CHECK_INFO_CONFIG_KEY);

    if (!Flags.get(FORCE_UPDATE_CHECKS) && latestUpdateCheckInfo && !this.isTimeExceeded(latestUpdateCheckInfo.latestUpdateTime)) {
      this.setState({ checkNotNeeded: true });
      return;
    }

    this.checkLatestVersion(latestUpdateCheckInfo);
  }

  async checkLatestVersion(latestUpdateCheckInfo) {

    log('Checking for update');

    this.setState({ isChecking: true });

    const {
      config,
      _getGlobal
    } = this.props;

    const responseJSON = await this.updateChecksAPI.checkLatestVersion(config, _getGlobal, latestUpdateCheckInfo);
    if (!responseJSON.isSuccessful) {
      log('Update check failed', responseJSON.error);
      this.setState({ isChecking: false, requestError: true });
      return;
    }

    const responseBody = responseJSON.response;
    const update = responseBody.update;

    let newLatestUpdateCheckInfo = latestUpdateCheckInfo || {};

    if (update) {
      log('Found update', update.latestVersion);

      const modelerVersion = 'v' + Metadata.data.version;
      const latestVersion = update.latestVersion;
      const downloadURL = update.downloadURL;
      const releases = update.releases;
      this.setState({
        isChecking: false,
        showModal: true,
        latestVersionInfo: { latestVersion, downloadURL, releases },
        currentVersion: modelerVersion
      });
      newLatestUpdateCheckInfo.latestCheckedVersion = latestVersion;
    } else {
      log('No update');
    }

    newLatestUpdateCheckInfo.latestUpdateTime = new Date().getTime();
    config.set(LATEST_UPDATE_CHECK_INFO_CONFIG_KEY, newLatestUpdateCheckInfo);
  }

  isTimeExceeded(previousTime) {
    const now = new Date().getTime();
    const hoursDiff = Math.abs(now - previousTime) / HOURS_DENOMINATOR;
    return hoursDiff >= HOURS_LIMIT;
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
