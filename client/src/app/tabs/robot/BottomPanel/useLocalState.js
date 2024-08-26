/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useState, useEffect } from 'react';

export function useLocalState(localStorageKey, defaultValue) {

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [ state, setState ] = useState(() => {
    try {

      // Get from local storage by key
      const item = window.localStorage.getItem(localStorageKey);

      // Parse stored json or, if null, return defaultValue
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {

      // If error, return defaultValue
      console.log(error);
      return defaultValue;
    }
  });

  // Use useEffect to update the local storage when the state changes
  useEffect(() => {
    try {

      // Save to local storage
      const valueToStore = state instanceof Function ? state(defaultValue) : state;
      window.localStorage.setItem(localStorageKey, JSON.stringify(valueToStore));
    } catch (error) {

      // A more advanced implementation would handle the error case
      console.log(error);
    }
  }, [ localStorageKey, state ]);

  return [ state, setState ];
}