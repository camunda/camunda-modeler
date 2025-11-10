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

import { render } from '@testing-library/react';

import { Icon } from '..';


describe('<Icon>', function() {

  it('should render', function() {
    const { container } = render(<Icon name="test" />);

    expect(container.querySelector('span')).to.exist;
  });


  it('should accept custom className', function() {

    // when
    const { container } = render(<Icon name="test" className="foo" />);

    // then
    const icon = container.querySelector('span');
    expect(icon.classList.contains('foo')).to.be.true;
  });

});