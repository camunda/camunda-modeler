/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';

import React from 'react';

import { render, screen } from '@testing-library/react';

import { Notice } from '..';


describe('<Notice>', function() {

  it('should render content as a status', function() {

    // when
    render(<Notice type="warning">Restart required.</Notice>);

    // then
    expect(screen.getByRole('status').textContent).to.eql('Restart required.');
  });


  [
    [ 'info', 'info' ],
    [ 'success', 'success' ],
    [ 'warning', 'warning' ],
    [ 'error', 'error' ]
  ].forEach(([ type, label ]) => {
    it(`should render ${ type } icon`, function() {

      // when
      render(<Notice type={ type }>Message</Notice>);

      // then
      expect(screen.getByLabelText(label)).to.exist;
    });
  });


  it('should default to info', function() {

    // when
    render(<Notice>Message</Notice>);

    // then
    expect(screen.getByLabelText('info')).to.exist;
  });


  it('should render a custom icon instead of the type\'s default', function() {

    // when
    render(<Notice type="info" icon={ <span data-testid="spinner" /> }>Connecting</Notice>);

    // then
    expect(screen.getByTestId('spinner')).to.exist;
    expect(screen.queryByLabelText('info')).not.to.exist;
  });

});
