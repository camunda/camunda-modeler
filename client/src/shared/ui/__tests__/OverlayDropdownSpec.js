/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import React from 'react';

import {
  render,
  fireEvent,
  screen
} from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { OverlayDropdown } from '..';


describe('<OverlayDropdown>', function() {

  let buttonRef;

  beforeEach(function() {
    buttonRef = React.createRef();
  });

  it('should render button content', function() {

    // given
    render((
      <OverlayDropdown items={ [] } buttonRef={ buttonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // then
    expect(screen.getByText('TestButton')).to.exist;
  });


  it('should open', async function() {

    // given
    render((
      <OverlayDropdown items={ [] } buttonRef={ buttonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    await userEvent.click(screen.getByRole('button'));

    // then
    expect(screen.getByRole('menu')).to.exist;
  });


  it('should close when button is clicked again', async function() {

    // given
    render((
      <OverlayDropdown items={ [] } buttonRef={ buttonRef }>
        TestButton
      </OverlayDropdown>
    ));

    const button = screen.getByRole('button');

    // the open menu disables pointer events outside of it, as in the browser
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(button);

    // when
    await user.click(button);

    // then
    expect(screen.queryByRole('menu')).to.not.exist;
  });


  it('should close and call the option callback when option is selected', async function() {

    // given
    const spy = sinon.spy();
    const items = [ { text: 'TestOption', onClick: spy } ];

    render((
      <OverlayDropdown items={ items } buttonRef={ buttonRef }>
        TestButton
      </OverlayDropdown>
    ));

    await userEvent.click(screen.getByRole('button'));

    // when
    await userEvent.click(screen.getByRole('menuitem', { name: 'TestOption' }));

    // then
    expect(spy).to.have.been.calledOnce;
    expect(screen.queryByRole('menu')).to.not.exist;
  });


  it('should call onClose instead of opening with overlay state', async function() {

    // given
    const onClose = sinon.spy();

    render((
      <OverlayDropdown items={ [] } buttonRef={ buttonRef } overlayState={ true } onClose={ onClose }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    await userEvent.click(screen.getByRole('button'));

    // then
    expect(onClose).to.have.been.calledOnce;
    expect(screen.queryByRole('menu')).to.not.exist;
  });


  it('should group options', function() {

    // given
    const items = [
      { key: 'A', label: 'Group A', items: [ { text: 'foo' } ] },
      { key: 'B', items: [ { text: 'bar' } ] },
      { key: 'C', items: [ { text: 'baz' } ] }
    ];

    // when
    render((
      <OverlayDropdown shouldOpen={ true } items={ items } buttonRef={ buttonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // then
    expect(screen.getAllByRole('group')).to.have.length(3);
    expect(screen.getByText('Group A')).to.exist;
  });


  it('should set max height for option group', function() {

    // given
    const items = [
      { key: 'section', items: [ { text: 'foo' } ], maxHeight: 300 }
    ];

    // when
    render((
      <OverlayDropdown shouldOpen={ true } items={ items } buttonRef={ buttonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // then
    const list = screen.getByRole('menuitem', { name: 'foo' }).parentElement;

    expect(list.style.maxHeight).to.equal('300px');
  });


  it('should navigate across groups with arrow keys', async function() {

    // given
    const items = [
      { key: 'section1', items: [ { text: 'item1' } ] },
      { key: 'section2', items: [ { text: 'item2' } ] }
    ];

    render((
      <OverlayDropdown items={ items } buttonRef={ buttonRef }>
        foo
      </OverlayDropdown>
    ));

    screen.getByRole('button').focus();
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });

    // when
    await userEvent.keyboard('{ArrowDown}');

    // then
    expect(document.activeElement).to.equal(screen.getByRole('menuitem', { name: 'item2' }));
  });

});