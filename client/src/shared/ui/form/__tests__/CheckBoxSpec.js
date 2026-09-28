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

import { CheckBox } from '..';


describe('<CheckBox>', function() {

  it('should render', function() {
    createCheckBox();
  });


  it('should show error', function() {

    // when
    const { getByRole, getByText } = createCheckBox({
      field: {
        name: 'foo'
      },
      fieldMeta: {
        error: 'foo error',
        touched: true
      },
    });

    // then
    const checkbox = getByRole('checkbox');

    expect(checkbox.getAttribute('aria-invalid')).to.eql('true');
    expect(document.getElementById(checkbox.getAttribute('aria-errormessage'))).to.equal(getByText('foo error'));
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
    createCheckBox({
      field,
      fieldError,
      fieldMeta
    });

    // then
    expect(fieldError).to.have.been.calledOnceWithExactly(fieldMeta, field.name);
  });
});


// helpers ///////////////////

function createCheckBox(options = {}) {
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

  return render(<CheckBox
    { ...props }
    field={ field || {} }
    form={ form }
  />);
}