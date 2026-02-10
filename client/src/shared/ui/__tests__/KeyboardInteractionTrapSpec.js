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
  render,
  cleanup
} from '@testing-library/react';

import KeyboardInteractionTrap,
{ KeyboardInteractionTrapContext } from '../trap/KeyboardInteractionTrap';


describe('<KeyboardInteractionTrap>', function() {

  afterEach(cleanup);


  it('should dispatch update-menu action', function() {

    // given
    const triggerAction = sinon.spy();

    // when
    const { container } = render(
      <KeyboardInteractionTrapContext.Provider value={ triggerAction }>
        <KeyboardInteractionTrap />
      </KeyboardInteractionTrapContext.Provider>
    );

    // then
    expect(container).to.exist;
    expect(triggerAction).to.have.been.calledOnce;
  });


  it('should NOT trigger error outside of context', function() {

    // when
    const { container } = render(
      <KeyboardInteractionTrap />
    );

    // then
    expect(container).to.exist;
  });


  it('should update menu when input receives focus', function() {

    // given
    const triggerAction = sinon.spy();

    const { container } = render(
      <KeyboardInteractionTrapContext.Provider value={ triggerAction }>
        <KeyboardInteractionTrap>
          <input type="text" />
        </KeyboardInteractionTrap>
      </KeyboardInteractionTrapContext.Provider>
    );

    const input = container.querySelector('input');

    // when
    input.focus();

    // then
    expect(triggerAction).to.have.been.calledWith('update-menu', {
      editMenu: [
        [
          {
            role: 'undo',
            enabled: true
          },
          {
            role: 'redo',
            enabled: true
          }
        ],
        [
          {
            role: 'copy',
            enabled: true
          },
          {
            role: 'cut',
            enabled: true
          },
          {
            role: 'paste',
            enabled: true
          },
          {
            role: 'selectAll',
            enabled: true
          }
        ]
      ]
    });
  });


  it('should update menu when textarea receives focus', function() {

    // given
    const triggerAction = sinon.spy();

    const { container } = render(
      <KeyboardInteractionTrapContext.Provider value={ triggerAction }>
        <KeyboardInteractionTrap>
          <textarea />
        </KeyboardInteractionTrap>
      </KeyboardInteractionTrapContext.Provider>
    );

    const textarea = container.querySelector('textarea');

    // when
    textarea.focus();

    // then
    expect(triggerAction).to.have.been.calledWith('update-menu', {
      editMenu: [
        [
          {
            role: 'undo',
            enabled: true
          },
          {
            role: 'redo',
            enabled: true
          }
        ],
        [
          {
            role: 'copy',
            enabled: true
          },
          {
            role: 'cut',
            enabled: true
          },
          {
            role: 'paste',
            enabled: true
          },
          {
            role: 'selectAll',
            enabled: true
          }
        ]
      ]
    });
  });


  it('should disable menu when non-input element receives focus', function() {

    // given
    const triggerAction = sinon.spy();

    const { container } = render(
      <KeyboardInteractionTrapContext.Provider value={ triggerAction }>
        <KeyboardInteractionTrap>
          <button>Click me</button>
        </KeyboardInteractionTrap>
      </KeyboardInteractionTrapContext.Provider>
    );

    const button = container.querySelector('button');

    // when
    button.focus();

    // then
    expect(triggerAction).to.have.been.calledWith('update-menu', {
      editMenu: [
        [
          {
            role: 'undo',
            enabled: false
          },
          {
            role: 'redo',
            enabled: false
          }
        ],
        [
          {
            role: 'copy',
            enabled: false
          },
          {
            role: 'cut',
            enabled: false
          },
          {
            role: 'paste',
            enabled: false
          },
          {
            role: 'selectAll',
            enabled: false
          }
        ]
      ]
    });
  });
});
