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

import { mount } from 'enzyme';

import {
  Fill,
} from '..';


describe('<Fill>', function() {

  let fill;

  afterEach(function() { return fill.unmount(); });

  describe('render', function() {

    it('should render', function() {

      fill = mount(<Fill />);

      expect(fill.instance()).to.exist;
    });
  });

});
