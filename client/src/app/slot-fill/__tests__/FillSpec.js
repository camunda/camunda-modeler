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

import {
  Fill,
} from '..';


describe('<Fill>', function() {

  describe('render', function() {

    it('should render', function() {

      const { container } = render(<Fill />);

      expect(container.firstChild).to.exist;
    });
  });

});
