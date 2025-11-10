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
    const { getByRole } = render(<DropdownButton />);

    expect(getByRole('button')).to.exist;
  });


  it('should accept custom className', function() {

    // when
    const { container } = render(<DropdownButton className="foo" />);

    // then
    const dropdownButton = container.querySelector('.foo');
    expect(dropdownButton).to.exist;
  });


  it('should be disabled', function() {

    // when
    const { container } = render(<DropdownButton disabled />);

    // then
    const dropdownButton = container.firstChild;
    expect(dropdownButton.classList.contains('disabled')).to.be.true;
  });


  it('should open dropdown', function() {

    // given
    const { getByRole, container } = render(
      <DropdownButton
        items={ () => <span>Test</span> }
      />
    );

    // when
    const button = getByRole('button');
    fireEvent.click(button);

    // then
    expect(container.querySelector('.dropdown')).to.exist;
  });


  it('should NOT open dropdown if disabled', function() {

    // given
    const { getByRole, container } = render(<DropdownButton disabled={ true } />);

    // when
    const button = getByRole('button');
    fireEvent.click(button);

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

      const rendered = render(<DropdownButton items={ items } { ...props } />);

      const button = rendered.getByRole('button');

      // open dropdown
      fireEvent.click(button);

      return rendered;
    }


    it('should close dropdown on item click', function() {

      // given
      const { getByText, container } = openDropdown();

      // when
      const item = getByText('foo');
      fireEvent.click(item);

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
      const { getByText, container } = openDropdown({
        closeOnClick: false
      });

      // when
      const item = getByText('foo');
      fireEvent.click(item);

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

    const { getByRole, getByText } = render(<DropdownButton items={ items } />);

    const button = getByRole('button');
    fireEvent.click(button);

    // when
    const item = getByText('foo');
    fireEvent.click(item);

    // then
    expect(spy).to.have.been.called;
  });


  it('should accept custom dropdown children', function() {

    // given
    const { getByRole, container } = render(<DropdownButton><div className="foo"></div></DropdownButton>);

    // when
    const button = getByRole('button');
    fireEvent.click(button);

    // then
    expect(container.querySelector('.foo')).to.exist;
  });


  describe('multi-button', function() {

    it('should render multi-button', function() {

      // when
      const { container } = render(<DropdownButton multiButton />);

      // then
      const dropdownButton = container.firstChild;
      expect(dropdownButton.classList.contains('multi-button')).to.be.true;
    });


    it('should handle primary click handler', function() {

      // given
      const spy = sinon.spy();

      const { getByRole, container } = render(<DropdownButton multiButton onClick={ spy } />);

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expect(spy).to.have.been.called;
      expect(container.querySelector('.dropdown')).to.not.exist;
    });


    it('should open dropdown', function() {

      // given
      const spy = sinon.spy();

      const items = [ {
        text: 'foo',
        onClick: spy
      } ];

      const { container } = render(<DropdownButton multiButton items={ items } onClick={ spy } />);

      // when
      const opener = container.querySelector('.dropdown-opener');
      fireEvent.click(opener);

      // then
      expect(spy).to.not.have.been.called;
      expect(container.querySelector('.dropdown')).to.exist;
    });

  });

});