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

import { Formik } from 'formik';

import { JSONInput } from '..';


describe('<JSONInput>', function() {

  it('should render', function() {
    createJSONInput();
  });


  it('should show error', function() {

    // when
    const { container } = createJSONInput({
      fieldMeta: {
        error: 'foo',
        touched: true
      }
    });

    const formControl = container.querySelector('.custom-control-codemirror');

    // then
    expect(formControl).to.exist;
    expect(formControl.classList.contains('is-invalid')).to.be.true;
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
    createJSONInput({
      field,
      fieldError,
      fieldMeta
    });

    // then
    expect(fieldError).to.have.been.calledOnceWithExactly(fieldMeta, field.name);
  });
});


// helpers ///////////////////

function createJSONInput(options = {}) {
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

  return render(
    <Formik>
      <JSONInput
        { ...props }
        field={ field || {} }
        form={ form }
      />
    </Formik>
  );
}