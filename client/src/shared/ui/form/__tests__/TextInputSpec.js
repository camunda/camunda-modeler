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

import { shallow } from 'enzyme';

import { TextInput } from '..';


describe('<TextInput>', function() {

  it('should render', function() {
    createTextInput();
  });


  it('should show error', function() {

    // when
    const wrapper = createTextInput({
      fieldMeta: {
        error: 'foo',
        touched: true
      }
    });

    const formControl = wrapper.find('.form-control');

    // then
    expect(formControl).to.have.length(1);
    expect(formControl.hasClass('is-invalid')).to.be.true;
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

  return shallow(<TextInput
    { ...props }
    field={ field || {} }
    form={ form }
  />);
}