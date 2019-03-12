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

import {
  mount,
  shallow
} from 'enzyme';

import { WarningsToast } from '..';

/* global sinon */
const { spy } = sinon;

describe('<WarningsToast>', function() {

  it('should render', function() {
    shallow(<WarningsToast />);
  });


  it('should execute onClose', function() {

    // given
    const closeSpy = spy();

    const wrapper = mount(<WarningsToast
      onClose={ closeSpy }
    />);

    const closeButton = wrapper.find('.close-warnings');

    // assure
    expect(closeButton).to.exist;

    // when
    closeButton.simulate('click');

    // then
    expect(closeSpy).to.have.been.called;

  });

});
