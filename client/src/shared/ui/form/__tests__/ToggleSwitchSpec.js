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

    const input = screen.getByRole('switch');

    // then
    expect(input.getAttribute('aria-checked')).to.eql('true');
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

    const input = screen.getByRole('switch');

    // then
    expect(input.getAttribute('aria-checked')).to.eql('false');
  });



  it('should render label', function() {

    // given
    const { container } = render(<ToggleSwitch field={ DEFAULT_FIELD } switcherLabel="Foo" />);

    // then
    expect(container.querySelector('label').textContent).to.equal('Foo');
  });


  it('should not render empty label', function() {

    // given
    const { container } = createToggleSwitch();

    // then
    expect(container.querySelector('label')).not.to.exist;
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