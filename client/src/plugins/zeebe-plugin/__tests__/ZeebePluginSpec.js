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

import ZeebePlugin from '..';

describe('<ZeebePlugin>', function() {

  it('should render', function() {

    // when
    const { container } = render(
      <ZeebePlugin
        _getGlobal={ () => {} }
        subscribe={ () => ({ cancel() {} }) }
      />
    );

    // then
    expect(container).to.exist;
  });

});