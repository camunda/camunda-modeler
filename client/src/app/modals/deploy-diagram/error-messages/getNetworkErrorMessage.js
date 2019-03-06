/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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