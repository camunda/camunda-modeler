/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Metadata from '../../util/Metadata';

const EDITOR_ID_CONFIG_KEY = 'editor.id';
const OS_INFO_CONFIG_KEY = 'os.info';

const UPDATE_CHECK_API = 'update-check';
const PROD_UPDATES_SERVER_URL = 'https://camunda-modeler-updates.camunda.com/';
const DEV_UPDATES_SERVER_URL = 'http://camunda-modeler-update-server-staging.camunda.com';

export default class UpdateChecksAPI {

  constructor(updatesServerURLFlagValue) {

    if (updatesServerURLFlagValue) {
      this.updatesServerURL = updatesServerURLFlagValue;
    } else {
      this.updatesServerURL = __ENVIRONMENT__ === 'development' ? DEV_UPDATES_SERVER_URL : PROD_UPDATES_SERVER_URL;
    }
  }

  async sendRequest(url) {
    const response = await fetch(url, { method: 'GET' });
    const responseJSON = await response.json();
    return responseJSON;
  }

  formatPlugins(plugins) {
    return plugins.map((plugin) => {
      return {
        name: plugin.name, id: plugin.name
      };
    });
  }

  async checkLatestVersion(config, getGlobal, latestUpdateCheckInfo) {

    try {
      const editorID = await config.get(EDITOR_ID_CONFIG_KEY);
      const modelerVersion = 'v' + Metadata.data.version;
      const newerThan = latestUpdateCheckInfo ? (latestUpdateCheckInfo.latestCheckedVersion) : modelerVersion;
      const osInfo = await config.get(OS_INFO_CONFIG_KEY);
      const plugins = this.formatPlugins(getGlobal('plugins').appPlugins);

      const url = new URL(UPDATE_CHECK_API, this.updatesServerURL);
      url.searchParams.append('editorID', editorID);
      url.searchParams.append('newerThan', newerThan);
      url.searchParams.append('modelerVersion', modelerVersion);
      url.searchParams.append('os', osInfo.platform);
      url.searchParams.append('osVersion', osInfo.release);
      plugins.forEach((plugin) => {
        url.searchParams.append('plugins[id]', plugin.id);
        url.searchParams.append('plugins[name]', plugin.name);
      });

      const responseJSON = await this.sendRequest(url.href);
      return {
        isSuccessful: true,
        response: responseJSON
      };
    } catch (err) {
      return {
        isSuccessful: false,
        error: err
      };
    }
  }

}
