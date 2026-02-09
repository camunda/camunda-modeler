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

import { SlotFillRoot } from '../../slot-fill';

import { StatusBar } from '../StatusBar';


describe('<StatusBar>', function() {

  it('should provide slots', function() {

    // given
    const { container } = createStatusBar();

    // then
    const fileSlot = container.querySelector('.status-bar__file');
    const appSlot = container.querySelector('.status-bar__app');

    expect(fileSlot).to.exist;
    expect(appSlot).to.exist;
  });
});


// helpers /////////////////////////////////////

function createStatusBar() {
  return render(
    <SlotFillRoot>
      <StatusBar />
    </SlotFillRoot>
  );
}