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

const FETCH_TIMEOUT = 5000;

const log = debug('WellKnownAPI');

export function forEngineRestUrl(engineRestUrl) {
  const engineUrl = new URL(engineRestUrl);
  return new WellKnownAPI(`${engineUrl.protocol}//${engineUrl.host}`);
}


export default class WellKnownAPI {

  constructor(url) {
    this.baseUrl = url;
  }

  async getWellKnownWebAppUrls() {
    const response = await this.fetch('/.well-known/camunda-automation-platform/webapps');

    if (response.ok) {
      const {
        admin,
        tasklist,
        cockpit
      } = await response.json();

      console.error('RAW COCKPIT: ' + cockpit);
      console.error('COCKPIT: ' + this.normalizeWebAppUrl(cockpit, 'cockpit'));

      return {
        admin: this.normalizeWebAppUrl(admin, 'admin'),
        cockpit: this.normalizeWebAppUrl(cockpit, 'cockpit'),
        tasklist: this.normalizeWebAppUrl(tasklist, 'tasklist'),
      };
    }

    throw new ConnectionError(response);
  }

  async getAdminUrl() {
    const {
      admin
    } = await this.getWellKnownWebAppUrls();

    return admin;
  }

  async getCockpitUrl() {
    const {
      cockpit
    } = await this.getWellKnownWebAppUrls();

    return cockpit;
  }

  async getTasklistUrl() {
    const {
      tasklist
    } = await this.getWellKnownWebAppUrls();

    return tasklist;
  }

  normalizeWebAppUrl(webAppUrl, appName) {
    if (!webAppUrl) {
      return webAppUrl;
    }

    return webAppUrl

    // ensure trailing slash
      .replace(/\/?$/, '/')

    // in case we got the root path, we assume its the default process engine
      .replace(new RegExp(`${appName}/$`), `${appName}/default/#/`);
  }

  getHeaders() {
    const headers = {
      accept: 'application/json'
    };

    return headers;
  }

  setupTimeoutSignal(timeout = FETCH_TIMEOUT) {
    const controller = new AbortController();

    setTimeout(() => controller.abort(), timeout);

    return controller.signal;
  }

  async fetch(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      ...options.headers,
      ...this.getHeaders()
    };

    try {
      const signal = options.signal || this.setupTimeoutSignal();

      return await fetch(url, {
        ...options,
        headers,
        signal
      });
    } catch (error) {
      log('failed to fetch', error);

      return {
        url,
        json: () => {
          return {};
        }
      };
    }
  }
}

const NO_INTERNET_CONNECTION = 'NO_INTERNET_CONNECTION';
const CONNECTION_FAILED = 'CONNECTION_FAILED';
const UNAUTHORIZED = 'UNAUTHORIZED';
const FORBIDDEN = 'FORBIDDEN';
const NOT_FOUND = 'NOT_FOUND';
const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';
const UNAVAILABLE_ERROR = 'UNAVAILABLE_ERROR';

export const ApiErrors = {
  NO_INTERNET_CONNECTION,
  CONNECTION_FAILED,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
  UNAVAILABLE_ERROR
};

export const ApiErrorMessages = {
  [ NO_INTERNET_CONNECTION ]: 'Could not establish a network connection.',
  [ CONNECTION_FAILED ]: 'Should point to a running REST API.',
  [ UNAUTHORIZED ]: 'Credentials do not match with the server.',
  [ FORBIDDEN ]: 'This user is not permitted to retrieve well-known info. Please use different credentials or get this user enabled.',
  [ NOT_FOUND ]: 'The server does not provide a well-known endpoint.',
  [ INTERNAL_SERVER_ERROR ]: 'Server is reporting an error. Please check the server status.',
  [ UNAVAILABLE_ERROR ]: 'Server is reporting an error. Please check the server status.'
};

export class ConnectionError extends Error {

  constructor(response) {
    super('Connection failed');

    this.code = (
      getResponseErrorCode(response) ||
       getNetworkErrorCode(response)
    );

    this.details = ApiErrorMessages[this.code];
  }
}


// helpers ///////////////

function getNetworkErrorCode(response) {
  if (isLocalhost(response.url) || isOnline()) {
    return CONNECTION_FAILED;
  }

  return NO_INTERNET_CONNECTION;
}

function getResponseErrorCode(response) {
  switch (response.status) {
  case 401:
    return UNAUTHORIZED;
  case 403:
    return FORBIDDEN;
  case 404:
    return NOT_FOUND;
  case 500:
    return INTERNAL_SERVER_ERROR;
  case 503:
    return UNAVAILABLE_ERROR;
  }
}

function isLocalhost(url) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)/.test(url);
}

function isOnline() {
  return window.navigator.onLine;
}
