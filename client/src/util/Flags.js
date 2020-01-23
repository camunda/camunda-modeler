/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

class Flags {

  constructor() {
    this.data = {};
  }

  init(data) {
    this.data = data;
  }

  get(key, defaultValue) {
    return key in this.data ? this.data[key] : defaultValue;
  }

  reset = () => {
    this.data = {};
  }

}

export default new Flags();


export const DISABLE_CMMN = 'disable-cmmn';
export const DISABLE_DMN = 'disable-dmn';
export const DISABLE_ADJUST_ORIGIN = 'disable-adjust-origin';
export const DISABLE_PLUGINS = 'disable-plugins';
export const RELAUNCH = 'relaunch';
export const DISABLE_REMOTE_INTERACTION = 'disable-remote-interaction';
export const UPDATE_SERVER_URL = 'update-server-url';
export const FORCE_UPDATE_CHECKS = 'force-update-checks';
