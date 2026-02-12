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

import { render, screen } from '@testing-library/react';

import { ToggleSwitch } from '..';


describe('<ToggleSwitch>', function() {

  it('should render', function() {
    createToggleSwitch();
  });


  it('should be checked', function() {

    // given
    createToggleSwitch({
      field:
        {
          name: 'foo',
          value: true,
          onChange: () => {}
        }
    });

    const input = screen.getByRole('checkbox');

    // then
    expect(input.checked).to.be.true;
  });


  it('should not be checked', function() {

    // given
    createToggleSwitch({
      field:
        {
          name: 'foo',
          value: false,
          onChange: () => {}
        }
    });

    const input = screen.getByRole('checkbox');

    // then
    expect(input.checked).to.be.false;
  });

});


// helpers ///////////////////

const DEFAULT_FIELD = {
  name: 'foo',
  value: true,
  onChange: () => {}
};

function createToggleSwitch(props = {}) {
  const {
    field = DEFAULT_FIELD
  } = props;

  return render(<ToggleSwitch
    field={ field }
  />);
}