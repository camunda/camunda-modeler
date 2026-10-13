/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { expect } from 'chai';
import sinon from 'sinon';

import { Formik } from 'formik';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { SettingsForm } from '../../../settings/SettingsForm';

import { ConnectionManagerSettingsComponent } from '../ConnectionManagerSettingsComponent';
import { C8RUN_DOWNLOAD_URL, C8RUN_TROUBLESHOOTING_URL } from '../constants';

const NAME = 'connectionManagerPlugin.c8connections';

const SAAS_CONNECTION = {
  id: 'saas',
  name: 'Production',
  targetType: 'camundaCloud',
  camundaCloudClusterUrl: 'https://bru-2.zeebe.camunda.io/abc',
  camundaCloudClientId: 'client-id',
  camundaCloudClientSecret: 'client-secret'
};

const SELF_MANAGED_CONNECTION = {
  id: 'self-managed',
  name: 'Development',
  targetType: 'selfHosted',
  contactPoint: 'http://localhost:26500',
  authType: 'none'
};

const C8RUN_CONNECTION = {
  id: 'c8run',
  name: 'c8run (local)',
  targetType: 'selfHosted',
  contactPoint: 'http://localhost:8080/v2',
  authType: 'none'
};


describe('ConnectionManagerSettingsComponent', function() {

  describe('list', function() {

    it('should list connections', function() {

      // when
      renderConnections([
        SAAS_CONNECTION,
        SELF_MANAGED_CONNECTION,
        { id: 'unnamed', targetType: 'selfHosted' }
      ]);

      // then
      expect(getItems()).to.eql([
        [ 'Production', 'https://bru-2.zeebe.camunda.io/abc' ],
        [ 'Development', 'http://localhost:26500' ],
        [ 'Unnamed connection', 'Camunda 8 Self-Managed' ]
      ]);
      expect(screen.getAllByRole('button', { name: /^Options for / })).to.have.length(3);
      expect(screen.getByText(/Deploy and run your processes on Camunda 8/)).to.exist;
    });


    it('should link Camunda 8 Run documentation with UTM tags', function() {

      // when
      renderConnections([]);

      // then
      const url = new URL(screen.getByRole('link', { name: 'Camunda 8 Run' }).href);

      expect(url.searchParams.get('utm_source')).to.eql('modeler');
      expect(url.searchParams.get('utm_medium')).to.eql('referral');
    });


    it('should not offer inline editing or removal', function() {

      // when
      const { container } = renderConnections([ SAAS_CONNECTION ]);

      // then
      expect(container.querySelector('table')).not.to.exist;
      expect(screen.queryByRole('textbox')).not.to.exist;
      expect(screen.queryByRole('button', { name: /Remove/ })).not.to.exist;
    });


    it('should display empty state', function() {

      // when
      renderConnections([]);

      // then
      expect(screen.getByText(/No connections configured/)).to.exist;
      expect(screen.queryByRole('list')).not.to.exist;
    });


    it('should remove a connection', async function() {

      // given
      const { getValues } = renderConnections([ SAAS_CONNECTION, SELF_MANAGED_CONNECTION ]);

      // when
      selectAction('Production', 'Remove');

      // then
      await waitFor(() => expect(getValues()).to.eql([ SELF_MANAGED_CONNECTION ]));
      expect(getItems()).to.eql([ [ 'Development', 'http://localhost:26500' ] ]);
      expect(document.activeElement === screen.getByRole('button', { name: 'Add connection' }), 'focus moved').to.be.true;
    });


    it('should remove the last connection', async function() {

      // given
      const { getValues } = renderConnections([ SAAS_CONNECTION ]);

      // when
      selectAction('Production', 'Remove');

      // then
      await waitFor(() => expect(getValues()).to.eql([]));
      expect(screen.getByText(/No connections configured/)).to.exist;
    });

  });


  describe('add dialog', function() {

    it('should open with defaults', function() {

      // when
      renderConnections([ SAAS_CONNECTION ]);

      fireEvent.click(screen.getByRole('button', { name: 'Add connection' }));

      // then
      const dialog = getDialog();
      const name = getInput('Name');

      expect(within(dialog).getByRole('heading').textContent).to.equal('Add Camunda 8 connection');
      expect(name.value).to.equal('New connection 2');
      expect(document.activeElement === name, 'name focused').to.be.true;
      expect(name.selectionStart).to.equal(0);
      expect(name.selectionEnd).to.equal(name.value.length);
      expect(within(dialog).getByRole('radio', { name: 'Camunda 8 SaaS' }).checked).to.be.true;
    });


    it('should add a connection', async function() {

      // given
      const { getValues, onSubmit } = renderConnections([ SAAS_CONNECTION ]);

      fireEvent.click(screen.getByRole('button', { name: 'Add connection' }));

      const dialog = getDialog();

      await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Add' }).disabled, 'invalid').to.be.true);

      // when
      fill('Name', 'Staging');
      fireEvent.click(within(dialog).getByRole('radio', { name: 'Camunda 8 Self-Managed' }));
      fill('Connection URL', 'http://staging:8080/v2');

      await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Add' }).disabled, 'valid').to.be.false);

      fireEvent.submit(within(dialog).getByRole('button', { name: 'Add' }).closest('form'));

      // then
      await waitFor(() => expect(getValues()).to.have.length(2));

      const [ , added ] = getValues();

      expect(added).to.include({
        name: 'Staging',
        targetType: 'selfHosted',
        contactPoint: 'http://staging:8080/v2',
        authType: 'none'
      });
      expect(added.id).to.be.a('string').and.not.to.equal(SAAS_CONNECTION.id);
      expect(screen.queryByRole('dialog')).not.to.exist;
      expect(getItems()[1]).to.eql([ 'Staging', 'http://staging:8080/v2' ]);
      expect(onSubmit).not.to.have.been.called;
    });


    it('should cancel', function() {

      // given
      const { getValues } = renderConnections([]);

      const addButton = screen.getByRole('button', { name: 'Add connection' });

      addButton.focus();
      fireEvent.click(addButton);
      fill('Name', 'Staging');

      // when
      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

      // then
      expect(screen.queryByRole('dialog')).not.to.exist;
      expect(getValues()).to.eql([]);
      expect(document.activeElement === addButton, 'focus restored').to.be.true;
    });

  });


  describe('edit dialog', function() {

    it('should edit a connection', async function() {

      // given
      const connection = { ...SAAS_CONNECTION, extra: 'kept' };

      const { getValues, onSubmit } = renderConnections([ connection, SELF_MANAGED_CONNECTION ]);

      // when
      selectAction('Production', 'Edit');

      // then
      const dialog = getDialog();

      expect(within(dialog).getByRole('heading').textContent).to.equal('Edit Production');
      expect(getInput('Name').value).to.equal('Production');
      expect(getInput('Connection URL').value).to.equal(SAAS_CONNECTION.camundaCloudClusterUrl);
      await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Save' }).disabled, 'unchanged').to.be.true);

      // when
      fill('Name', 'Production EU');

      // then
      // titled by the persisted name
      expect(within(dialog).getByRole('heading').textContent).to.equal('Edit Production');

      // when
      fireEvent.submit(within(dialog).getByRole('button', { name: 'Save' }).closest('form'));

      // then
      await waitFor(() => expect(getValues()).to.eql([
        { ...connection, name: 'Production EU' },
        SELF_MANAGED_CONNECTION
      ]));
      expect(screen.queryByRole('dialog')).not.to.exist;
      expect(onSubmit).not.to.have.been.called;
    });


    it('should title an unnamed connection', function() {

      // when
      renderConnections([ { ...SELF_MANAGED_CONNECTION, name: '' } ], {
        targetElement: `${ NAME }[0].name`
      });

      // then
      expect(within(getDialog()).getByRole('heading').textContent).to.equal('Edit connection');
    });


    it('should not save an invalid connection', async function() {

      // given
      renderConnections([ SELF_MANAGED_CONNECTION ]);

      selectAction('Development', 'Edit');

      // when
      fill('Connection URL', 'localhost');

      // then
      const dialog = getDialog();

      await waitFor(() => expect(within(dialog).getByText('Connection URL must be a valid URL.')).to.exist);
      expect(within(dialog).getByRole('button', { name: 'Save' }).disabled).to.be.true;
    });


    it('should show fields of the selected target', function() {

      // given
      renderConnections([ SELF_MANAGED_CONNECTION ]);

      selectAction('Development', 'Edit');

      // assume
      expect(queryInput('Operate URL')).to.exist;
      expect(queryInput('Client ID')).not.to.exist;

      // when
      fireEvent.click(within(getDialog()).getByRole('radio', { name: 'Camunda 8 SaaS' }));

      // then
      expect(queryInput('Operate URL')).not.to.exist;
      expect(queryInput('Client ID')).to.exist;
    });


    it('should cancel', async function() {

      // given
      const { getValues } = renderConnections([ SAAS_CONNECTION ]);

      selectAction('Production', 'Edit');
      fill('Name', 'Changed');

      // when
      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

      // then
      expect(screen.queryByRole('dialog')).not.to.exist;
      expect(getValues()).to.eql([ SAAS_CONNECTION ]);
      expect(document.activeElement === screen.getByRole('button', { name: 'Options for Production' }), 'focus restored').to.be.true;
    });

  });


  describe('target element', function() {

    it('should open edit dialog of targeted connection', function() {

      // when
      renderConnections([ SAAS_CONNECTION, SELF_MANAGED_CONNECTION ], {
        targetElement: `${ NAME }[1].name`
      });

      // then
      expect(within(getDialog()).getByRole('heading').textContent).to.equal('Edit Development');
      expect(getInput('Name').value).to.equal('Development');
    });


    it('should return focus to targeted connection on close', function() {

      // given
      renderConnections([ SAAS_CONNECTION, SELF_MANAGED_CONNECTION ], {
        targetElement: `${ NAME }[1].name`
      });

      // when
      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

      // then
      expect(screen.queryByRole('dialog')).not.to.exist;
      expect(document.activeElement === screen.getByRole('button', { name: 'Options for Development' }), 'focus restored').to.be.true;
    });


    it('should provide element to scroll to', function() {

      // when
      renderConnections([ SAAS_CONNECTION, SELF_MANAGED_CONNECTION ], {
        targetElement: `${ NAME }[1].name`
      });

      // then
      expect(document.getElementById(`${ NAME }[1].name`).textContent).to.equal('Development');
    });


    it('should ignore unknown target', function() {

      // when
      renderConnections([ SAAS_CONNECTION ], { targetElement: `${ NAME }[3].name` });
      renderConnections([ SAAS_CONNECTION ], { targetElement: 'other[0].name' });

      // then
      expect(screen.queryByRole('dialog')).not.to.exist;
    });

  });


  describe('connection check', function() {

    it('should check edited connection', async function() {

      // given
      const connectionChecker = createConnectionChecker();

      renderConnections([ SAAS_CONNECTION ], { connectionChecker });

      // when
      selectAction('Production', 'Edit');

      // then
      expect(connectionChecker.current.updateConfig).to.have.been.calledOnceWith({ endpoint: SAAS_CONNECTION });
      expect(getStatus().querySelector('.cds--loading'), 'spinner').to.exist;
      expect(getStatus().textContent).to.contain('Connecting to the Camunda 8 instance…');

      // when
      fill('Connection URL', 'https://bru-3.zeebe.camunda.io/abc');

      // then
      await waitFor(() => expect(connectionChecker.current.updateConfig).to.have.been.calledWith({
        endpoint: { ...SAAS_CONNECTION, camundaCloudClusterUrl: 'https://bru-3.zeebe.camunda.io/abc' }
      }));
    });


    it('should check added connection', function() {

      // given
      const connectionChecker = createConnectionChecker();

      renderConnections([], { connectionChecker });

      // when
      fireEvent.click(screen.getByRole('button', { name: 'Add connection' }));

      // then
      expect(connectionChecker.current.stopChecking).to.have.been.called;
      expect(connectionChecker.current.updateConfig).not.to.have.been.called;
      expect(within(getStatus()).getByLabelText('error')).to.exist;
      expect(getStatus().textContent).to.equal('Connection configuration is invalid.');
    });


    it('should display success', async function() {

      // given
      const connectionChecker = createConnectionChecker();

      renderConnections([ SAAS_CONNECTION ], { connectionChecker });

      selectAction('Production', 'Edit');

      // when
      connectionChecker.emit({ success: true });

      // then
      await waitFor(() => expect(within(getStatus()).getByLabelText('success')).to.exist);
      expect(getStatus().textContent).to.equal('Connected');
    });


    it('should display result above the fields', function() {

      // given
      renderConnections([ SAAS_CONNECTION ]);

      // when
      selectAction('Production', 'Edit');

      // then
      const elements = Array.from(getDialog().querySelectorAll('[role="status"], input'));

      expect(elements.indexOf(getStatus()), 'status precedes fields').to.equal(0);
    });


    it('should display error', async function() {

      // given
      const connectionChecker = createConnectionChecker();

      renderConnections([ SELF_MANAGED_CONNECTION ], { connectionChecker });

      selectAction('Development', 'Edit');

      // when
      connectionChecker.emit({ success: false, reason: 'CONTACT_POINT_UNAVAILABLE' });

      // then
      await waitFor(() => expect(within(getStatus()).getByLabelText('error')).to.exist);
      expect(getStatus().textContent).to.contain('Cannot connect to the Camunda 8 instance.');
      expect(screen.queryByTestId('c8run-download-link')).not.to.exist;
    });


    it('should display Camunda 8 Run hints', async function() {

      // given
      const connectionChecker = createConnectionChecker();

      renderConnections([ C8RUN_CONNECTION ], { connectionChecker });

      selectAction('c8run (local)', 'Edit');

      // when
      connectionChecker.emit({ success: false, reason: 'CONTACT_POINT_UNAVAILABLE' });

      // then
      await waitFor(() => expect(within(getStatus()).getByLabelText('error')).to.exist);
      expect(getStatus().textContent).to.contain('Cannot connect to your local Camunda 8 instance');
      expect(screen.getByTestId('c8run-download-link').getAttribute('href')).to.equal(C8RUN_DOWNLOAD_URL);
      expect(screen.getByTestId('c8run-troubleshoot-link').getAttribute('href')).to.equal(C8RUN_TROUBLESHOOTING_URL);
    });


    it('should not check without dialog', function() {

      // given
      const connectionChecker = createConnectionChecker();

      // when
      renderConnections([ SAAS_CONNECTION ], { connectionChecker });

      // then
      expect(connectionChecker.current.on).not.to.have.been.called;
      expect(connectionChecker.current.updateConfig).not.to.have.been.called;
    });


    it('should stop checking on close', function() {

      // given
      const connectionChecker = createConnectionChecker();

      renderConnections([ SAAS_CONNECTION ], { connectionChecker });

      selectAction('Production', 'Edit');

      connectionChecker.current.stopChecking.resetHistory();

      // when
      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

      // then
      expect(connectionChecker.current.off).to.have.been.calledWith('connectionCheck');
      expect(connectionChecker.current.stopChecking).to.have.been.calledOnce;
    });

  });

});


