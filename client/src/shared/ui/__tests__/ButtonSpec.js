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
    render(<Button />);
  });


  it('should accept custom className', function() {

    // when
    const { container } = render(<Button className="foo" />);

    // then
    expect(container.querySelector('.foo')).to.exist;
  });


  it('should handle passed onClick prop', function() {

    // given
    const spy = sinon.spy();

    const { container } = render(<Button onClick={ spy } />);

    // when
    fireEvent.click(container.firstChild);

    // then
    expect(spy).to.have.been.called;
  });


  it('should be disabled', function() {

    // when
    const { container } = render(<Button disabled />);

    // then
    expect(container.querySelector('.disabled')).to.exist;
  });

});