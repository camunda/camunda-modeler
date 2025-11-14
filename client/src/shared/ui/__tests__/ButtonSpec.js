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

import { render, fireEvent } from '@testing-library/react';

import { Button } from '..';


describe('<Button>', function() {

  it('should render', function() {
    const { getByRole } = render(<Button />);
    expect(getByRole('button')).to.exist;
  });


  it('should accept custom className', function() {

    // when
    const { getByRole } = render(<Button className="foo" />);

    // then
    const button = getByRole('button');
    expect(button.classList.contains('foo')).to.be.true;
  });


  it('should handle passed onClick prop', function() {

    // given
    const spy = sinon.spy();

    const { getByRole } = render(<Button onClick={ spy } />);

    // when
    const button = getByRole('button');
    fireEvent.click(button);

    // then
    expect(spy).to.have.been.called;
  });


  it('should be disabled', function() {

    // when
    const { getByRole } = render(<Button disabled />);

    // then
    const button = getByRole('button');
    expect(button.classList.contains('disabled')).to.be.true;
  });

});