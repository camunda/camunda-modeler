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

import { render } from '@testing-library/react';

import { TextInput } from '..';


describe('<TextInput>', function() {

  it('should render', function() {
    createTextInput();
  });


  it('should show error', function() {

    // when
    const { container } = createTextInput({
      fieldMeta: {
        error: 'foo',
        touched: true
      }
    });

    const formControl = container.querySelector('.form-control');

    // then
    expect(formControl).to.exist;
    expect(formControl.classList.contains('is-invalid')).to.be.true;
  });


  it('should pass field name to the error callback', function() {

    // given
    const fieldError = sinon.spy();
    const field = {
      name: 'name',
      value: '',
      onChange: () => {}
    };
    const fieldMeta = {
      error: 'foo',
      touched: true
    };

    // when
    createTextInput({
      field,
      fieldError,
      fieldMeta
    });

    // then
    expect(fieldError).to.have.been.calledOnceWithExactly(fieldMeta, field.name);
  });
});


// helpers ///////////////////

function createTextInput(options = {}) {
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

  const defaultField = {
    name: 'test',
    value: '',
    onChange: () => {}
  };

  return render(<TextInput
    { ...props }
    field={ { ...defaultField, ...field } }
    form={ form }
  />);
}