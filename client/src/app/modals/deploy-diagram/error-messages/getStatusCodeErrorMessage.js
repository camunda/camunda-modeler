/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const ERROR_MESSAGE = {
  UNAUTHORIZED: 'The deployment was unauthorized. Please use valid credentials.',
  FORBIDDEN: 'The deployment was not permitted for your credentials. Please check your credentials.',
  NOT_FOUND: 'Could not connect to Camunda. Please check the endpoint URL.',
  INTERNAL_SERVER_ERROR: 'Camunda reported an unknown error. Please check the server status.',
  SERVER_UNAVAILABLE: 'Camunda is currently unavailable. Please try again later.'
};


export default function getStatusCodeErrorMessage(error) {
  switch (error.status) {
  case 401:
    return ERROR_MESSAGE.UNAUTHORIZED;
  case 403:
    return ERROR_MESSAGE.FORBIDDEN;
  case 404:
    return ERROR_MESSAGE.NOT_FOUND;
  case 500:
    return ERROR_MESSAGE.INTERNAL_SERVER_ERROR;
  case 503:
    return ERROR_MESSAGE.SERVER_UNAVAILABLE;
  }
}