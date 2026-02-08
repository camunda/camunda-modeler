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
} from '../../slot-fill';

import PropertiesPanelStatusBarItem from '../PropertiesPanelStatusBarItem';

const spy = sinon.spy;


describe('PropertiesPanelStatusBarItem', function() {

  it('should render', function() {

    // when
    const { container } = renderPropertiesPanelStatusBarItem();

    // then
    expect(container.querySelector('.btn')).to.exist;
  });


  describe('toggle', function() {

    it('should be active (open on properties tab)', function() {

      // when
      const { container } = renderPropertiesPanelStatusBarItem({
        layout: {
          sidePanel: {
            open: true,
            tab: 'properties'
          }
        }
      });

      // then
      expect(container.querySelector('.btn').classList.contains('btn--active')).to.be.true;
    });


    it('should not be active (closed)', function() {

      // when
      const { container } = renderPropertiesPanelStatusBarItem();

      // then
      expect(container.querySelector('.btn').classList.contains('btn--active')).to.be.false;
    });


    it('should not be active (open on different tab)', function() {

      // when
      const { container } = renderPropertiesPanelStatusBarItem({
        layout: {
          sidePanel: {
            open: true,
            tab: 'test'
          }
        }
      });

      // then
      expect(container.querySelector('.btn').classList.contains('btn--active')).to.be.false;
    });


    it('should call callback on toggle', function() {

      // given
      const onLayoutChangedSpy = spy();

      const { container } = renderPropertiesPanelStatusBarItem({
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      fireEvent.click(container.querySelector('.btn'));

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnce;
    });


    it('should open properties tab when panel is closed', function() {

      // given
      const onLayoutChangedSpy = spy();

      const { container } = renderPropertiesPanelStatusBarItem({
        layout: {
          sidePanel: {
            open: false,
            tab: 'test'
          }
        },
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      fireEvent.click(container.querySelector('.btn'));

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnce;

      const { sidePanel } = onLayoutChangedSpy.getCall(0).args[0];
      expect(sidePanel.open).to.be.true;
      expect(sidePanel.tab).to.equal('properties');
    });


    it('should close panel when already open on properties tab', function() {

      // given
      const onLayoutChangedSpy = spy();

      const { container } = renderPropertiesPanelStatusBarItem({
        layout: {
          sidePanel: {
            open: true,
            tab: 'properties'
          }
        },
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      fireEvent.click(container.querySelector('.btn'));

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnce;

      const { sidePanel } = onLayoutChangedSpy.getCall(0).args[0];
      expect(sidePanel.open).to.be.false;
      expect(sidePanel.tab).to.equal('properties');
    });


    it('should switch to properties tab when panel is open on different tab', function() {

      // given
      const onLayoutChangedSpy = spy();

      const { container } = renderPropertiesPanelStatusBarItem({
        layout: {
          sidePanel: {
            open: true,
            tab: 'test'
          }
        },
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      fireEvent.click(container.querySelector('.btn'));

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnce;

      const { sidePanel } = onLayoutChangedSpy.getCall(0).args[0];
      expect(sidePanel.open).to.be.true;
      expect(sidePanel.tab).to.equal('properties');
    });

  });

});


// helpers //////////

const defaultLayout = {
  sidePanel: {
    open: false,
    tab: 'properties'
  }
};


function renderPropertiesPanelStatusBarItem(options = {}) {
  const {
    layout = defaultLayout,
    onLayoutChanged = () => {}
  } = options;

  return render(
    <SlotFillRoot>
      <Slot name="status-bar__app" />
      <PropertiesPanelStatusBarItem
        layout={ layout }
        onLayoutChanged={ onLayoutChanged } />
    </SlotFillRoot>
  );
}
