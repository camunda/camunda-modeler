/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const ERROR_MESSAGE = {
  NO_INTERNET_CONNECTION: 'Could not connect to the server. Please verify the endpoint URL.'
};


export default function getNetworkErrorMessage(error) {
  switch (error.code) {
  case 'ECONNRESET':
  case 'ECONNREFUSED':
  case 'ENOTFOUND':
    return ERROR_MESSAGE.NO_INTERNET_CONNECTION;
  }
}