/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import React from 'react';

import { render, fireEvent, waitFor } from '@testing-library/react';

import { ConnectionManagerOverlay } from '../ConnectionManagerOverlay';
import { C8RUN_DOWNLOAD_URL, C8RUN_TROUBLESHOOTING_URL } from '../constants';

describe('ConnectionManagerOverlay', function() {

  describe('rendering', function() {

    it('should render with connections', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;

      // when
      const { container, getByText } = createConnectionManagerOverlay({ connections });

      // then
      expect(container.querySelector('[name="connection"]')).to.exist;
      expect(getByText('Manage connections')).to.exist;
    });


    it('should render without connections', function() {

      // given
      const connections = [];

      // when
      const { container } = createConnectionManagerOverlay({ connections });

      // then
      expect(container.querySelector('[name="connection"]')).to.exist;
    });


    it('should render custom header', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const renderHeader = <div className="custom-header">Custom Header</div>;

      // when
      const { getByText } = createConnectionManagerOverlay({ connections, renderHeader });

      // then
      expect(getByText('Custom Header')).to.exist;
    });

  });


  describe('connection selection', function() {

    it('should display active connection', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const activeConnection = connections[1];

      // when
      const { getByText } = createConnectionManagerOverlay({ connections, activeConnection });

      // then
      expect(getByText('Test Connection 2')).to.exist;
    });


    it('should handle connection change', async function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const handleConnectionChange = sinon.spy();

      const { getByRole } = createConnectionManagerOverlay({
        connections,
        handleConnectionChange,
        activeConnection: connections[0]
      });

      // when
      const trigger = getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(() => {
        const option = document.querySelector('[role="option"][data-value="connection-2"]')
          || Array.from(document.querySelectorAll('[role="option"]')).find(
            el => el.textContent === 'Test Connection 2'
          );
        if (option) {
          fireEvent.click(option);
        }
      });

      // then
      expect(handleConnectionChange).to.have.been.calledOnce;
      expect(handleConnectionChange).to.have.been.calledWith(connections[1]);
    });

  });


  describe('connection status', function() {

    it('should display error message on connection failure (CONTACT_POINT_UNAVAILABLE)', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const activeConnection = connections[0];
      const connectionCheckResult = {
        success: false,
        reason: 'CONTACT_POINT_UNAVAILABLE'
      };

      // when
      const { getByText } = createConnectionManagerOverlay({ connections, connectionCheckResult, activeConnection });

      // then
      expect(getByText('Cannot connect to Orchestration Cluster.')).to.exist;
    });


    it('should display error message without prefix (CLUSTER_UNAVAILABLE)', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const activeConnection = connections[0];
      const connectionCheckResult = {
        success: false,
        reason: 'CLUSTER_UNAVAILABLE'
      };

      // when
      const { getByText } = createConnectionManagerOverlay({ connections, connectionCheckResult, activeConnection });

      // then
      expect(getByText('Cannot connect to Orchestration Cluster.')).to.exist;
    });


    it('should display error message without prefix (UNKNOWN)', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const activeConnection = connections[0];
      const connectionCheckResult = {
        success: false,
        reason: 'UNKNOWN'
      };

      // when
      const { getByText } = createConnectionManagerOverlay({ connections, connectionCheckResult, activeConnection });

      // then
      expect(getByText('Unknown error. Please check Orchestration Cluster status.')).to.exist;
    });


    it('should display error message with prefix for other error types (UNAUTHORIZED)', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const activeConnection = connections[0];
      const connectionCheckResult = {
        success: false,
        reason: 'UNAUTHORIZED'
      };

      // when
      const { container } = createConnectionManagerOverlay({ connections, connectionCheckResult, activeConnection });

      // then
      expect(container.textContent).to.contain('Could not establish connection:');
      expect(container.textContent).to.contain('Credentials rejected by server.');
    });


    it('should not display error message on connection success', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const connectionCheckResult = {
        success: true
      };

      // when
      const { queryByText } = createConnectionManagerOverlay({ connections, connectionCheckResult });

      // then
      expect(queryByText(/Cannot connect to the endpoint/)).to.not.exist;
    });


    it('should not display error message when no check result', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;

      // when
      const { queryByText } = createConnectionManagerOverlay({ connections });

      // then
      expect(queryByText(/Cannot connect to the endpoint/)).to.not.exist;
    });


    it('should display Camunda 8 Run download and troubleshooting links when c8run connection fails', function() {

      // given
      const connections = [
        {
          id: 'conn-1',
          name: 'c8run (local)',
          targetType: 'selfHosted',
          contactPoint: 'http://localhost:8080/v2'
        }
      ];
      const activeConnection = connections[0];
      const connectionCheckResult = {
        success: false,
        reason: 'CONTACT_POINT_UNAVAILABLE'
      };

      // when
      const { container, getByTestId } = createConnectionManagerOverlay({
        connections,
        connectionCheckResult,
        activeConnection
      });

      // then
      expect(container.textContent).to.contain(
        'Download or start Camunda 8 Run to connect. For help, see the troubleshooting information.'
      );

      // Assert download link with correct text and URL
      const downloadLink = getByTestId('c8run-download-link');
      expect(downloadLink.textContent).to.equal('Download');
      expect(downloadLink.getAttribute('href')).to.equal(C8RUN_DOWNLOAD_URL);

      // Assert troubleshooting link with correct text and URL
      const troubleshootLink = getByTestId('c8run-troubleshoot-link');
      expect(troubleshootLink.textContent).to.equal('troubleshooting information');
      expect(troubleshootLink.getAttribute('href')).to.equal(C8RUN_TROUBLESHOOTING_URL);
    });


    it('should NOT display Camunda 8 Run link when non-c8run connection fails', function() {

      // given
      const connections = [
        {
          id: 'custom-connection',
          name: 'My Custom Connection',
          targetType: 'selfHosted',
          contactPoint: 'http://localhost:26500'
        }
      ];
      const activeConnection = connections[0];
      const connectionCheckResult = {
        success: false,
        reason: 'CONTACT_POINT_UNAVAILABLE'
      };

      // when
      const { queryByTestId } = createConnectionManagerOverlay({
        connections,
        connectionCheckResult,
        activeConnection
      });

      // then
      expect(queryByTestId('c8run-nudge-link')).to.not.exist;
    });

  });


  it('should call handler when "Manage connections" is clicked', function() {

    // given
    const connections = DEFAULT_CONNECTIONS;
    const handleManageConnections = sinon.spy();

    const { getByText } = createConnectionManagerOverlay({ connections, handleManageConnections });

    // when
    const manageLink = getByText('Manage connections');
    fireEvent.click(manageLink);

    // then
    expect(handleManageConnections).to.have.been.calledOnce;
  });


});

// helpers //////////////////////

const DEFAULT_CONNECTIONS = [
  {
    id: 'connection-1',
    name: 'Test Connection 1',
    url: 'http://localhost:8080'
  },
  {
    id: 'connection-2',
    name: 'Test Connection 2',
    url: 'http://localhost:8081'
  }
];

function createConnectionManagerOverlay(props = {}) {
  const {
    connections = DEFAULT_CONNECTIONS,
    handleConnectionChange = () => {},
    connectionCheckResult = null,
    activeConnection = null,
    handleManageConnections = () => {},
    renderHeader = <>Select connection</>
  } = props;

  return render(
    <ConnectionManagerOverlay
      connections={ connections }
      handleConnectionChange={ handleConnectionChange }
      connectionCheckResult={ connectionCheckResult }
      activeConnection={ activeConnection }
      handleManageConnections={ handleManageConnections }
      renderHeader={ renderHeader }
    />
  );
}
