/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

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

});


// helpers ///////////////////

function createTextInput(options = {}) {

  const form = options.form || {
    getFieldMeta: () => {
      return options.fieldMeta || {};
    }
  };

  return shallow(<TextInput
    field={ options.field || {} }
    form={ form }
  />);
}