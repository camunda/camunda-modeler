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

import Input from '../Input';


describe('<Input>', function() {


  it('should render', function() {

    // when
    const { container } = render(<Input />);

    // then
    expect(container.querySelector('input')).to.exist;
  });


  it('#onChange', function() {

    // given
    const onChangeSpy = sinon.spy();

    const { container } = render(<Input onChange={ onChangeSpy } />);

    // when
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: 'foo' } });

    // then
    expect(onChangeSpy).to.have.been.calledWith('foo');
  });

});