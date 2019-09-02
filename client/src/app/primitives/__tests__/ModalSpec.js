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

import { Modal } from '..';


describe('<Modal>', function() {

  it('should render', function() {
    shallow(<Modal />);
  });


  it('should render children', function() {
    const wrapper = shallow((
      <Modal>
        <div>
          { 'Test' }
        </div>
      </Modal>
    ));

    expect(wrapper.contains(<div>{ 'Test' }</div>)).to.be.true;
  });


  describe('onClose handling', function() {

    let wrapper, onCloseSpy;

    beforeEach(function() {
      onCloseSpy = sinon.spy();
    });


    afterEach(function() {
      if (wrapper) {
        wrapper.unmount();
      }
    });


    it('should invoke passed onClose prop for background click', function() {

      // given
      wrapper = mount(<Modal onClose={ onCloseSpy } />);

      // when
      wrapper.first().simulate('click');

      // then
      expect(onCloseSpy).to.be.called;
    });


    it('should NOT invoke passed onClose prop for click on modal container', function() {

      // given
      wrapper = mount(<Modal onClose={ onCloseSpy }><button id="button" /></Modal>);

      // when
      wrapper.find('#button').simulate('click');

      // then
      expect(onCloseSpy).to.not.be.called;
    });

  });


  describe('focus handling', function() {

    let wrapper;

    afterEach(function() {
      if (wrapper) {
        wrapper.unmount();
      }
    });


    it('should correctly handle autofocus', function() {

      // given
      wrapper = mount(<Modal><input id="input" autoFocus /></Modal>);

      const input = wrapper.find('#input').getDOMNode();

      // then
      expect(document.activeElement).to.eql(input);

    });

  });

});
