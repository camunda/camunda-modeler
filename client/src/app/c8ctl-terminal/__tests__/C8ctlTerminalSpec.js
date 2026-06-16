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
import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import C8ctlTerminal from '../C8ctlTerminal';


function createC8ctl(overrides = {}) {
  return {
    getInfo: () => Promise.resolve({ prompt: 'c8ctl >', commands: [] }),
    execute: () => Promise.resolve({ output: '', isError: false }),
    complete: () => Promise.resolve([]),
    ...overrides
  };
}


describe('<C8ctlTerminal>', function() {

  it('should render nothing while closed', function() {

    // when
    const { container } = render(<C8ctlTerminal c8ctl={ createC8ctl() } />);

    // then
    expect(container.querySelector('input')).not.to.exist;
  });


  it('should toggle open on backtick', async function() {

    // given
    render(<C8ctlTerminal c8ctl={ createC8ctl() } />);

    // when
    fireEvent.keyDown(window, { key: '`' });

    // then
    await waitFor(() => {
      expect(document.querySelector('input')).to.exist;
    });
  });


  it('should not open when backtick typed into an editable field', function() {

    // given
    render(<C8ctlTerminal c8ctl={ createC8ctl() } />);

    const field = document.createElement('input');
    document.body.appendChild(field);
    field.focus();

    // when
    fireEvent.keyDown(field, { key: '`' });

    // then — only the standalone field exists, no terminal input
    expect(document.querySelectorAll('input').length).to.eql(1);

    document.body.removeChild(field);
  });


  it('should execute a command and render its output', async function() {

    // given
    const c8ctl = createC8ctl({
      execute: (command) => {
        expect(command).to.eql('get topology');

        return Promise.resolve({ output: 'gateway 8.x', isError: false });
      }
    });

    render(<C8ctlTerminal c8ctl={ c8ctl } />);

    fireEvent.keyDown(window, { key: '`' });

    const input = await waitFor(() => {
      const el = document.querySelector('input');
      expect(el).to.exist;
      return el;
    });

    // when
    fireEvent.change(input, { target: { value: 'get topology' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // then
    await waitFor(() => {
      expect(document.body.textContent).to.contain('gateway 8.x');
    });
  });


  it('should clear the scrollback on `clear`', async function() {

    // given
    const c8ctl = createC8ctl({
      execute: () => Promise.resolve({ output: 'some output', isError: false })
    });

    render(<C8ctlTerminal c8ctl={ c8ctl } />);

    fireEvent.keyDown(window, { key: '`' });

    const input = await waitFor(() => {
      const el = document.querySelector('input');
      expect(el).to.exist;
      return el;
    });

    fireEvent.change(input, { target: { value: 'get topology' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(document.body.textContent).to.contain('some output');
    });

    // when
    fireEvent.change(input, { target: { value: 'clear' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // then — scrollback emptied
    await waitFor(() => {
      expect(document.body.textContent).not.to.contain('some output');
    });
  });


  it('should close on Escape', async function() {

    // given
    render(<C8ctlTerminal c8ctl={ createC8ctl() } />);

    fireEvent.keyDown(window, { key: '`' });

    const input = await waitFor(() => {
      const el = document.querySelector('input');
      expect(el).to.exist;
      return el;
    });

    // when
    fireEvent.keyDown(input, { key: 'Escape' });

    // then
    await waitFor(() => {
      expect(document.querySelector('input')).not.to.exist;
    });
  });

});
