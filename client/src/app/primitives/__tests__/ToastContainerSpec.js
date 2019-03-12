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
  shallow
} from 'enzyme';

import { ToastContainer } from '..';


describe('<ToastContainer>', function() {

  it('should render', function() {
    shallow(<ToastContainer />);
  });


  it('should render children', function() {
    const wrapper = shallow((
      <ToastContainer>
        <div>
          { 'Test' }
        </div>
      </ToastContainer>
    ));

    expect(wrapper.contains(<div>{ 'Test' }</div>)).to.be.true;
  });

});
