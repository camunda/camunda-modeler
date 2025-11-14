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

import { render, fireEvent } from '@testing-library/react';

import { DropdownButton } from '..';


describe('<DropdownButton>', function() {

  it('should render', function() {
    render(<DropdownButton />);
  });


  it('should accept custom className', function() {

    // when
    const { container } = render(<DropdownButton className="foo" />);

    // then
    expect(container.querySelector('.foo')).to.exist;
  });


  it('should be disabled', function() {

    // when
    const { container } = render(<DropdownButton disabled />);

    // then
    expect(container.querySelector('.disabled')).to.exist;
  });


  it('should open dropdown', function() {

    // given
    const { container } = render(
      <DropdownButton
        items={ () => <span /> }
      />
    );

    // when
    const button = container.querySelector('button');
    fireEvent.click(button, mockEvent());


    // then
    expect(container.querySelector('.dropdown')).to.exist;
  });


  it('should NOT open dropdown if disabled', function() {

    // given
    const { container } = render(<DropdownButton disabled={ true } />);

    // when
    const button = container.querySelector('button');
    fireEvent.click(button, mockEvent());


    // then
    expect(container.querySelector('.dropdown')).to.not.exist;
  });


  describe('close', function() {

    function openDropdown(props) {

      const items = [ {
        text: 'foo'
      }, {
        text: 'bar'
      } ];

      const { container } = render(<DropdownButton items={ items } { ...props } />);

      // open dropdown by clicking button
      fireEvent.click(container.querySelector('button'));

      return { container };
    }


    it('should close dropdown on item click', function() {

      // given
      const { container } = openDropdown();

      // when
      const item = container.querySelector('.item');
      fireEvent.click(item, mockEvent());

      // then
      expect(container.querySelector('.dropdown')).to.not.exist;
    });


    it('should close dropdown on global click', function() {

      // given
      const { container } = openDropdown();

      // when
      fireEvent.click(document.body);

      // then
      expect(container.querySelector('.dropdown')).to.not.exist;
    });


    it('should NOT close on click if specified', function() {

      // given
      const { container } = openDropdown({
        closeOnClick: false
      });

      // when
      const item = container.querySelector('.item');
      fireEvent.click(item, mockEvent());

      // then
      expect(container.querySelector('.dropdown')).to.exist;
    });

  });


  it('should call handler on item click', function() {

    // given
    const spy = sinon.spy();

    const items = [ {
      text: 'foo',
      onClick: spy
    } ];

    const { container } = render(<DropdownButton items={ items } />);

    fireEvent.click(container.querySelector('button'), mockEvent());

    // when
    fireEvent.click(container.querySelector('.item'));

    // then
    expect(spy).to.have.been.called;
  });


  it('should accept custom dropdown children', function() {

    // when
    const { container } = render(<DropdownButton><div className="foo"></div></DropdownButton>);

    // Open dropdown first
    fireEvent.click(container.querySelector('button'));

    // then
    expect(container.querySelector('.foo')).to.exist;
  });


  describe('multi-button', function() {

    it('should render multi-button', function() {

      // when
      const { container } = render(<DropdownButton multiButton />);

      // then
      expect(container.querySelector('.multi-button')).to.exist;
    });


    it('should handle primary click handler', function() {

      // given
      const spy = sinon.spy();

      const { container } = render(<DropdownButton multiButton onClick={ spy } />);

      // when
      fireEvent.click(container.querySelector('button'), mockEvent());

      // then
      expect(spy).to.have.been.called;
      expect(container.querySelector('.dropdown')).to.not.exist;
    });


    it('should open dropdown', function() {

      // given
      const spy = sinon.spy();

      const items = [ { text: 'Test Item' } ];

      const { container } = render(<DropdownButton multiButton onClick={ spy } items={ items } />);

      // when
      fireEvent.click(container.querySelector('.dropdown-opener'), mockEvent());

      // then
      expect(spy).to.not.have.been.called;
      expect(container.querySelector('.dropdown')).to.exist;
    });

  });

});


// helpers //////////////

function mockEvent() {

  return {
    stopPropagation() {},
    preventDefault() {}
  };

}
