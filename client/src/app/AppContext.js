/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useContext } from 'react';

/**
 * @typedef { {
 *   triggerAction: (action: string, options?: any) => any,
 *   getGlobal: (name: string) => any
 * } } AppContextValue
 */

/**
 * Context exposing the application's action dispatcher and global services
 * to deeply nested components, removing the need to drill `onAction` and
 * individual globals through the component tree.
 *
 * @type {React.Context<AppContextValue|null>}
 */
export const AppContext = React.createContext(null);

/**
 * Access the {@link AppContextValue}.
 *
 * @return {AppContextValue}
 */
export function useApp() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error('useApp must be used within an <AppContext.Provider>');
  }

  return value;
}
