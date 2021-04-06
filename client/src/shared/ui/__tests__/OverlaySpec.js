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

import TestContainer from 'mocha-test-container-support';

import {
  mount
} from 'enzyme';

import { Overlay } from '..';


describe('<Overlay>', function() {

  let wrapper, anchor;


  beforeEach(function() {
    anchor = document.createElement('button');
    anchor.textContent = 'Anchor';

    const testContainer = TestContainer.get(this);

    testContainer.appendChild(anchor);
  });


  afterEach(function() {
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });


  it('should render', function() {
    wrapper = mount(<Overlay anchor={ anchor } />);
  });


  it('should render children', function() {
    const wrapper = mount((
      <Overlay anchor={ anchor }>
        <Overlay.Title><div>{ 'Foo' }</div></Overlay.Title>
        <Overlay.Body>
          <div>
            { 'Test' }
          </div>
        </Overlay.Body>
      </Overlay>
    ));

    expect(wrapper.contains(<div>{ 'Foo' }</div>)).to.be.true;
    expect(wrapper.contains(<div>{ 'Test' }</div>)).to.be.true;
  });


  describe('onClose handling', function() {

    let onCloseSpy;

    beforeEach(function() {
      onCloseSpy = sinon.spy();
    });


    it('should call onClose for background click', function() {

      // given
      wrapper = mount(<Overlay anchor={ anchor } onClose={ onCloseSpy } />);

      // when
      TestContainer.get(this).dispatchEvent(new MouseEvent('mousedown'));

      // then
      expect(onCloseSpy).to.have.been.called;
    });


    it('should NOT call onClose for click inside the overlay', function() {

      // given
      wrapper = mount(<Overlay anchor={ anchor } onClose={ onCloseSpy }>
        <Overlay.Body>
          <button id="button" />
        </Overlay.Body>
      </Overlay>);

      // when
      wrapper.find('#button').simulate('click');

      // then
      expect(onCloseSpy).to.not.be.called;
    });


    it('should NOT call onClose for clicking the anchor', function() {

      // given
      wrapper = mount(<Overlay anchor={ anchor } onClose={ onCloseSpy }>
        <Overlay.Body>
          <button id="button" />
        </Overlay.Body>
      </Overlay>);

      // when
      anchor.dispatchEvent(new MouseEvent('mousedown'));

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
      wrapper = mount(<Overlay anchor={ anchor }>
        <Overlay.Body>
          <input id="input" autoFocus />
        </Overlay.Body>
      </Overlay>);

      const input = wrapper.find('#input').getDOMNode();

      // then
      expect(document.activeElement).to.eql(input);

    });

  });


  describe('<Overlay.Title>', function() {

    it('should render', function() {
      wrapper = mount(<Overlay.Title />);
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      wrapper = mount(<Overlay.Title className="foo" onClick={ onClickSpy } />);

      wrapper.simulate('click');

      // then
      expect(wrapper.getDOMNode().classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Overlay.Body>', function() {

    it('should render', function() {
      wrapper = mount(<Overlay.Body />);
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      wrapper = mount(<Overlay.Body className="foo" onClick={ onClickSpy } />);

      wrapper.simulate('click');

      // then
      expect(wrapper.getDOMNode().classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Overlay.Footer>', function() {

    it('should render', function() {
      wrapper = mount(<Overlay.Footer />);
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      wrapper = mount(<Overlay.Footer className="foo" onClick={ onClickSpy } />);

      wrapper.simulate('click');

      // then
      expect(wrapper.getDOMNode().classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });

});
