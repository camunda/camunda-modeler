/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { createRef } from 'react';

import { render } from '@testing-library/react';

import {
  Fill,
} from '..';


describe('<Fill>', function() {

  describe('render', function() {

    it('should render', function() {

      // given
      const fillRef = createRef();

      // when
      render(<Fill ref={ fillRef } />);

      expect(fillRef.current).to.exist;
    });
  });

});
