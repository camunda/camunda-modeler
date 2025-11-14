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

import { TabActions } from '../TabActions';

import {
  SlotFillRoot,
  Fill,
} from '../../slot-fill';


describe('<TabActions>', function() {

  it('should provide slots', function() {

    // given
    const { getByTestId } = render(
      <SlotFillRoot>
        <TabActions />
        <Fill slot="tab-actions">
          <span data-testid="tab-actions-fill" />
        </Fill>
      </SlotFillRoot>
    );

    // then
    expect(getByTestId('tab-actions-fill')).to.exist;
  });
});