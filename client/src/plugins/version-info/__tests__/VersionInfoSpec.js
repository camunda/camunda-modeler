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

import { Config } from '../../../app/__tests__/mocks';
import Metadata from '../../../util/Metadata';

/* global sinon */


describe('<VersionInfo>', () => {

  it('should render', () => {

    // given
    const render = () => createVersionInfo();

    // then
    expect(render).not.to.throw();
  });


  it('should listen to menu events', () => {

    // given
    const subscribe = sinon.spy();
    createVersionInfo({ subscribe });

    // then
    expect(subscribe).to.have.been.calledOnceWith('versionInfo.open');
  });


  it('should open when button is clicked', () => {

    // given
    const wrapper = createVersionInfo();

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.exists('VersionInfoOverlay'), 'Overlay should be displayed').to.be.true;
  });


  it('should close when button is clicked again', () => {

    // given
    const wrapper = createVersionInfo();

    // when
    wrapper.find('button').simulate('click');
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.exists('VersionInfoOverlay'), 'Overlay should be gone').to.be.false;
  });


  describe('unread marker', () => {

    beforeEach(() => {
      Metadata.init({ version: 'TEST_VERSION' });
    });


    it('should display unread marker when app is opened for the first time', () => {

      // given
      const wrapper = createVersionInfo();

      // then
      expect(wrapper.exists('UnreadMarker'), 'Unread marker should be displayed').to.be.true;
    });


    it('should display unread marker when current version is opened for the first time', () => {

      // given
      const get = key => key === 'versionInfo' && { lastOpenedVersion: 'OLD' };
      const config = new Config({ get });
      const wrapper = createVersionInfo({ config });

      // then
      expect(wrapper.exists('UnreadMarker'), 'Unread marker should be displayed').to.be.true;
    });


    it('should NOT display unread marker when overlay is clicked', () => {

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


    it('should NOT display unread marker when has been already opened', () => {

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
});


function createVersionInfo(props = {}, mount = shallow) {
  const {
    config = new Config(),
    subscribe
  } = props;

  return mount(
    <VersionInfo
      config={ config }
      subscribe={ subscribe || noop }
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
