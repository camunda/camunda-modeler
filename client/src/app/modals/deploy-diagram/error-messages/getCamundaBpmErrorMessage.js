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
  BPMN_PARSING_ERROR: 'Server could not parse the diagram. Please check log for errors.'
};


export default function getCamundaBpmErrorMessage(error) {
  if (/^ENGINE-09005/.test(error.message)) {
    return ERROR_MESSAGE.BPMN_PARSING_ERROR;
  }
}
