/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export const ConnectionErrorMessages = {
  noInternetConnection: 'Could not establish a network connection. Most likely your machine is not online right now.',
  unableToConnect: 'Could not connect to the server. Did you run the engine?',
  unauthorized: 'Authentication failed. Please check your credentials.',
  forbidden: 'This user is not permitted to deploy. Please use different credentials or get this user enabled to deploy.',
  notFound: 'Could not find the Camunda endpoint. Please check the URL and make sure Camunda is running.',
  internalServerError: 'Camunda is reporting an error. Please check the server status.',
  unreachable: 'Camunda is reporting an error. Please check the server status.'
};


export default class ConnectionError extends Error {
  constructor(response) {
    super();

    this.message = (
      this.getStatusCodeErrorMessage(response) ||
      this.getNetworkErrorMessage(response)
    );
  }

  getStatusCodeErrorMessage(response) {
    switch (response.status) {
    case 401:
      return ConnectionErrorMessages.unauthorized;
    case 403:
      return ConnectionErrorMessages.forbidden;
    case 404:
      return ConnectionErrorMessages.notFound;
    case 500:
      return ConnectionErrorMessages.internalServerError;
    case 503:
      return ConnectionErrorMessages.unavailable;
    }
  }

  getNetworkErrorMessage(response) {
    if (!/^https?:\/\/localhost/.test(response.url) && !window.navigator.onLine) {
      return ConnectionErrorMessages.noInternetConnection;
    }

    return ConnectionErrorMessages.unableToConnect;
  }
}
