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

import { EngineProfile } from '../EngineProfile';

import {
  tab as defaultTab
} from './mocks';


describe('<EngineProfile>', function() {

  it('should render', function() {

    // given
    const wrapper = renderEngineProfile();

    // then
    expect(wrapper.exists()).to.be.true;
  });


  it('should open', function() {

    // given
    const engineProfile = 'Made Up Engine Profile';
    const tab = Object.assign({}, defaultTab, { meta: { engineProfile } });
    const wrapper = renderEngineProfile({ tab });

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
  });


  it('should close', function() {

    // given
    const engineProfile = 'Made Up Engine Profile';
    const tab = Object.assign({}, defaultTab, { meta: { engineProfile } });
    const wrapper = renderEngineProfile({ tab });
    wrapper.find('button').simulate('click');

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.false;
  });


  it('should work with BPMN (Platform)', function() {

    // given
    const engineProfile = 'Camunda Platform';
    const tab = Object.assign({}, defaultTab, { meta: { engineProfile } });
    const wrapper = renderEngineProfile({ tab });

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
  });


  it('should work with BPMN (Cloud) tab', function() {

    // given
    const engineProfile = 'Camunda Cloud';
    const tab = Object.assign({}, defaultTab, { meta: { engineProfile } });
    const wrapper = renderEngineProfile({ tab });

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
  });


  it('should work with DMN tab', function() {

    // given
    const engineProfile = 'Camunda Platform';
    const tab = Object.assign({}, defaultTab, { meta: { engineProfile } });
    const wrapper = renderEngineProfile({ tab });

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
  });


  it('should work with Forms tab', function() {

    // given
    const engineProfile = 'Camunda Platform or Cloud';
    const tab = Object.assign({}, defaultTab, { meta: { engineProfile } });
    const wrapper = renderEngineProfile({ tab });

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
  });
});


// helpers //////////////////////////////
function renderEngineProfile(options = {}) {
  return shallow(<EngineProfile tab={ options.tab || defaultTab } />);
}
