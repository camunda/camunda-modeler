/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect, useState } from 'camunda-modeler-plugin-helpers/react';

// Check a status and re-check periodically to ensure it is still valid
export default function usePeriodicUpdate(fn, deps, initialValue, intervalDuration = 1000) {
  const [ value, setValue ] = useState(initialValue);

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await fn();
      if (result !== value) {
        setValue(result);
      }
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [ ...deps, value ]);

  return value;
}