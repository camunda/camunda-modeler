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
  mount
} from 'enzyme';

import { Modal } from '..';


describe('<Modal>', function() {

  let wrapper;


  afterEach(function() {
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });


  it('should render', function() {
    wrapper = mount(<Modal />);
  });


  it('should render children', function() {
    const wrapper = mount((
      <Modal>
        <Modal.Title><div>{ 'Foo' }</div></Modal.Title>
        <Modal.Body>
          <div>
            { 'Test' }
          </div>
        </Modal.Body>
      </Modal>
    ));

    expect(wrapper.contains(<div>{ 'Foo' }</div>)).to.be.true;
    expect(wrapper.contains(<div>{ 'Test' }</div>)).to.be.true;
  });


  describe('onClose parameter', function() {

    it('should render close icon if onClose existent', function() {

      const wrapper = mount(<Modal onClose={ () => {} } />);

      expect(wrapper.find('.close')).to.have.lengthOf(1);
    });


    it('should not render close icon if onClose not set', function() {

      const wrapper = mount(<Modal />);

      expect(wrapper.find('.close')).to.have.lengthOf(0);
    });
  });


  describe('onClose handling', function() {

    let onCloseSpy;

    beforeEach(function() {
      onCloseSpy = sinon.spy();
    });


    it('should NOT invoke passed onClose prop for background click', function() {

      // given
      wrapper = mount(<Modal onClose={ onCloseSpy } />);

      // when
      wrapper.first().simulate('click');

      // then
      expect(onCloseSpy).to.not.be.called;
    });


    it('should NOT invoke passed onClose prop for click on modal container', function() {

      // given
      wrapper = mount(<Modal onClose={ onCloseSpy }>
        <Modal.Body>
          <button id="button" />
        </Modal.Body>
      </Modal>);

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
      wrapper = mount(<Modal>
        <Modal.Body>
          <input id="input" autoFocus />
        </Modal.Body>
      </Modal>);

      const input = wrapper.find('#input').getDOMNode();

      // then
      expect(document.activeElement).to.eql(input);

    });

  });

});
