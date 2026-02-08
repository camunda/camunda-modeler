/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect, useState } from 'react';

export function useConnectionStatus(subscribe) {
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(null);
  useEffect(() => {
    const subscription = subscribe('connectionManager.connectionStatusChanged', connectionStatus => {
      setConnectionCheckResult(connectionStatus);
    });

    return () => subscription.cancel();
  }, [ subscribe ]);

  return connectionCheckResult;
}
