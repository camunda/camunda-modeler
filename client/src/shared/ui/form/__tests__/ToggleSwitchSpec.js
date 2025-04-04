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

import { ToggleSwitch } from '..';


describe('<ToggleSwitch>', function() {

  it('should render', function() {
    createToggleSwitch();
  });


  it('should be checked', function() {

    // given
    const wrapper = createToggleSwitch({
      field:
        {
          name: 'foo',
          value: true
        }
    });

    const input = wrapper.find('input');

    // then
    expect(input.prop('checked')).to.be.true;
  });


  it('should not be checked', function() {

    // given
    const wrapper = createToggleSwitch({
      field:
        {
          name: 'foo',
          value: false
        }
    });

    const input = wrapper.find('input');

    // then
    expect(input.prop('checked')).to.be.false;
  });

});


// helpers ///////////////////

const DEFAULT_FIELD = {
  name: 'foo',
  value: true
};

function createToggleSwitch(props = {}) {
  const {
    field = DEFAULT_FIELD
  } = props;

  return shallow(<ToggleSwitch
    field={ field }
  />);
}