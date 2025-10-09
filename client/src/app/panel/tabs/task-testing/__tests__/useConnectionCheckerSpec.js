/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks/dom';

import { useConnectionChecker } from '../hooks/useConnectionChecker';

describe('useConnectionChecker', function() {

  const successResponse = {
    success: true,
    response: {
      protocol: 'rest',
      gatewayVersion: '8.8.0',
    }
  };

  const errorResponse = {
    success: false,
    response: 'Some error'
  };

  it('should handle successful connection', async function() {

    // given
    const zeebeApi = {
      checkConnection: sinon.stub().resolves(successResponse)
    };

    // when
    const { result } = renderHook(() => useConnectionChecker(zeebeApi, { endpoint: true }));

    // then
    await waitFor(() => {
      expect(result.current).to.deep.equal(successResponse);
    });
  });


  it('should handle connection error', async function() {

    // given
    const zeebeApi = {
      checkConnection: sinon.stub().resolves(errorResponse)
    };

    // when
    const { result } = renderHook(() => useConnectionChecker(zeebeApi, { endpoint: true }));

    // then
    await waitFor(() => {
      expect(result.current).to.deep.equal(errorResponse);
    });
  });


  it('should handle missing deployment config', async function() {

    // given
    const zeebeApi = {
      checkConnection: sinon.stub().resolves(successResponse)
    };

    // when
    const { result } = renderHook(() => useConnectionChecker(zeebeApi, null));

    // then
    await waitFor(() => {
      expect(result.current).to.deep.equal({
        success: false,
        response: "Cannot destructure property 'endpoint' of 'deployConfig' as it is null."
      });
    });
  });
});