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

import { mount } from 'enzyme';

import SettingsPlugin from '../SettingsPlugin';

import Settings from '../../../remote/Settings';

import { Modal } from '../../../shared/ui';



describe('SettingsPlugin', function() {

  it('should render', function() {

    // when
    const { wrapper } = render();

    // then
    expect(wrapper.find(Modal)).to.have.length(1);
  });

});


// helpers

const noop = () => {};

function render(props = {}) {

  const settings = new Settings({ config: {
    get: noop,
    set: noop,
  } });

  const subscribe = (_, cb) => {
    cb();
  };

  const wrapper = mount(
    <SettingsPlugin
      subscribe={ subscribe }
      triggerAction={ noop }
      _getGlobal={ () => settings }
      { ...props }
    />
  );

  return { wrapper, settings };
}