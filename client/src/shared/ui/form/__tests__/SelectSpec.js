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

import { Select } from '..';


describe('<Select>', function() {

  it('should render', function() {
    createSelect();
  });


  it('should show error', function() {

    // when
    const { container } = createSelect({
      fieldMeta: {
        error: 'foo',
        touched: true
      },
    });

    // then
    const invalidFeedback = container.querySelector('.form-group>.custom-control>.invalid-feedback');
    expect(invalidFeedback).to.exist;
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
