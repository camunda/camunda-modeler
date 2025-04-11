/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import notarize from './after-sign/notarize.mjs';

export default async function(context) {

  const handlers = [
    notarize
  ];

  for (const handler of handlers) {
    await handler(context);
  }
};
