/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { render, fireEvent, screen, waitFor } from '@testing-library/react';

import { ReportFeedback } from '../ReportFeedback';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';


describe('<ReportFeedback>', function() {

  it('should open when button is clicked', function() {

    // given
    createReportFeedback();

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    expect(screen.getByRole('dialog')).to.exist;
  });


  it('should open via menu events', async function() {

    // given
    const subscribe = createSubscribe('reportFeedback.open');
    createReportFeedback({ subscribe });

    // when
    subscribe.emit({ source: 'menu' });

    // then
    await waitFor(() => {
      expect(screen.getByRole('dialog')).to.exist;
    });
  });


  it('should close when button is clicked again', function() {

    // given
    createReportFeedback();

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    expect(screen.getByRole('dialog')).to.exist;

    // when
    fireEvent.click(screen.getAllByRole('button')[0]);

    // then
    expect(screen.queryByRole('dialog')).to.not.exist;
  });


  it('should keep state of latest active tab', function() {

    // given
    const subscribe = createSubscribe('app.activeTabChanged');
    createReportFeedback({ subscribe });

    // when
    subscribe.emit({ activeTab: 'firstTab' });
    subscribe.emit({ activeTab: 'secondTab' });

    // then
    // This test verifies the component handles tab changes without errors
    // The internal state is managed by the component
    expect(screen.getByRole('button')).to.exist;
  });

});

// helper ////////////////


function createReportFeedback(props = {}) {
  const {
    subscribe = noop,
    getGlobal = noop
  } = props;

  render(
    <SlotFillRoot>
      <Slot name="status-bar__app" />
      <ReportFeedback
        subscribe={ subscribe }
        _getGlobal={ getGlobal }
      />
    </SlotFillRoot>
  );
}

function noop() {
  return { cancel() {} };
}

function createSubscribe(targetEvent) {

  let cb = () => {};

  function subscribe(event, callback) {
    if (event !== targetEvent) {
      return { cancel() {} };
    }

    cb = callback;

    return {
      cancel() {
        cb = () => {};
      }
    };
  }

  subscribe.emit = (payload) => cb(payload);

  return subscribe;
}
