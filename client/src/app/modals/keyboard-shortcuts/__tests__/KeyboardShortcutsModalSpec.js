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

import { KeyboardShortcutsModal } from '..';
import View from '../View';
import getShortcuts from '../getShortcuts';


const COMMAND_MODIFIER = 'Command';
const CTRL_MODIFIER = 'Control';


describe('<KeyboardShortcutsModal>', function() {

  describe('keyboard shortcuts', function() {

    it('should render shortcuts', function() {

      // when
      const { getByText } = renderOverlay();
      const shortcuts = getShortcuts(CTRL_MODIFIER);

      // then
      shortcuts.forEach((shortcut) => {
        expect(getByText(shortcut.label)).to.exist;
        expect(getByText(shortcut.binding)).to.exist;
      });
    });


    it('should render Mac OS shortcuts', function() {

      // when
      const { queryByText } = renderOverlay({
        platform: 'darwin'
      });

      // then
      expect(queryByText(COMMAND_MODIFIER, { exact: false })).to.exist;
      expect(queryByText(CTRL_MODIFIER, { exact: false })).to.not.exist;
    });


    it('should render Windows / Linux shortcuts', function() {

      // when
      const { queryByText } = renderOverlay({
        platform: 'linux'
      });

      // then
      expect(queryByText(COMMAND_MODIFIER, { exact: false })).to.not.exist;
      expect(queryByText(CTRL_MODIFIER, { exact: false })).to.exist;
    });

  });


  describe('<View>', function() {

    it('should render', function() {
      const { container } = render(<View />);
      expect(container).to.exist;
    });

  });

});


function renderOverlay(options = {}) {

  const platform = options.platform || 'win32';

  return render(<KeyboardShortcutsModal
    getGlobal={ mockGlobal(platform) }
  />);
}


function mockGlobal(platform) {

  return function(name) {
    if (name === 'backend') {
      return {
        getPlatform() {
          return platform;
        }
      };
    }

    throw new Error('global not found: ' + name);
  };
}