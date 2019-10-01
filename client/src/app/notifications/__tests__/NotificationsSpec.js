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

import { shallow } from 'enzyme';

import Notifications from '..';
import Notification from '../Notification';


describe('<Notifications>', function() {

  it('should render', function() {
    shallow(<Notifications notifications={ [] } />);
  });


  it('should display notification', function() {

    // given
    const notification = createNotification();

    const wrapper = shallow(<Notifications notifications={ [ notification ] } />);

    // then
    expect(wrapper.find(Notification)).to.have.lengthOf(1);
  });

});


// helpers //////////

function createNotification({
  close = () => {},
  content,
  duration = 0,
  id = 0,
  title = 'title',
  type = 'info'
} = {}) {
  return {
    close,
    content,
    duration,
    id,
    title,
    type
  };
}
