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

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { Radio } from '..';


describe('<Radio>', function() {

  it('should render', function() {
    createRadio();
  });


  it('should check option', function() {

    // when
    const { getAllByRole } = createRadio({
      field:{
        onChange:() => {},
      },
      fieldMeta: {
        value: 'foo'
      },
      values: [
        {
          value: 'foo',
          label: 'bar'
        }
      ]
    });

    const radios = getAllByRole('radio');

    // then
    expect(radios).to.have.length(1);
    expect(radios[0].getAttribute('aria-checked')).to.eql('true');
  });


  it('should apply field\'s onChange callback', async function() {

    // given
    const onChange = sinon.spy();
    const { getByRole } = createRadio({
      field: {
        onChange
      },
      values: [
        {
          value: 'foo',
          label: 'bar'
        }
      ]
    });
    const input = getByRole('radio');

    // when
    await userEvent.click(input);

    // then
    expect(onChange).to.have.been.calledOnce;
  });


  it('should show error', function() {

    // when
    const { getByRole, getByText } = createRadio({
      field: {
        name: 'foo'
      },
      fieldMeta: {
        error: 'foo error',
        touched: true
      },
    });

    // then
    const group = getByRole('radiogroup');

    expect(group.getAttribute('aria-invalid')).to.eql('true');
    expect(document.getElementById(group.getAttribute('aria-errormessage'))).to.equal(getByText('foo error'));
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
    createRadio({
      field,
      fieldError,
      fieldMeta
    });

    // then
    expect(fieldError).to.have.been.calledOnceWithExactly(fieldMeta, field.name);
  });
});


// helpers ///////////////

function createRadio(options = {}) {
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

  return render(<Radio
    { ...props }
    field={ options.field || {} }
    form={ form }
    values={ options.values || [] }
  />);
}
