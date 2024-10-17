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

import { shallow } from 'enzyme';

import { VersionInfo } from '../VersionInfo';

import Flags, { DISPLAY_VERSION } from '../../../util/Flags';

import { Config } from '../../../app/__tests__/mocks';
import Metadata from '../../../util/Metadata';

/* global sinon */


describe('<VersionInfo>', function() {

  it('should render', function() {

    // given
    const render = () => createVersionInfo();

    // then
    expect(render).not.to.throw();
  });


  it('should open when button is clicked', function() {

    // given
    const wrapper = createVersionInfo();

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.exists('VersionInfoOverlay'), 'Overlay should be displayed').to.be.true;
  });


  it('should open via menu events', function() {

    // given
    const subscribe = createSubscribe();
    const wrapper = createVersionInfo({ subscribe });

    // when
    subscribe.emit({ source: 'menu' });

    // then
    expect(wrapper.exists('VersionInfoOverlay'), 'Overlay should be displayed').to.be.true;
  });


  it('should close when button is clicked again', function() {

    // given
    const wrapper = createVersionInfo();

    // when
    wrapper.find('button').simulate('click');
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.exists('VersionInfoOverlay'), 'Overlay should be gone').to.be.false;
  });


  describe('unread marker', function() {

    beforeEach(function() {
      Metadata.init({ version: 'TEST_VERSION' });
    });


    it('should display unread marker when app is opened for the first time', function() {

      // given
      const wrapper = createVersionInfo();

      // then
      expect(wrapper.exists('UnreadMarker'), 'Unread marker should be displayed').to.be.true;
    });


    it('should display unread marker when current version is opened for the first time', function() {

      // given
      const get = key => key === 'versionInfo' && { lastOpenedVersion: 'OLD' };
      const config = new Config({ get });
      const wrapper = createVersionInfo({ config });

      // then
      expect(wrapper.exists('UnreadMarker'), 'Unread marker should be displayed').to.be.true;
    });


    it('should NOT display unread marker when overlay is clicked', function() {

      // given
      const get = key => key === 'versionInfo' && { lastOpenedVersion: 'OLD' };
      const config = new Config({ get });
      const wrapper = createVersionInfo({ config });

      // when
      wrapper.find('button').simulate('click');

      // then
      return expectEventually(wrapper, () => {
        expect(wrapper.exists('UnreadMarker'), 'Unread marker should be gone').to.be.false;
      });
    });


    it('should NOT display unread marker if it has been already opened', function() {

      // given
      const get = key => key === 'versionInfo' && { lastOpenedVersion: 'TEST_VERSION' };
      const config = new Config({ get });
      const wrapper = createVersionInfo({ config });

      // then
      return expectEventually(wrapper, () => {
        expect(wrapper.exists('UnreadMarker'), 'Unread marker should be gone').to.be.false;
      });
    });
  });


  describe('events', function() {

    it('should notify that overlay was opened', function() {

      // given
      const triggerAction = sinon.spy();
      const wrapper = createVersionInfo({ triggerAction });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(triggerAction).to.have.been.calledOnceWith(
        'emit-event', { type: 'versionInfo.opened', payload: { type: 'open', source: 'statusBar' } }
      );
    });


    it('should propagate the source', function() {

      // given
      const triggerAction = sinon.spy();
      const wrapper = createVersionInfo({ triggerAction });
      const instance = wrapper.instance();

      // when
      instance.open('menu');

      // then
      expect(triggerAction).to.have.been.calledOnceWith(
        'emit-event', { type: 'versionInfo.opened', payload: { type: 'open', source: 'menu' } }
      );
    });


    it('should NOT notify again when overlay is already open', function() {

      // given
      const triggerAction = sinon.spy();
      const subscribe = createSubscribe();
      const wrapper = createVersionInfo({ subscribe, triggerAction });
      const instance = wrapper.instance();
      instance.open('menu');
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

      const wrapper = createVersionInfo();

      // when
      const buttonHtml = wrapper.find('button').html();

      // then
      expect(buttonHtml).to.contain('0.1.2');
    });


    it('should show custom version if configured via flag', async function() {

      // given
      Flags.init({ [ DISPLAY_VERSION ]: '1.2.3.4' });

      const wrapper = createVersionInfo();

      // when
      const buttonHtml = wrapper.find('button').html();

      // then
      expect(buttonHtml).to.contain('1.2.3.4');
    });

  });

});


function createVersionInfo(props = {}, mount = shallow) {
  const {
    config = new Config(),
    subscribe = noop,
    triggerAction = noop
  } = props;

  return mount(
    <VersionInfo
      config={ config }
      subscribe={ subscribe }
      triggerAction={ triggerAction }
    />
  );
}

function noop() {}

async function expectEventually(wrapper, expectStatement) {
  const sleep = time => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  };

  for (let i = 0; i < 10; i++) {
    wrapper.update();

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
