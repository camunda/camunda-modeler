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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Field } from 'formik';

import { SettingsList, SettingsListDialog, SettingsListItem } from '../SettingsList';


describe('<SettingsList>', function() {

  it('should render items', function() {

    // when
    render(<SettingsList>
      <SettingsListItem name="A" description="https://a.example" />
      <SettingsListItem name="B" description="https://b.example" />
    </SettingsList>);

    // then
    const items = screen.getAllByRole('listitem');
    expect(items).to.have.length(2);
    expect(items[0].textContent).to.contain('A');
    expect(items[1].textContent).to.contain('B');
  });


  it('should render actions', function() {

    // when
    render(<SettingsList>
      <SettingsListItem name="A" actions={ <button type="button">Remove</button> } />
    </SettingsList>);

    // then
    expect(screen.getByRole('button', { name: 'Remove' })).to.exist;
  });


  it('should mark an invalid entry', function() {

    // when
    const { container } = render(<SettingsList>
      <SettingsListItem name="A" description="Invalid entry" invalid />
    </SettingsList>);

    // then
    expect(container.querySelector('.settings-list-item__description--error')).to.exist;
  });

});


describe('<SettingsListDialog>', function() {

  it('should add (valid form)', async function() {

    // given
    const onSubmit = sinon.spy();
    renderDialog({ adding: true, onSubmit });

    // when
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // then
    await waitFor(() => expect(onSubmit).to.have.been.calledOnceWith({ name: 'A' }));
  });


  it('should disable submit while invalid', async function() {

    // given
    renderDialog({ adding: true, validate: () => ({ name: 'required' }) });

    // then
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' }).disabled).to.be.true);
  });


  it('should disable submit when editing unchanged', async function() {

    // given
    renderDialog({ adding: false, initialValues: { name: 'A' } });

    // then
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' }).disabled).to.be.true);
  });


  function renderDialog({ adding = true, initialValues = { name: '' }, validate, onSubmit = () => {} } = {}) {
    return render(<SettingsListDialog
      title={ adding ? 'Add entry' : 'Edit entry' }
      adding={ adding }
      initialValues={ initialValues }
      validate={ validate }
      onSubmit={ onSubmit }
      onClose={ () => {} }
    >
      <Field name="name" />
    </SettingsListDialog>);
  }

});
