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


  it('should enable option', function() {

    // given
    const wrapper = createToggleSwitch({
      field:
        {
          value: true
        }
    });

    const input = wrapper.find('input');

    // then
    expect(input.prop('value')).to.be.true;
    expect(input.prop('defaultChecked')).to.be.true;
  });

});


// helpers ///////////////////

function createToggleSwitch(options = {}) {

  return shallow(<ToggleSwitch
    field={ options.field || {} }
  />);

}