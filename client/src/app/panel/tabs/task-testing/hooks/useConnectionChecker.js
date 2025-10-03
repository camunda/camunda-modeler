/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect, useRef, useState } from 'react';

import ConnectionChecker from '../../../../../plugins/zeebe-plugin/deployment-plugin/ConnectionChecker';

export function useConnectionChecker(zeebeApi, deployConfig) {

  const { current: connectionChecker } = useRef(new ConnectionChecker(zeebeApi));

  const [ result, setResult ] = useState({
    success: false,
    response: null
  });

  useEffect(() => {
    connectionChecker.on('connectionCheck', checkConnection);
    connectionChecker.startChecking();

    return () => {
      connectionChecker.stopChecking();
      connectionChecker.off('connectionCheck', checkConnection);
    };
  }, []);

  useEffect(() => {
    connectionChecker.updateConfig(deployConfig);
  }, [ deployConfig ]);

  const checkConnection = async ({ success, response }) => {

    if (success === result.success &&
      response?.gatewayVersion === result.response?.gatewayVersion &&
      response?.protocol === result.response?.protocol
    ) {
      return;
    }

    setResult({ success, response });
  };

  return {
    connectionSuccess: result.success,
    connectionError: result.response
  };
}