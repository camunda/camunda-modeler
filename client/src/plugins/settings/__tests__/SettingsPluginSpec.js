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

import { render, screen } from '@testing-library/react';

import SettingsPlugin from '../SettingsPlugin';

import Settings from '../../../app/Settings';


describe('SettingsPlugin', function() {

  it('should render', function() {

    // when
    renderSettings();

    // then
    expect(screen.getByRole('dialog')).to.exist;
  });

});


// helpers

const noop = () => {};

function renderSettings(props = {}) {

  const settings = new Settings({ config: {
    get: noop,
    set: noop,
  } });

  const subscribe = (_, cb) => {
    cb();
    return { cancel: noop };
  };

  return render(
    <SettingsPlugin
      subscribe={ subscribe }
      triggerAction={ noop }
      _getGlobal={ () => settings }
      { ...props }
    />
  );
}