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

const DEFAULT_FETCH_TIMEOUT = 5000;

export default class RestAPI {

  constructor(apiLoggerName, baseUrl, authentication) {
    this.log = debug(apiLoggerName);
    this.baseUrl = baseUrl;
    this.authentication = authentication;
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
      this.log('failed to fetch', error);

      return {
        url,
        json: () => {
          return {};
        }
      };
    }
  }

  getHeaders() {
    const headers = {
      accept: 'application/json'
    };

    if (this.authentication) {
      headers.authorization = this.getAuthHeader(this.authentication);
    }

    return headers;
  }

  getAuthHeader(endpoint) {
    const {
      token,
      username,
      password
    } = endpoint;

    if (token) {
      return `Bearer ${token}`;
    }

    if (username && password) {
      const credentials = window.btoa(`${username}:${password}`);

      return `Basic ${credentials}`;
    }
  }

  setupTimeoutSignal(timeout = DEFAULT_FETCH_TIMEOUT) {
    const controller = new AbortController();

    setTimeout(() => controller.abort(), timeout);

    return controller.signal;
  }

  async parse(response) {
    try {
      const json = await response.json();

      return json;
    } catch (error) {
      return {};
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

export const GenericApiErrors = {
  NO_INTERNET_CONNECTION,
  CONNECTION_FAILED,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
  UNAVAILABLE_ERROR
};

export const GenericApiErrorMessages = {
  [ NO_INTERNET_CONNECTION ]: 'Could not establish a network connection.',
  [ CONNECTION_FAILED ]: 'Should point to a running Camunda REST API.',
  [ UNAUTHORIZED ]: 'Credentials do not match with the server.',
  [ FORBIDDEN ]: 'This user is not permitted to deploy. Please use different credentials or get this user enabled to deploy.',
  [ NOT_FOUND ]: 'Should point to a running Camunda REST API.',
  [ INTERNAL_SERVER_ERROR ]: 'Camunda is reporting an error. Please check the server status.',
  [ UNAVAILABLE_ERROR ]: 'Camunda is reporting an error. Please check the server status.'
};

export class ConnectionError extends Error {

  constructor(response) {
    super('Connection failed');

    this.code = (
      getResponseErrorCode(response) ||
      getNetworkErrorCode(response)
    );

    this.details = GenericApiErrorMessages[this.code];
  }
}

export function getNetworkErrorCode(response) {
  if (isLocalhost(response.url) || isOnline()) {
    return CONNECTION_FAILED;
  }

  return NO_INTERNET_CONNECTION;
}

export function getResponseErrorCode(response) {
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
