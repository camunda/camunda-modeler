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

export function useConnectionChecker(zeebeApi, deployConfig) {

  const [ result, setResult ] = useState({
    success: false,
    response: null
  });

  useEffect(() => {

    checkConnection();

    const interval = setInterval(() => {
      checkConnection();
    }, 2000);

    return () => clearInterval(interval);
  }, [ deployConfig ]);

  const checkConnection = async () => {

    try {
      const { endpoint } = deployConfig;
      const checkResult = await zeebeApi.checkConnection(endpoint);

      setResult(curr => {

        const next = checkResult.success ? checkResult : { success: false, response: checkResult.reason };

        if (JSON.stringify(curr) === JSON.stringify(next)) {
          return curr;
        }

        return next;
      });
    } catch (error) {
      setResult({
        success: false,
        response: error.message
      });
    }
  };

  return result;
}