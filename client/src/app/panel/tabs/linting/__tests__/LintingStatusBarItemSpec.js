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

import {
  SlotFillRoot,
  Slot
} from '../../../../slot-fill';

import LintingStatusBarItem from '../LintingStatusBarItem';

const spy = sinon.spy;


describe('LintingStatusBarItem', function() {

  it('should render', function() {

    // when
    const { container } = renderLintingStatusBarItem();

    // then
    expect(container.querySelector('.btn')).to.exist;
  });


  describe('number of errors, warnings and info messages', function() {

    it('should display 1 error and 1 warning', function() {

      // when
      const { container } = renderLintingStatusBarItem();

      // then
      expect(container.querySelector('.errors').textContent).to.equal('1');
      expect(container.querySelector('.warnings').textContent).to.equal('1');
      expect(container.querySelector('.infos').textContent).to.equal('1');
    });


    it('should always show error and warning handles', function() {

      // when
      const { container } = renderLintingStatusBarItem({
        linting: []
      });

      // then
      expect(container.querySelector('.errors').textContent).to.equal('0');
      expect(container.querySelector('.warnings').textContent).to.equal('0');
      expect(container.querySelector('.infos')).to.be.null;
    });


    it('should display 3 errors, 1 warning and 2 info messages', function() {

      // when
      const { container } = renderLintingStatusBarItem({
        linting: [
          ...defaultLinting,
          {
            category: 'error',
            id: 'baz',
            message: 'Baz'
          },
          {
            category: 'error',
            id: 'baz2',
            message: 'Baz2'
          },
          {
            category: 'info',
            id: 'buz2',
            message: 'Buz2'
          }
        ]
      });

      // then
      expect(container.querySelector('.errors').textContent).to.equal('3');
      expect(container.querySelector('.warnings').textContent).to.equal('1');
      expect(container.querySelector('.infos').textContent).to.equal('2');
    });

  });


  describe('toggle', function() {

    it('should be active (open)', function() {

      // when
      const { container } = renderLintingStatusBarItem({
        layout: {
          panel: {
            open: true,
            tab: 'linting'
          }
        }
      });

      // then
      expect(container.querySelector('.btn').classList.contains('btn--active')).to.be.true;
    });


    it('should not be active (closed)', function() {

      // when
      const { container } = renderLintingStatusBarItem();

      // then
      expect(container.querySelector('.btn').classList.contains('btn--active')).to.be.false;
    });


    it('should call callback on toggle', function() {

      // given
      const onToggleSpy = spy();

      const { container } = renderLintingStatusBarItem({
        onToggle: onToggleSpy
      });

      // when
      fireEvent.click(container.querySelector('.btn'));

      // then
      expect(onToggleSpy).to.have.been.calledOnce;
    });

  });

});


// helpers //////////

const defaultLayout = {
  panel: {
    open: false,
    tab: 'linting'
  }
};

const defaultLinting = [
  {
    category: 'error',
    id: 'foo',
    message: 'Foo message'
  },
  {
    category: 'warn',
    id: 'bar',
    message: 'Bar message'
  },
  {
    category: 'info',
    id: 'buz',
    message: 'Buz message'
  }
];

function renderLintingStatusBarItem(options = {}) {
  const {
    layout = defaultLayout,
    linting = defaultLinting,
    onToggle
  } = options;

  return render(
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      <LintingStatusBarItem
        layout={ layout }
        linting={ linting }
        onToggle={ onToggle } />
    </SlotFillRoot>
  );
}
