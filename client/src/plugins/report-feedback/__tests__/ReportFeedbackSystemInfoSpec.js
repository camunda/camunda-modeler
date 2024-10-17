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

import { ReportFeedbackSystemInfoSection } from '../ReportFeedbackSystemInfoSection';


describe('<ReportFeedbackSystemInfoSection>', function() {

  it('should render', function() {

    // when
    const render = () => createReportFeedbackSystemInfo();

    // then
    expect(render).not.to.throw();
  });

});

function createReportFeedbackSystemInfo(props = {}, mount = shallow) {
  return mount(
    <ReportFeedbackSystemInfoSection
      onSubmit={ props.onSubmit || noop }
    />
  );
}

function noop() {}