// helpers //////////

function createConnectionChecker() {
  const listeners = [];

  const current = {
    on: sinon.spy((_, listener) => listeners.push(listener)),
    off: sinon.spy(),
    updateConfig: sinon.spy(),
    stopChecking: sinon.spy()
  };

  return {
    current,
    emit: (result) => listeners.forEach(listener => listener(result))
  };
}

function renderConnections(connections, options = {}) {
  const {
    targetElement = null,
    connectionChecker = createConnectionChecker()
  } = options;

  let current;

  const onSubmit = sinon.spy();

  const schema = {
    connectionManagerPlugin: {
      id: 'connectionManagerPlugin',
      properties: {
        [ NAME ]: {
          type: 'custom',
          component: (props) => ConnectionManagerSettingsComponent({ ...props, connectionChecker })
        }
      }
    }
  };

  const result = render(<Formik initialValues={ { connectionManagerPlugin: { c8connections: connections } } } onSubmit={ onSubmit }>
    { ({ values }) => {
      current = values.connectionManagerPlugin.c8connections;

      return <SettingsForm schema={ schema } onChange={ () => {} } targetElement={ targetElement } />;
    } }
  </Formik>);

  return { ...result, getValues: () => current, onSubmit };
}

function getItems() {
  return screen.getAllByRole('listitem').map(item => [
    item.querySelector('.settings-list-item__name').textContent,
    item.querySelector('.settings-list-item__description')?.textContent
  ]);
}

function getDialog() {
  return screen.getByRole('dialog');
}

function getStatus() {
  return within(getDialog()).getByRole('status');
}

function queryInput(label) {
  return within(getDialog()).queryByLabelText(new RegExp(`^${ label }`));
}

function getInput(label) {
  return within(getDialog()).getByLabelText(new RegExp(`^${ label }`));
}

function fill(label, value) {
  const input = getInput(label);

  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

function selectAction(label, action) {
  fireEvent.click(screen.getByRole('button', { name: `Options for ${ label }` }));
  fireEvent.click(screen.getByRole('menuitem', { name: action }));
}
