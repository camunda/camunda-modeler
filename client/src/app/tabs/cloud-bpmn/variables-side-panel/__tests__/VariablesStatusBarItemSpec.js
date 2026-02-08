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

import VariablesStatusBarItem from '../VariablesStatusBarItem';

const spy = sinon.spy;


describe('VariablesStatusBarItem', function() {

  it('should render', function() {

    // when
    const { container } = renderVariablesStatusBarItem();

    // then
    expect(container.querySelector('.btn')).to.exist;
  });


  describe('toggle', function() {

    it('should be active (open)', function() {

      // when
      const { container } = renderVariablesStatusBarItem({
        layout: {
          variablesSidePanel: {
            open: true
          }
        }
      });

      // then
      expect(container.querySelector('.btn').classList.contains('btn--active')).to.be.true;
    });


    it('should not be active (closed)', function() {

      // when
      const { container } = renderVariablesStatusBarItem();

      // then
      expect(container.querySelector('.btn').classList.contains('btn--active')).to.be.false;
    });


    it('should call callback on toggle', function() {

      // given
      const onLayoutChangedSpy = spy();

      const { container } = renderVariablesStatusBarItem({
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      fireEvent.click(container.querySelector('.btn'));

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnce;
    });

  });

});


// helpers //////////

const defaultLayout = {
  variablesSidePanel: {
    open: false
  }
};


function renderVariablesStatusBarItem(options = {}) {
  const {
    layout = defaultLayout,
    onLayoutChanged = () => {}
  } = options;

  return render(
    <SlotFillRoot>
      <Slot name="status-bar__app" />
      <VariablesStatusBarItem
        layout={ layout }
        onLayoutChanged={ onLayoutChanged } />
    </SlotFillRoot>
  );
}
