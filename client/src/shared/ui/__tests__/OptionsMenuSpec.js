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

import { fireEvent, render, screen } from '@testing-library/react';

import { Modal, OptionsMenu } from '..';


describe('<OptionsMenu>', function() {

  it('should open menu', function() {

    // given
    renderMenu();

    const button = screen.getByRole('button', { name: 'Options' });

    // when
    openMenu(button);

    // then
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).to.eql([ 'Edit', 'Remove' ]);
  });


  it('should select item once closed, with focus on menu button', function() {

    // given
    let focused;
    const onSelect = sinon.spy(() => focused = document.activeElement);

    renderMenu({ onSelect });

    const button = screen.getByRole('button', { name: 'Options' });

    // when
    openMenu(button);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    // then
    expect(onSelect).to.have.been.calledOnce;
    expect(screen.queryByRole('menu')).not.to.exist;
    expect(focused === button, 'focus on menu button').to.be.true;
  });


  it('should not submit an enclosing form', function() {

    // given
    const onSubmit = sinon.spy(event => event.preventDefault());

    render(<form onSubmit={ onSubmit }>
      <OptionsMenu label="Options" items={ [ { label: 'Edit', onSelect: () => {} } ] } />
    </form>);

    // when
    openMenu(screen.getByRole('button', { name: 'Options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    // then
    expect(onSubmit).not.to.have.been.called;
  });


  it('should close on Escape, but not an enclosing modal', function() {

    // given
    const onClose = sinon.spy();
    const onSelect = sinon.spy();

    render(<Modal onClose={ onClose }>
      <OptionsMenu label="Options" items={ [ { label: 'Edit', onSelect } ] } />
    </Modal>);

    openMenu(screen.getByRole('button', { name: 'Options' }));

    // when
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Edit' }), { key: 'Escape' });

    // then
    expect(screen.queryByRole('menu')).not.to.exist;
    expect(onSelect).not.to.have.been.called;
    expect(onClose).not.to.have.been.called;
  });

});


// helpers //////////

/**
 * Open the menu like a keyboard user; the menu does not open on `click`.
 */
function openMenu(button) {
  fireEvent.keyDown(button, { key: 'Enter' });
}

function renderMenu({ onSelect = () => {} } = {}) {
  return render(<OptionsMenu label="Options" items={ [
    { label: 'Edit', onSelect },
    { label: 'Remove', onSelect: () => {}, danger: true }
  ] } />);
}
