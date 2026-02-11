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

import { render, screen } from '@testing-library/react';

import { VersionInfoOverlay } from '../VersionInfoOverlay';


describe('<VersionInfoOverlay>', function() {

  let anchor;

  beforeEach(function() {
    anchor = document.createElement('button');
    document.body.appendChild(anchor);
  });

  afterEach(function() {
    if (anchor && anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
  });

  it('should render', function() {

    // when
    render(
      <VersionInfoOverlay
        anchor={ anchor }
      />
    );

    // then
    expect(screen.getByRole('dialog')).to.exist;
  });
});
