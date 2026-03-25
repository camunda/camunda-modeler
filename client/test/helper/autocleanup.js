/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { cleanup, configure } from '@testing-library/react';

if (process.env.REACT_STRICT_MODE === 'true') {
  configure({ reactStrictMode: true });
}

// eslint-disable-next-line mocha/no-top-level-hooks
beforeEach(function() {
  cleanup();
});
