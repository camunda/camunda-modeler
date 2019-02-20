/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getCamundaBpmErrorMessage from './getCamundaBpmErrorMessage';
import getNetworkErrorMessage from './getNetworkErrorMessage';
import getStatusCodeErrorMessage from './getStatusCodeErrorMessage';

export default [
  getCamundaBpmErrorMessage,
  getNetworkErrorMessage,
  getStatusCodeErrorMessage
];
