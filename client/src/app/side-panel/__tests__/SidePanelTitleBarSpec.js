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

import { render, fireEvent, screen } from '@testing-library/react';

import SidePanelTitleBar from '../SidePanelTitleBar';

const { spy } = sinon;

const DummyIcon = (props) => <svg { ...props } aria-label="dummy icon" />;


describe('<SidePanelTitleBar>', function() {

  it('should render', function() {

    // when
    createSidePanelTitleBar();

    // then
    expect(screen.getByText('Test')).to.exist;
  });


  it('should render title', function() {

    // when
    createSidePanelTitleBar({ title: 'Variables' });

    // then
    expect(screen.getByText('Variables')).to.exist;
  });


  it('should render icon', function() {

    // when
    createSidePanelTitleBar({ icon: DummyIcon });

    // then
    expect(screen.getByLabelText('dummy icon')).to.exist;
  });


  it('should NOT render icon when not provided', function() {

    // when
    createSidePanelTitleBar();

    // then
    expect(screen.queryByLabelText('dummy icon')).not.to.exist;
  });


  it('should render close button', function() {

    // when
    createSidePanelTitleBar({ onClose: () => {} });

    // then
    expect(screen.getByRole('button', { name: 'Close panel' })).to.exist;
  });


  it('should NOT render close button when onClose not provided', function() {

    // when
    createSidePanelTitleBar();

    // then
    expect(screen.queryByRole('button', { name: 'Close panel' })).not.to.exist;
  });


  it('should call onClose when close button is clicked', function() {

    // given
    const onClose = spy();

    createSidePanelTitleBar({ onClose });

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));

    // then
    expect(onClose).to.have.been.calledOnce;
  });

});


// helpers //////////

function createSidePanelTitleBar(options = {}) {
  const {
    title = 'Test',
    icon,
    onClose
  } = options;

  return render(
    <SidePanelTitleBar title={ title } icon={ icon } onClose={ onClose } />
  );
}
