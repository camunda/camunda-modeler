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
    render(<Icon />);
  });


  it('should accept custom className', function() {

    // when
    const { container } = render(<Icon className="foo" />);

    // then
    expect(container.querySelector('.foo')).to.exist;
  });

});
