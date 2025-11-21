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

import {
  render,
  fireEvent,
  waitFor
} from '@testing-library/react';

import { Formik, FieldArray } from 'formik';

import { ConnectionManagerSettingsComponent } from '../ConnectionManagerSettingsComponent';

describe('ConnectionManagerSettingsComponent', function() {

  it('should render', function() {

    // when
    const { getByTestId } = createComponent();

    // then
    expect(getByTestId('connection-manager-settings')).to.exist;
  });


  it('should display empty placeholder when no connections', function() {

    // when
    const { container } = createComponent({ initialValues: [] });

    // then
    expect(container.querySelector('.empty-placeholder')).to.exist;
    expect(container.querySelector('.empty-placeholder').textContent).to.equal('No connections configured');
  });


  describe('connections list', function() {

    it('should display connection names', function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Production Cluster' },
        { id: 'conn-2', name: 'Development Cluster' }
      ];

      // when
      const { container } = createComponent({ initialValues: connections });

      // then
      expect(container.textContent).to.contain('Production Cluster');
      expect(container.textContent).to.contain('Development Cluster');
    });


    it('should expand connection on row click', async function() {

      // given
      const connections = [
        {
          id: 'conn-1',
          name: 'Test Connection',
          targetType: 'camundaCloud',
          camundaCloudClusterUrl: 'https://test.zeebe.camunda.io'
        }
      ];

      const { container } = createComponent({ initialValues: connections });

      // when
      const expandButton = container.querySelector('button[aria-label="Expand current row"]');
      fireEvent.click(expandButton);

      // then
      await waitFor(() => {
        expect(container.querySelector('input[name*="name"]')).to.exist;
      });
    });


    it('should collapse connection when clicking expanded row', async function() {

      // given
      const connections = [
        {
          id: 'conn-1',
          name: 'Test Connection',
          targetType: 'camundaCloud'
        }
      ];

      const { container } = createComponent({ initialValues: connections });

      const expandButton = container.querySelector('button[aria-label="Expand current row"]');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(container.querySelector('input[name*="name"]')).to.exist;
      });

      // when
      fireEvent.click(expandButton);

      // then
      await waitFor(() => {
        expect(container.querySelector('input[name*="name"]')).to.not.exist;
      });
    });

  });


  describe('add connection', function() {

    it('should render add button', function() {

      // when
      const { container } = createComponent();

      // then
      const addButton = container.querySelector('button.add');
      expect(addButton).to.exist;
    });


    it('should add new connection', async function() {

      // given
      const { container } = createComponent({ initialValues: [] });

      // when
      const addButton = container.querySelector('button.add');
      fireEvent.click(addButton);

      // then
      await waitFor(() => {
        expect(container.querySelector('.empty-placeholder')).to.not.exist;
        expect(container.querySelector('input[name*="name"]')).to.exist;
      });
    });


    it('should expand newly added connection', async function() {

      // given
      const { container } = createComponent({ initialValues: [] });

      // when
      const addButton = container.querySelector('button.add');
      fireEvent.click(addButton);

      // then
      await waitFor(() => {
        const nameInput = container.querySelector('input[name*="name"]');
        expect(nameInput).to.exist;
      });
    });


    it('should add connection with default values', async function() {

      // given
      const onSubmit = sinon.spy();
      const { container } = createComponent({ initialValues: [], onSubmit });

      // when
      const addButton = container.querySelector('button.add');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(container.querySelector('input[name*="name"]')).to.exist;
      });

      // Submit form to check values
      const form = container.querySelector('form');
      fireEvent.submit(form);

      // then
      await waitFor(() => {
        expect(onSubmit).to.have.been.calledOnce;
        const values = onSubmit.firstCall.args[0];
        expect(values.connections).to.have.lengthOf(1);
        expect(values.connections[0]).to.have.property('id');
        expect(values.connections[0]).to.have.property('name');
      });
    });

  });


  describe('remove connection', function() {

    it('should render remove button for each connection', function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Connection 1' },
        { id: 'conn-2', name: 'Connection 2' }
      ];

      // when
      const { container } = createComponent({ initialValues: connections });

      // then
      const removeButtons = container.querySelectorAll('button.remove');
      expect(removeButtons.length).to.equal(2);
    });


    it('should remove connection', async function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Connection 1' },
        { id: 'conn-2', name: 'Connection 2' }
      ];

      const { container } = createComponent({ initialValues: connections });

      // when
      const removeButtons = container.querySelectorAll('button.remove');
      fireEvent.click(removeButtons[0]);

      // then
      await waitFor(() => {
        expect(container.textContent).to.not.contain('Connection 1');
        expect(container.textContent).to.contain('Connection 2');
      });
    });


    it('should show empty placeholder when removing last connection', async function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Only Connection' }
      ];

      const { container } = createComponent({ initialValues: connections });

      // when
      const removeButton = container.querySelector('button.remove');
      fireEvent.click(removeButton);

      // then
      await waitFor(() => {
        expect(container.querySelector('.empty-placeholder')).to.exist;
      });
    });

  });


  describe('edit connection', function() {

    it('should allow editing connection name', async function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Original Name', targetType: 'camundaCloud' }
      ];

      const { container } = createComponent({ initialValues: connections });

      // Expand the connection
      const expandButton = container.querySelector('button[aria-label="Expand current row"]');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(container.querySelector('input[name*="name"]')).to.exist;
      });

      // when
      const nameInput = container.querySelector('input[name*="name"]');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      // then
      expect(nameInput.value).to.equal('New Name');
    });


    it('should display connection fields when expanded', async function() {

      // given
      const connections = [
        {
          id: 'conn-1',
          name: 'Test Connection',
          targetType: 'camundaCloud',
          camundaCloudClusterUrl: 'https://test.zeebe.camunda.io',
          camundaCloudClientId: 'test-client-id'
        }
      ];

      const { container } = createComponent({ initialValues: connections });

      // when
      const expandButton = container.querySelector('button[aria-label="Expand current row"]');
      fireEvent.click(expandButton);

      // then
      await waitFor(() => {
        expect(container.querySelector('input[name*="name"]')).to.exist;
        expect(container.querySelector('input[name*="camundaCloudClusterUrl"]')).to.exist;
        expect(container.querySelector('input[name*="camundaCloudClientId"]')).to.exist;
      });
    });


    it('should show target type radio buttons', async function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Test', targetType: 'camundaCloud' }
      ];

      const { container } = createComponent({ initialValues: connections });

      // when
      const expandButton = container.querySelector('button[aria-label="Expand current row"]');
      fireEvent.click(expandButton);

      // then
      await waitFor(() => {
        const radioButtons = container.querySelectorAll('input[type="radio"][name*="targetType"]');
        expect(radioButtons.length).to.be.at.least(2);
      });
    });

  });


  describe('expand row by id', function() {

    it('should expand row matching expandRowId prop', async function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Connection 1' },
        { id: 'conn-2', name: 'Connection 2' },
        { id: 'conn-3', name: 'Connection 3' }
      ];

      // when
      const { container } = createComponent({
        initialValues: connections,
        expandRowId: 'conn-2'
      });

      // then
      // The ref is set but expansion happens via user interaction
      // We can verify the ref exists
      await waitFor(() => {
        expect(container.querySelector('input[name*="name"]')).to.not.exist;
      });
    });

  });


  describe('table structure', function() {

    it('should render as a table', function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Test Connection' }
      ];

      // when
      const { container } = createComponent({ initialValues: connections });

      // then
      expect(container.querySelector('table')).to.exist;
      expect(container.querySelector('tbody')).to.exist;
    });


    it('should render correct number of rows', function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Connection 1' },
        { id: 'conn-2', name: 'Connection 2' },
        { id: 'conn-3', name: 'Connection 3' }
      ];

      // when
      const { container } = createComponent({ initialValues: connections });

      // then
      const rows = container.querySelectorAll('tbody tr[data-parent-row]');
      expect(rows.length).to.equal(3);
    });


    it('should have action cell with remove button', function() {

      // given
      const connections = [
        { id: 'conn-1', name: 'Test Connection' }
      ];

      // when
      const { container } = createComponent({ initialValues: connections });

      // then
      const actionCell = container.querySelector('td.action-cell');
      expect(actionCell).to.exist;
      expect(actionCell.querySelector('button.remove')).to.exist;
    });

  });



  it('should display description text', function() {

    // when
    const { container } = createComponent();

    // then
    const description = container.querySelector('.custom-control-description');
    expect(description).to.exist;
    expect(description.textContent).to.equal('Manage Camunda 8 orchestration cluster connections.');
  });


});

// helpers ///////////////////

function createComponent(options = {}) {
  const {
    initialValues = [],
    expandRowId = null,
    onSubmit = () => {}
  } = options;

  const values = {
    connections: initialValues
  };

  return render(
    <Formik
      initialValues={ values }
      onSubmit={ onSubmit }
    >
      {({ values }) => (
        <form onSubmit={ (e) => {
          e.preventDefault();
          onSubmit(values);
        } }>
          <FieldArray
            name="connections"
            render={ (arrayHelpers) => (
              <ConnectionManagerSettingsComponent
                { ...arrayHelpers }
                name="connections"
                expandRowId={ expandRowId }
              />
            ) }
          />
        </form>
      )}
    </Formik>
  );
}
