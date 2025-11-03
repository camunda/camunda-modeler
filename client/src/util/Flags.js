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
  };

}

export default new Flags();


export const DISABLE_DMN = 'disable-dmn';
export const DISABLE_FORM = 'disable-form';
export const DISABLE_PLATFORM = 'disable-platform';
export const DISABLE_ZEEBE = 'disable-zeebe';
export const DISABLE_ADJUST_ORIGIN = 'disable-adjust-origin';
export const DISABLE_PLUGINS = 'disable-plugins';
export const RELAUNCH = 'relaunch';
export const DISABLE_REMOTE_INTERACTION = 'disable-remote-interaction';
export const UPDATE_SERVER_URL = 'update-server-url';
export const FORCE_UPDATE_CHECKS = 'force-update-checks';
export const SENTRY_DSN = 'sentry-dsn';
export const MIXPANEL_TOKEN = 'mixpanel-token';
export const MIXPANEL_STAGE = 'mixpanel-stage';
export const DISPLAY_VERSION = 'display-version';
export const CLOUD_ENGINE_VERSION = 'c8-engine-version';
export const PLATFORM_ENGINE_VERSION = 'c7-engine-version';
export const DISABLE_HTTL_HINT = 'disable-httl-hint';
export const DEFAULT_HTTL = 'default-httl';
export const ENABLE_NEW_CONTEXT_PAD = 'enable-new-context-pad';
export const DISABLE_RPA = 'disable-rpa';
