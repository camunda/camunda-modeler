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

import {
  mount,
  shallow
} from 'enzyme';

import StartInstanceConfigModal from '../StartInstanceConfigModal';

describe('<StartInstanceConfigModal>', () => {

  it('should render', () => {
    createModal();
  });


  it('should render with customizations', () => {

    // given
    const options = {
      title: 'title',
    };

    // when
    const { wrapper } = createModal(options, mount);

    const titleWrapper = wrapper.find('.modal-title');

    // then
    expect(titleWrapper.text()).to.eql(options.title);
  });

});


// helpers //////////

function createModal(props={}, renderFn = shallow) {

  const {
    configuration,
    onClose,
    title,
  } = props;


  const wrapper = renderFn(
    <StartInstanceConfigModal
      configuration={ configuration || getDefaultConfiguration() }
      onClose={ onClose || noop }
      title={ title }
    />
  );

  return {
    wrapper,
    instance: wrapper.instance()
  };
}

function noop() {}

function getDefaultConfiguration() {
  return {
    businessKey: 'default'
  };
}
