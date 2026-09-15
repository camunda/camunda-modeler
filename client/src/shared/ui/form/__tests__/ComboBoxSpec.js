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

import { fireEvent, render } from '@testing-library/react';

import { ComboBox } from '..';


describe('<ComboBox>', function() {

  it('should enter a custom value', function() {

    // given
    const onChange = sinon.spy();
    const { getByRole } = createComboBox({ onChange });

    // when
    fireEvent.change(getByRole('combobox'), { target: { value: 'custom' } });

    // then
    expect(onChange).to.have.been.calledOnceWithExactly('custom');
  });


  it('should filter and select an option', function() {

    // given
    const onChange = sinon.spy();
    const { getByRole, queryByRole } = createComboBox({ onChange });

    // when
    fireEvent.change(getByRole('combobox'), { target: { value: 'PASS' } });
    fireEvent.click(getByRole('option', { name: 'camunda.secrets.PASSWORD' }));

    // then
    expect(queryByRole('option', { name: 'camunda.secrets.API_KEY' })).not.to.exist;
    expect(onChange).to.have.been.calledWith('camunda.secrets.PASSWORD');
  });


  it('should show all options for an existing value', function() {

    // given
    const { getAllByRole, getByRole } = createComboBox({
      value: 'camunda.secrets.PASSWORD'
    });

    // when
    fireEvent.focus(getByRole('combobox'));

    // then
    expect(getAllByRole('option')).to.have.length(2);
  });


  it('should select an option with the keyboard', function() {

    // given
    const onChange = sinon.spy();
    const { getByRole } = createComboBox({ onChange });
    const input = getByRole('combobox');

    // when
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    // then
    expect(onChange).to.have.been.calledOnceWithExactly('camunda.secrets.API_KEY');
  });
});


// helpers ///////////////

function createComboBox(props = {}) {
  return render(
    <ComboBox
      id="secret"
      options={ [ 'camunda.secrets.API_KEY', 'camunda.secrets.PASSWORD' ] }
      onChange={ () => {} }
      { ...props }
    />
  );
}