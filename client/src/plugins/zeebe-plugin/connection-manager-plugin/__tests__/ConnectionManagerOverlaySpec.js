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

describe('ConnectionManagerOverlay', function() {

  describe('rendering', function() {

    it('should render with connections', function() {

      // given
      const connections = DEFAULT_CONNECTIONS;

      // when
      const { container, getByText } = createConnectionManagerOverlay({ connections });

      // then
      expect(container.querySelector('select[name="connection"]')).to.exist;
      expect(getByText('Select orchestration cluster connection.')).to.exist;
      expect(getByText('Manage connections')).to.exist;
    });


    it('should render without connections', function() {

      // given
      const connections = [];

      // when
      const { container, getByText } = createConnectionManagerOverlay({ connections });

      // then
      expect(container.querySelector('select[name="connection"]')).to.not.exist;
      expect(getByText('No connections configured')).to.exist;
      expect(getByText('Add connections')).to.exist;
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

      // Note: Select component includes two placeholder options (hidden + disabled)
      expect(select.options.length).to.equal(4);
      expect(select.options[2].value).to.equal('connection-1');
      expect(select.options[2].text).to.equal('Test Connection 1');
      expect(select.options[3].value).to.equal('connection-2');
      expect(select.options[3].text).to.equal('Test Connection 2');
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
      expect(handleConnectionChange).to.have.been.calledWith('connection-2');
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
      expect(select.options[2].text).to.equal('Unnamed (http://localhost:26500)');
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
      expect(select.options[2].text).to.equal('Unnamed (https://cluster.camunda.io)');
    });

  });


  describe('connection status', function() {

    it('should display error message on connection failure', function() {

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
      expect(errorMessage.textContent).to.contain('Cannot connect to Orchestration cluster');
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

  });


  describe('manage connections', function() {

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


    it('should call handler when "Add connections" is clicked', function() {

      // given
      const connections = [];
      const handleManageConnections = sinon.spy();

      const { getByText } = createConnectionManagerOverlay({ connections, handleManageConnections });

      // when
      const addLink = getByText('Add connections');
      fireEvent.click(addLink);

      // then
      expect(handleManageConnections).to.have.been.calledOnce;
    });

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
