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

import React from 'react';

import { render, fireEvent } from '@testing-library/react';

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
      expect(container.querySelector('select[name="connection"]')).to.exist;
      expect(getByText('Manage connections')).to.exist;
    });


    it('should render without connections', function() {

      // given
      const connections = [];

      // when
      const { container, getByText } = createConnectionManagerOverlay({ connections });

      // then
      expect(container.querySelector('select[name="connection"]')).to.exist;
      expect(getByText('Disabled (offline mode)')).to.exist;
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

    it('should display all available connections', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;

      // when
      const { container } = createConnectionManagerOverlay({ connections });

      const select = container.querySelector('select[name="connection"]');

      // then
      expect(select).to.exist;

      expect(select.options.length).to.equal(3);
      expect(select.options[0].value).to.equal('connection-1');
      expect(select.options[0].text).to.equal('Test Connection 1');
      expect(select.options[1].value).to.equal('connection-2');
      expect(select.options[1].text).to.equal('Test Connection 2');
    });


    it('should display active connection', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const activeConnection = connections[1];

      // when
      const { container } = createConnectionManagerOverlay({ connections, activeConnection });

      const select = container.querySelector('select[name="connection"]');

      // then
      expect(select.value).to.equal('connection-2');
    });


    it('should handle connection change', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;
      const handleConnectionChange = sinon.spy();

      const { container } = createConnectionManagerOverlay({ connections, handleConnectionChange });

      const select = container.querySelector('select[name="connection"]');

      // when
      fireEvent.change(select, { target: { value: 'connection-2' } });

      // then
      expect(handleConnectionChange).to.have.been.calledOnce;
      expect(handleConnectionChange).to.have.been.calledWith(connections[1]);
    });


    it('should display unnamed connection with URL', function() {

      // given
      const connections = [
        {
          id: 'connection-1',
          targetType: 'selfHosted',
          contactPoint: 'http://localhost:26500'
        }
      ];

      // when
      const { container } = createConnectionManagerOverlay({ connections });

      const select = container.querySelector('select[name="connection"]');

      // then
      expect(select.options[0].text).to.equal('Unnamed (http://localhost:26500)');
    });


    it('should display camundaCloud connection URL', function() {

      // given
      const connections = [
        {
          id: 'connection-1',
          targetType: 'camundaCloud',
          camundaCloudClusterUrl: 'https://cluster.camunda.io'
        }
      ];

      // when
      const { container } = createConnectionManagerOverlay({ connections });

      const select = container.querySelector('select[name="connection"]');

      // then
      expect(select.options[0].text).to.equal('Unnamed (https://cluster.camunda.io)');
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
      const { container } = createConnectionManagerOverlay({ connections, connectionCheckResult, activeConnection });

      // then
      const errorMessage = container.querySelector('.invalid-feedback');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.equal('Cannot connect to Orchestration Cluster.');
      expect(errorMessage.textContent).to.not.contain('Could not establish connection:');
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
      const { container } = createConnectionManagerOverlay({ connections, connectionCheckResult, activeConnection });

      // then
      const errorMessage = container.querySelector('.invalid-feedback');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.equal('Cannot connect to Orchestration Cluster.');
      expect(errorMessage.textContent).to.not.contain('Could not establish connection:');
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
      const { container } = createConnectionManagerOverlay({ connections, connectionCheckResult, activeConnection });

      // then
      const errorMessage = container.querySelector('.invalid-feedback');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.equal('Unknown error. Please check Orchestration Cluster status.');
      expect(errorMessage.textContent).to.not.contain('Could not establish connection:');
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
      const errorMessage = container.querySelector('.invalid-feedback');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.contain('Could not establish connection:');
      expect(errorMessage.textContent).to.contain('Credentials rejected by server.');
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
      const errorMessage = container.querySelector('.invalid-feedback');
      expect(errorMessage).to.exist;

      // Get the description field and verify full text
      const descriptionField = container.querySelector('.custom-control-description');
      expect(descriptionField).to.exist;
      expect(descriptionField.textContent).to.equal(
        'Download or start Camunda 8 Run to connect. See troubleshooting information about C8 Run here.'
      );

      // Assert download link with correct text and URL
      const downloadLink = getByTestId('c8run-download-link');
      expect(downloadLink.textContent).to.equal('Download');
      expect(downloadLink.getAttribute('href')).to.equal(C8RUN_DOWNLOAD_URL);

      // Assert troubleshooting link with correct text and URL
      const troubleshootLink = getByTestId('c8run-troubleshoot-link');
      expect(troubleshootLink.textContent).to.equal('here');
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
      const { container, queryByTestId } = createConnectionManagerOverlay({
        connections,
        connectionCheckResult,
        activeConnection
      });

      // then
      const errorMessage = container.querySelector('.invalid-feedback');
      expect(errorMessage).to.exist;
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
