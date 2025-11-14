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

import CloseTrap from '../trap/CloseTrap';


describe('<CloseTrap>', function() {

  it('should focus initiator', function() {

    // given
    const { getByTestId } = render(
      <button data-testid="el" />
    );

    const el = getByTestId('el');

    const closeTrap = CloseTrap(el);

    // when
    closeTrap.mount();
    closeTrap.unmount();

    // then
    expect(document.activeElement).to.eql(el);
  });
});
