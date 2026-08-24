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

import CredentialModal from '../CredentialModal';
import { getInitialFieldValues } from '../credentialForm';

const OPTIONAL_FIELD = {
  id: 'token',
  label: 'API token',
  type: 'String',
  optional: true,
  binding: { type: 'property', name: 'token' }
};

const REQUIRED_FIELD = {
  id: 'token',
  label: 'API token',
  type: 'String',
  constraints: { notEmpty: true },
  binding: { type: 'property', name: 'token' }
};

const SECRET_FIELD = {
  id: 'apiKey',
  label: 'API key',
  type: 'String',
  secret: true,
  binding: { type: 'property', name: 'apiKey' }
};

const DESCRIBED_FIELD = {
  id: 'token',
  label: 'API token',
  type: 'String',
  optional: true,
  description: 'See <a href="https://docs.camunda.io">docs</a>',
  binding: { type: 'property', name: 'token' }
};


describe('<CredentialModal>', function() {

  it('should render the create title', function() {

    // when
    const { getByText } = renderModal({ mode: 'create' });

    // then
    expect(getByText('Add credential')).to.exist;
  });


  it('should render the edit title', function() {

    // when
    const { getByText } = renderModal({ mode: 'edit', credentialName: 'MY_CRED' });

    // then
    expect(getByText('Edit credential')).to.exist;
  });


  it('should render the upgrade title', function() {

    // when
    const { getByText } = renderModal({ mode: 'upgrade', credentialName: 'MY_CRED' });

    // then
    expect(getByText('Upgrade credential')).to.exist;
  });


  it('should render the create submit label', function() {

    // when
    const { getByRole } = renderModal({ mode: 'create' });

    // then
    expect(getByRole('button', { name: 'Create and select' })).to.exist;
  });


  it('should render the edit submit label', function() {

    // when
    const { getByRole } = renderModal({ mode: 'edit', credentialName: 'MY_CRED' });

    // then
    expect(getByRole('button', { name: 'Save' })).to.exist;
  });


  it('should allow submit when the credential name is empty', function() {

    // given
    const { getByLabelText, getByRole } = renderModal({ mode: 'create', displayName: '' });

    // when
    fireEvent.change(getByLabelText('Credential ID *'), { target: { value: 'MY_CRED' } });

    // then
    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.false;
  });


  it('should enable submit when the name is set', function() {

    // when
    const { getByRole } = renderModal({ mode: 'create', displayName: 'My cred' });

    // then
    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.false;
  });


  it('should disable submit while loading', function() {

    // when
    const { getByRole, queryByLabelText } = renderModal({
      mode: 'edit',
      displayName: 'My cred',
      credentialName: 'MY_CRED',
      loading: true
    });

    // then
    expect(getByRole('status', { name: 'Loading credential' })).to.exist;
    expect(queryByLabelText('Credential name')).not.to.exist;
    expect(queryByLabelText('Credential ID *')).not.to.exist;
    expect(queryByLabelText('API token')).not.to.exist;
    expect(getByRole('button', { name: 'Save' }).disabled).to.be.true;
  });


  it('should render loaded conditional fields without showing defaults', function() {

    // given
    const conditionalTemplate = template({
      id: 'type',
      label: 'Type',
      type: 'Dropdown',
      choices: [
        { name: 'Default', value: 'default' },
        { name: 'Custom', value: 'custom' }
      ],
      value: 'default',
      binding: { type: 'property', name: 'type' }
    });
    conditionalTemplate.properties.push({
      id: 'customValue',
      label: 'Custom value',
      type: 'String',
      condition: { property: 'type', equals: 'custom' },
      binding: { type: 'property', name: 'customValue' }
    });

    const { getByLabelText, queryByLabelText, rerender } = renderModal({
      mode: 'edit',
      credentialName: 'MY_CRED',
      configurationTemplate: conditionalTemplate,
      initialValues: { type: 'default', customValue: '' },
      loading: true
    });

    // when
    rerender(<CredentialModal
      { ...modalProps({
        mode: 'edit',
        credentialName: 'MY_CRED',
        configurationTemplate: conditionalTemplate,
        initialValues: { type: 'custom', customValue: 'loaded' },
        loading: false
      }) }
    />);

    // then
    expect(queryByLabelText('Loading credential')).not.to.exist;
    expect(getByLabelText('Type').value).to.equal('custom');
    expect(getByLabelText('Custom value').value).to.equal('loaded');
  });

  [
    [ 'show an isEmpty field for an empty value', true, '', true ],
    [ 'hide an isEmpty field for a filled value', true, 'configured', false ],
    [ 'hide an isEmpty false field for an empty value', false, '', false ],
    [ 'show an isEmpty false field for a filled value', false, 'configured', true ]
  ].forEach(([ testName, isEmpty, sourceValue, visible ]) => {

    it(`should ${ testName }`, function() {

      // given
      const configurationTemplate = conditionalTemplate({
        property: 'source',
        isEmpty
      });

      // when
      const { queryByLabelText } = renderModal({
        configurationTemplate,
        initialValues: {
          source: sourceValue,
          conditional: ''
        }
      });

      // then
      expect(!!queryByLabelText('Conditional field')).to.equal(visible);
    });
  });

  it('should evaluate isEmpty inside allMatch', function() {

    // given
    const configurationTemplate = conditionalTemplate({
      allMatch: [
        { property: 'source', isEmpty: false },
        { property: 'type', equals: 'custom' }
      ]
    });

    // when
    const { getByLabelText } = renderModal({
      configurationTemplate,
      initialValues: {
        source: 'configured',
        type: 'custom',
        conditional: ''
      }
    });

    // then
    expect(getByLabelText('Conditional field')).to.exist;
  });

  it('should render declared groups and a trailing default group', function() {

    // given
    const configurationTemplate = {
      ...template(),
      groups: [
        { id: 'authentication', label: 'Authentication' },
        { id: 'configuration', label: 'Configuration' }
      ],
      properties: [
        { ...OPTIONAL_FIELD, id: 'auth', label: 'Auth', group: 'authentication' },
        { ...OPTIONAL_FIELD, id: 'region', label: 'Region', group: 'configuration' },
        { ...OPTIONAL_FIELD, id: 'other', label: 'Other', group: 'undeclared' }
      ]
    };

    // when
    const { getAllByRole, getByRole } = renderModal({ configurationTemplate });

    // then
    const headings = getAllByRole('heading', { level: 3 });

    expect(headings.map(heading => heading.textContent)).to.eql([
      'Authentication',
      'Configuration',
      'Credential properties'
    ]);
    expect(headings[0].closest('section').contains(getByRole('textbox', { name: 'Auth' }))).to.be.true;
    expect(headings[2].closest('section').contains(getByRole('textbox', { name: 'Other' }))).to.be.true;
  });


  it('should normalize typed defaults for form controls', function() {

    // given
    const configurationTemplate = {
      ...template(),
      properties: [
        { ...OPTIONAL_FIELD, id: 'number', label: 'Number', type: 'Number', value: 42 },
        { ...OPTIONAL_FIELD, id: 'boolean', label: 'Boolean', type: 'Boolean', value: false }
      ]
    };

    // when
    const { getByLabelText } = renderModal({ configurationTemplate });

    // then
    expect(getByLabelText('Number').value).to.equal('42');
    expect(getByLabelText('Boolean').value).to.equal('false');
  });


  it('should disable submit when a required field is empty', function() {

    // when
    const { getByLabelText, getByRole, getByText } = renderModal({
      mode: 'create',
      displayName: 'My cred',
      configurationTemplate: template(REQUIRED_FIELD)
    });

    // then
    const input = getByLabelText('API token *');

    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.true;
    expect(getByText('API token must not be empty.')).to.exist;
    expect(input.classList.contains('is-invalid')).to.be.true;
    expect(input.closest('.form-group').classList.contains('has-error')).to.be.true;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
  });


  it('should show an error when a required secret field is empty', function() {

    // when
    const { getByLabelText, getByRole, getByText } = renderModal({
      mode: 'create',
      displayName: 'My cred',
      configurationTemplate: template({
        ...SECRET_FIELD,
        constraints: { notEmpty: true }
      }),
      initialValues: { apiKey: '' }
    });

    // then
    const input = getByLabelText('API key *');

    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.true;
    expect(getByText('API key must not be empty.')).to.exist;
    expect(input.classList.contains('is-invalid')).to.be.true;
    expect(input.closest('.form-group').classList.contains('has-error')).to.be.true;
  });


  it('should allow clearing an optional dropdown', function() {

    // given
    const configurationTemplate = template({
      id: 'type',
      label: 'Type',
      type: 'Dropdown',
      choices: [ { name: 'Custom', value: 'custom' } ],
      optional: true,
      value: 'custom',
      binding: { type: 'property', name: 'type' }
    });
    const { getByLabelText } = renderModal({ configurationTemplate });

    // when
    fireEvent.change(getByLabelText('Type'), { target: { value: '' } });

    // then
    expect(getByLabelText('Type').value).to.equal('');
  });


  it('should not allow clearing a non-optional dropdown', function() {

    // when
    const { getByLabelText } = renderModal({
      configurationTemplate: template({
        id: 'type',
        label: 'Type',
        type: 'Dropdown',
        choices: [ { name: 'Custom', value: 'custom' } ],
        value: 'custom',
        binding: { type: 'property', name: 'type' }
      })
    });

    // then
    expect([ ...getByLabelText('Type').options ].map(option => option.value)).to.eql([ 'custom' ]);
  });


  [
    [ { minLength: 4 }, 'abc', 'API token must be at least 4 characters.' ],
    [ { maxLength: 2 }, 'abc', 'API token cannot exceed 2 characters.' ],
    [ { pattern: { value: '^A+$', message: 'Use only A.' } }, 'ABC', 'API token Use only A.' ]
  ].forEach(([ constraints, value, message ]) => {

    it(`should validate ${ Object.keys(constraints)[0] }`, function() {

      // given
      const configurationTemplate = template({
        ...OPTIONAL_FIELD,
        constraints
      });
      const { getByLabelText, getByRole, getByText } = renderModal({ configurationTemplate });

      // when
      fireEvent.change(getByLabelText('API token'), { target: { value } });

      // then
      expect(getByText(message)).to.exist;
      expect(getByLabelText('API token').classList.contains('is-invalid')).to.be.true;
      expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.true;
    });
  });


  it('should call onSubmit with the entered credential', async function() {

    // given
    const onSubmit = sinon.spy();

    const { getByRole } = renderModal({ mode: 'create', displayName: 'My cred', onSubmit });

    // when
    fireEvent.click(getByRole('button', { name: 'Create and select' }));

    // then
    await waitFor(() => {
      expect(onSubmit).to.have.been.calledOnce;
    });

    expect(onSubmit.firstCall.args[0]).to.include({
      displayName: 'My cred',
      name: 'MY_CRED'
    });
  });


  it('should render the display name as editable in create mode', function() {

    // when
    const { baseElement } = renderModal({ mode: 'create' });

    // then
    expect(baseElement.querySelector('#credential-display-name').readOnly).to.be.false;
  });


  it('should render the display name as editable in edit mode', function() {

    // when
    const { baseElement } = renderModal({
      mode: 'edit',
      displayName: 'My cred',
      credentialName: 'MY_CRED'
    });

    // then
    expect(baseElement.querySelector('#credential-display-name').readOnly).to.be.false;
  });


  it('should suggest the credential ID from the display name', function() {

    // when
    const { getByLabelText } = renderModal({
      mode: 'create',
      displayName: 'My Slack workspace'
    });

    // then
    expect(getByLabelText('Credential ID *').value).to.equal('MY_SLACK_WORKSPACE');
  });


  it('should suggest a unique credential name and ID', function() {

    // when
    const { getByLabelText } = renderModal({
      mode: 'create',
      displayName: 'Name ',
      existingCredentials: [
        {
          name: 'NAME',
          metadata: { displayName: 'Name' }
        },
        {
          name: 'NAME_1',
          metadata: { displayName: 'Name 1' }
        }
      ]
    });

    // then
    expect(getByLabelText('Credential name').value).to.equal('Name 2');
    expect(getByLabelText('Credential ID *').value).to.equal('NAME_2');
  });


  it('should show a required ID error when the display name is cleared', function() {

    // given
    const { getByLabelText, getByRole, getByText } = renderModal({
      mode: 'create',
      displayName: 'My Slack workspace'
    });

    // when
    fireEvent.change(getByLabelText('Credential name'), { target: { value: '' } });

    // then
    const input = getByLabelText('Credential ID *');

    expect(input.value).to.equal('');
    expect(input.classList.contains('is-invalid')).to.be.true;
    expect(getByText('Credential ID is required.')).to.exist;
    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.true;
  });


  it('should submit an overridden credential ID', async function() {

    // given
    const onSubmit = sinon.spy();
    const { getByLabelText, getByRole } = renderModal({
      mode: 'create',
      displayName: 'My Slack workspace',
      onSubmit
    });

    // when
    fireEvent.change(getByLabelText('Credential ID *'), { target: { value: 'SLACK_PROD' } });
    fireEvent.click(getByRole('button', { name: 'Create and select' }));

    // then
    await waitFor(() => {
      expect(onSubmit).to.have.been.calledWithMatch({ name: 'SLACK_PROD' });
    });
  });


  it('should not replace an overridden credential ID when the display name changes', function() {

    // given
    const { getByLabelText } = renderModal({
      mode: 'create',
      displayName: 'My Slack workspace'
    });

    fireEvent.change(getByLabelText('Credential ID *'), { target: { value: 'SLACK_PROD' } });

    // when
    fireEvent.change(getByLabelText('Credential name'), { target: { value: 'Renamed credential' } });

    // then
    expect(getByLabelText('Credential ID *').value).to.equal('SLACK_PROD');
  });


  it('should render the credential ID as read-only in edit mode', function() {

    // when
    const { getByLabelText } = renderModal({
      mode: 'edit',
      displayName: 'My cred',
      credentialName: 'MY_CRED'
    });

    // then
    expect(getByLabelText('Credential ID *').readOnly).to.be.true;
  });


  it('should disable submit when the credential ID is invalid', function() {

    // given
    const { getByLabelText, getByRole, getByText } = renderModal({
      mode: 'create',
      displayName: 'My cred'
    });

    // when
    fireEvent.change(getByLabelText('Credential ID *'), { target: { value: '123-invalid' } });

    // then
    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.true;
    expect(getByText(/must contain only letters, numbers, and underscores/)).to.exist;
  });


  it('should disable submit when the credential name already exists', function() {

    // given
    const { getByLabelText, getByRole, getByText } = renderModal({
      mode: 'create',
      displayName: 'My cred',
      existingCredentials: [ {
        name: 'OTHER_ID',
        metadata: { displayName: 'My cred' }
      } ]
    });

    // when
    fireEvent.change(getByLabelText('Credential name'), { target: { value: 'My cred' } });

    // then
    const input = getByLabelText('Credential name');

    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.true;
    expect(getByText('A credential with this name already exists. Choose a different name.')).to.exist;
    expect(input.classList.contains('is-invalid')).to.be.true;
    expect(input.closest('.form-group').classList.contains('has-error')).to.be.true;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
  });


  it('should disable submit when the credential ID already exists', function() {

    // given
    const { getByLabelText, getByRole, getByText } = renderModal({
      mode: 'create',
      displayName: 'My cred',
      existingCredentials: [ {
        name: 'MY_CRED',
        metadata: { displayName: 'Other credential' }
      } ]
    });

    // when
    fireEvent.change(getByLabelText('Credential ID *'), { target: { value: 'MY_CRED' } });

    // then
    const input = getByLabelText('Credential ID *');

    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.true;
    expect(getByText('A credential with this ID already exists. Choose a different ID.')).to.exist;
    expect(input.classList.contains('is-invalid')).to.be.true;
    expect(input.closest('.form-group').classList.contains('has-error')).to.be.true;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
  });


  it('should allow saving the credential being edited', function() {

    // when
    const { getByRole, queryByText } = renderModal({
      mode: 'edit',
      displayName: 'My cred',
      credentialName: 'MY_CRED',
      existingCredentials: [ {
        name: 'MY_CRED',
        metadata: { displayName: 'My cred' }
      } ]
    });

    // then
    expect(getByRole('button', { name: 'Save' }).disabled).to.be.false;
    expect(queryByText(/already exists/)).not.to.exist;
  });


  it('should render a template field label', function() {

    // when
    const { getByText } = renderModal({ mode: 'create' });

    // then
    expect(getByText('API token')).to.exist;
  });


  it('should render the credential reference preview', function() {

    // when
    const { getByText } = renderModal({ mode: 'create', displayName: 'My cred' });

    // then
    expect(getByText(/=camunda\.vars\.env\.MY_CRED/)).to.exist;
  });


  it('should render a secret field placeholder', function() {

    // when
    const { getByPlaceholderText } = renderModal({
      mode: 'create',
      configurationTemplate: template(SECRET_FIELD)
    });

    // then
    expect(getByPlaceholderText('camunda.secrets.SECRET_NAME')).to.exist;
  });


  it('should show a non-blocking error for a missing secret reference', function() {

    // when
    const { getByLabelText, getByRole, getByText } = renderModal({
      mode: 'create',
      displayName: 'My cred',
      configurationTemplate: template(SECRET_FIELD),
      initialValues: { apiKey: 'camunda.secrets.MISSING' },
      secretReferences: []
    });

    // then
    const input = getByLabelText('API key');

    expect(getByText(/was not found on this cluster/)).to.exist;
    expect(input.classList.contains('is-invalid')).to.be.true;
    expect(input.closest('.form-group').classList.contains('has-error')).to.be.true;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
    expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.false;
  });


  it('should not warn when the secret reference exists', function() {

    // when
    const { queryByText } = renderModal({
      mode: 'create',
      configurationTemplate: template(SECRET_FIELD),
      initialValues: { apiKey: 'camunda.secrets.PRESENT' },
      secretReferences: [ 'camunda.secrets.PRESENT' ]
    });

    // then
    expect(queryByText(/was not found on this cluster/)).not.to.exist;
  });


  it('should render a description link', function() {

    // when
    const { getByRole } = renderModal({
      mode: 'create',
      configurationTemplate: template(DESCRIBED_FIELD)
    });

    // then
    expect(getByRole('link', { name: 'docs' }).href).to.eql('https://docs.camunda.io/');
  });


  it('should call onClose when cancel is clicked', function() {

    // given
    const onClose = sinon.spy();

    const { getByRole } = renderModal({ mode: 'create', onClose });

    // when
    fireEvent.click(getByRole('button', { name: 'Cancel' }));

    // then
    expect(onClose).to.have.been.calledOnce;
  });

});


// helpers //////////

function template(field = OPTIONAL_FIELD) {
  return {
    id: 'io.camunda:test-credential:1',
    version: 1,
    properties: [ field ]
  };
}

function conditionalTemplate(condition) {
  return {
    id: 'io.camunda:test-credential:1',
    version: 1,
    properties: [
      {
        id: 'source',
        label: 'Source',
        type: 'String',
        binding: { type: 'property', name: 'source' }
      },
      {
        id: 'type',
        label: 'Type',
        type: 'String',
        binding: { type: 'property', name: 'type' }
      },
      {
        id: 'conditional',
        label: 'Conditional field',
        type: 'String',
        condition,
        binding: { type: 'property', name: 'conditional' }
      }
    ]
  };
}

function renderModal(props = {}) {
  return render(<CredentialModal { ...modalProps(props) } />);
}

function modalProps(props = {}) {
  const configurationTemplate = props.configurationTemplate || template();

  return {
    mode: 'create',
    configurationTemplate,
    existingCredentials: [],
    initialValues: getInitialFieldValues(configurationTemplate.properties),
    loading: false,
    secretReferences: null,
    displayName: '',
    credentialName: '',
    onSubmit: sinon.spy(),
    onClose: sinon.spy(),
    ...props
  };
}
