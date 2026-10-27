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

import { Select } from '..';


describe('<Select>', function() {

  it('should render', function() {
    createSelect();
  });


  it('should show error', function() {

    // when
    const { getByRole, getByText } = createSelect({
      field: {
        name: 'foo'
      },
      fieldMeta: {
        error: 'foo error',
        touched: true
      },
    });

    // then
    const select = getByRole('combobox');

    expect(select.getAttribute('aria-invalid')).to.eql('true');
    expect(document.getElementById(select.getAttribute('aria-errormessage'))).to.equal(getByText('foo error'));
  });


  it('should pass field name to the error callback', function() {

    // given
    const fieldError = sinon.spy();
    const field = {
      name: 'name'
    };
    const fieldMeta = {
      error: 'foo',
      touched: true
    };

    // when
    createSelect({
      field,
      fieldError,
      fieldMeta
    });

    // then
    expect(fieldError).to.have.been.calledOnceWithExactly(fieldMeta, field.name);
  });


  it('should ignore a value that matches no option', function() {

    // given
    const onChange = sinon.spy();

    const { container } = render(
      <form>
        <Select
          field={ { name: 'foo' } }
          form={ { getFieldMeta: () => ({}) } }
          options={ [ { value: 'bar', label: 'Bar' } ] }
          value="bar"
          onChange={ onChange }
        />
      </form>
    );

    // when
    // Radix fires this on its hidden native select when the value changes before
    // its native options exist, e.g. while the settings dialog loads its values.
    // The empty value matches no option and must not reach `onChange`.
    fireEvent.change(container.querySelector('select'), { target: { value: '' } });

    // then
    expect(onChange).not.to.have.been.called;
  });
});


// helpers ///////////////

function createSelect(options = {}) {
  const {
    field,
    fieldMeta,
    form: mockForm,
    ...props
  } = options;

  const form = mockForm || {
    getFieldMeta: () => {
      return fieldMeta || {};
    }
  };

  return render(<Select
    { ...props }
    field={ options.field || {} }
    form={ form }
    options={ options.options || [] }
  />);
}
