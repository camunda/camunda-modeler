/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import {
  mount,
  shallow
} from 'enzyme';

import { ModalWrapper } from '..';


describe('<ModalWrapper>', function() {

  it('should render', function() {
    shallow(<ModalWrapper />);
  });


  it('should render children', function() {
    const wrapper = shallow((
      <ModalWrapper>
        <div>
          { 'Test' }
        </div>
      </ModalWrapper>
    ));

    expect(wrapper.contains(<div>{ 'Test' }</div>)).to.be.true;
  });


  it('should invoke passed onClose prop for background click', function() {

    // given
    const onCloseSpy = sinon.spy();
    const wrapper = mount(<ModalWrapper onClose={ onCloseSpy } />);

    // when
    wrapper.first().simulate('click');

    // then
    expect(onCloseSpy).to.be.called;

    wrapper.unmount();
  });


  it('should NOT invoke passed onClose prop for click on modal container', function() {

    // given
    const onCloseSpy = sinon.spy();
    const wrapper = mount(<ModalWrapper onClose={ onCloseSpy } />);

    // when
    wrapper.find('div div').first().simulate('click');

    // then
    expect(onCloseSpy).to.not.be.called;

    wrapper.unmount();
  });

});
