/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import { mount } from 'enzyme';

import {
  Fill,
} from '..';


describe('<Fill>', function() {

  let fill;

  afterEach(() => fill.unmount());

  describe('render', function() {

    it('should render', function() {

      fill = mount(<Fill />);

      expect(fill.instance()).to.exist;
    });
  });

});
