/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';
import ReactDOM from 'react-dom';

const DEFAULT_TAGS = [ 'wcag2a', 'wcag21a' ];

export async function loadA11yHelper() {

  // TODO(@barmac): remove or replace when upgraded to React 18
  const axe = await import('@axe-core/react');
  axe.default(React, ReactDOM, 1000, {
    runOnly: DEFAULT_TAGS
  });
}
