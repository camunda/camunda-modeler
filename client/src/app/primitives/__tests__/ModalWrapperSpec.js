/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
