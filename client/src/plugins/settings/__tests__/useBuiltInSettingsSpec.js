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

import { render } from '@testing-library/react';

import useBuiltInSettings, { schema } from '../useBuiltInSettings';

import Settings from '../../../app/Settings';


function TestComponent({ settings }) {
  useBuiltInSettings(settings);
  return null;
}

const noop = () => {};

function createSettings() {
  return new Settings({ config: { get: noop, set: noop } });
}


describe('useBuiltInSettings', function() {

  it('should use latest stable versions', function() {

    // then
    expect(schema.properties['app.defaultC8Version'].default).to.equal('8.9.0');
    expect(schema.properties['app.defaultC7Version'].default).to.equal('7.24.0');
  });


  it('should not throw when re-mounted with the same settings instance (strict mode)', function() {

    // given - initial mount registers settings
    const settings = createSettings();
    const { unmount } = render(<TestComponent settings={ settings } />);

    // when - unmount triggers cleanup (unregister), then remount re-registers
    unmount();

    // then - second mount must not throw
    expect(() => render(<TestComponent settings={ settings } />)).not.to.throw();
  });

});
