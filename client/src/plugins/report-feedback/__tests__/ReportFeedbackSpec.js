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

import { ReportFeedback } from '../ReportFeedback';


describe('<ReportFeedback>', function() {

  it('should render', function() {

    // given
    const render = () => createReportFeedback();

    // then
    expect(render).not.to.throw();
  });


  it('should open when button is clicked', function() {

    // given
    const wrapper = createReportFeedback();

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.exists('ReportFeedbackOverlay'), 'Overlay should be displayed').to.be.true;
  });


  it('should open via menu events', function() {

    // given
    const subscribe = createSubscribe('reportFeedback.open');
    const wrapper = createReportFeedback({ subscribe });

    // when
    subscribe.emit({ source: 'menu' });

    // then
    expect(wrapper.exists('ReportFeedbackOverlay'), 'Overlay should be displayed').to.be.true;
  });


  it('should close when button is clicked again', function() {

    // given
    const wrapper = createReportFeedback();

    // when
    wrapper.find('button').simulate('click');
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.exists('ReportFeedbackOverlay'), 'Overlay should be gone').to.be.false;
  });


  it('should keep state of latest active tab', function() {

    // given
    const subscribe = createSubscribe('app.activeTabChanged');
    const wrapper = createReportFeedback({ subscribe });

    // when
    subscribe.emit({ activeTab: 'firstTab' });
    subscribe.emit({ activeTab: 'secondTab' });

    // then
    expect(wrapper.state('activeTab')).to.equal('secondTab');
  });

});

// helper ////////////////


function createReportFeedback(props = {}, mount = shallow) {
  const {
    subscribe = noop,
    getGlobal = noop
  } = props;

  return mount(
    <ReportFeedback
      subscribe={ subscribe }
      _getGlobal={ getGlobal }
    />
  );
}

function noop() {}

function createSubscribe(targetEvent) {

  let cb = noop;

  function subscribe(event, callback) {
    if (event !== targetEvent) {
      return;
    }

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
