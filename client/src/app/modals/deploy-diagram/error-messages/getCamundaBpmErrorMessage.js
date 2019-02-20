/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const ERROR_MESSAGE = {
  BPMN_PARSING_ERROR: 'Server could not parse the diagram. Please check log for errors.'
};


export default function getCamundaBpmErrorMessage(error) {
  if (/^ENGINE-09005/.test(error.message)) {
    return ERROR_MESSAGE.BPMN_PARSING_ERROR;
  }
}
