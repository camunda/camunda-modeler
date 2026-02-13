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

import { VersionInfo } from '../VersionInfo';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

import Flags, { DISPLAY_VERSION } from '../../../util/Flags';

import { Config } from '../../../app/__tests__/mocks';
import Metadata from '../../../util/Metadata';

/* global sinon */


describe('<VersionInfo>', function() {

  it('should open when button is clicked', function() {

    // given
    createVersionInfo();

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    expect(screen.getByRole('dialog')).to.exist;
  });


  it('should open via menu events', async function() {

    // given
    const subscribe = createSubscribe();
    createVersionInfo({ subscribe });

    // when
    subscribe.emit({ source: 'menu' });

    // then
    await waitFor(() => {
      expect(screen.getByRole('dialog'), 'Overlay should be displayed').to.exist;
    });
  });


  it('should close when button is clicked again', function() {

    // given
    createVersionInfo();

    // when
    fireEvent.click(screen.getByRole('button'));

    // assume
    expect(screen.getByRole('dialog'), 'Overlay should be displayed').to.exist;

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    expect(screen.queryByRole('dialog'), 'Overlay should be gone').to.be.null;
  });


  describe('unread marker', function() {

    beforeEach(function() {
      Metadata.init({ version: 'TEST_VERSION' });
    });


    it('should display unread marker when app is opened for the first time', function() {

      // given
      createVersionInfo();

      // then
      expect(screen.getByLabelText('unread'), 'Unread marker should be displayed').to.exist;
    });


    it('should display unread marker when current version is opened for the first time', function() {

      // given
      const get = key => key === 'versionInfo' && { lastOpenedVersion: 'OLD' };
      const config = new Config({ get });
      createVersionInfo({ config });

      // then
      expect(screen.getByLabelText('unread'), 'Unread marker should be displayed').to.exist;
    });


    it('should NOT display unread marker when overlay is clicked', function() {

      // given
      const get = key => key === 'versionInfo' && { lastOpenedVersion: 'OLD' };
      const config = new Config({ get });
      createVersionInfo({ config });

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      return expectEventually(() => {
        expect(screen.queryByLabelText('unread'), 'Unread marker should be gone').to.be.null;
      });
    });


    it('should NOT display unread marker if it has been already opened', function() {

      // given
      const get = key => key === 'versionInfo' && { lastOpenedVersion: 'TEST_VERSION' };
      const config = new Config({ get });
      createVersionInfo({ config });

      // then
      return expectEventually(() => {
        expect(screen.queryByLabelText('unread'), 'Unread marker should be gone').to.be.null;
      });
    });
  });


  describe('events', function() {

    it('should notify that overlay was opened', function() {

      // given
      const triggerAction = sinon.spy();
      createVersionInfo({ triggerAction });

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(triggerAction).to.have.been.calledOnceWith(
        'emit-event', { type: 'versionInfo.opened', payload: { type: 'open', source: 'statusBar' } }
      );
    });


    it('should propagate the source', async function() {

      // given
      const triggerAction = sinon.spy();
      const subscribe = createSubscribe();
      createVersionInfo({ subscribe, triggerAction });

      // when
      subscribe.emit({ source: 'menu' });

      // then
      await waitFor(() => {
        expect(triggerAction).to.have.been.calledOnceWith(
          'emit-event', { type: 'versionInfo.opened', payload: { type: 'open', source: 'menu' } }
        );
      });
    });


    it('should NOT notify again when overlay is already open', async function() {

      // given
      const triggerAction = sinon.spy();
      const subscribe = createSubscribe();
      createVersionInfo({ subscribe, triggerAction });
      subscribe.emit({ source: 'menu' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).to.exist;
      });

      triggerAction.resetHistory();

      // when
      subscribe.emit({ source: 'menu' });

      // then
      expect(triggerAction).to.not.have.been.called;
    });
  });


  describe('version', function() {

    it('should show version from Metadata', async function() {

      // given
      Metadata.init({ version: '0.1.2' });

      createVersionInfo();

      // when
      const buttonHtml = screen.getByRole('button').innerHTML;

      // then
      expect(buttonHtml).to.contain('0.1.2');
    });


    it('should show custom version if configured via flag', async function() {

      // given
      Flags.init({ [ DISPLAY_VERSION ]: '1.2.3.4' });

      createVersionInfo();

      // when
      const buttonHtml = screen.getByRole('button').innerHTML;

      // then
      expect(buttonHtml).to.contain('1.2.3.4');
    });

  });

});


function createVersionInfo(props = {}) {
  const {
    config = new Config(),
    subscribe = noop,
    triggerAction = noop
  } = props;

  render(
    <SlotFillRoot>
      <Slot name="status-bar__app" />
      <VersionInfo
        config={ config }
        subscribe={ subscribe }
        triggerAction={ triggerAction }
      />
    </SlotFillRoot>
  );
}

function noop() {
  return { cancel() {} };
}

async function expectEventually(expectStatement) {
  const sleep = time => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  };

  for (let i = 0; i < 10; i++) {
    try {
      expectStatement();

      // success
      return;
    } catch {

      // do nothing
    }

    await sleep(50);
  }

  // let it fail correctly
  expectStatement();
}

function createSubscribe() {

  let cb = noop;

  function subscribe(_, callback) {
    cb = callback;

    return {
      cancel() {
        cb = noop;
      }
    };
  }

  subscribe.emit = (payload) => cb(payload);

  return subscribe;
}
