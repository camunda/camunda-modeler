/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { createContext, useContext } from 'react';

const ServicesContext = createContext(null);

export default ServicesContext;

/**
 * Hook to access the services provided via ServicesContext.
 *
 * @returns {{ layout: LayoutService, notification: NotificationService, linting: LintingService }}
 */
export function useServices() {
  return useContext(ServicesContext);
}
