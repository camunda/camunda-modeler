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

  it('should handle successful connection', async function() {

    // given
    const zeebeApi = {
      checkConnection: sinon.stub().resolves({
        success: true,
        response: {
          protocol: 'rest',
          gatewayVersion: '8.8.0',
        }
      })
    };

    // when
    const { result } = renderHook(() => useConnectionChecker(zeebeApi, { endpoint: true }));

    // then
    await waitFor(() => {
      expect(result.current).to.deep.equal({
        success: true,
        response: {
          protocol: 'rest',
          gatewayVersion: '8.8.0',
        }
      });
    });
  });


  it('should handle connection error', async function() {

    // given
    const zeebeApi = {
      checkConnection: sinon.stub().resolves({
        success: false,
        reason: 'Some error'
      })
    };

    // when
    const { result } = renderHook(() => useConnectionChecker(zeebeApi, { endpoint: true }));

    // then
    await waitFor(() => {
      expect(result.current).to.deep.equal({
        success: false,
        response: 'Some error'
      });
    });
  });


  it('should handle missing deployment config', async function() {

    // given
    const zeebeApi = {
      checkConnection: sinon.stub().resolves({ success: true, response: {} })
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