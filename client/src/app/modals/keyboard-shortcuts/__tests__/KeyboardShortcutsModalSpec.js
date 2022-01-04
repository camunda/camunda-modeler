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

import { KeyboardShortcutsModal } from '..';
import View from '../View';
import getShortcuts from '../getShortcuts';


const COMMAND_MODIFIER = 'Command';
const CTRL_MODIFIER = 'Control';


describe('<KeyboardShortcutsModal>', function() {

  it('should render', function() {
    shallow(<KeyboardShortcutsModal getGlobal={ mockGlobal('foo') } />);
  });


  describe('keyboard shortcuts', function() {

    it('should render shortcuts', function() {

      // when
      const { keyboardShortcuts } = renderOverlay();

      const shortcuts = getShortcuts(COMMAND_MODIFIER);

      // then
      expect(keyboardShortcuts).to.exist;
      expect(keyboardShortcuts.children()).to.have.lengthOf(shortcuts.length);
    });


    it('should render Mac OS shortcuts', function() {

      // when
      const { keyboardShortcuts } = renderOverlay({
        platform: 'darwin'
      });

      // then
      expect(keyboardShortcuts.text()).to.contain(COMMAND_MODIFIER);
      expect(keyboardShortcuts.text()).not.to.contain(CTRL_MODIFIER);
    });


    it('should render Windows / Linux shortcuts', function() {

      // when
      const { keyboardShortcuts } = renderOverlay({
        platform: 'linux'
      });

      // then
      expect(keyboardShortcuts.text()).not.to.contain(COMMAND_MODIFIER);
      expect(keyboardShortcuts.text()).to.contain(CTRL_MODIFIER);
    });

  });


  describe('<View>', function() {

    it('should render', function() {
      shallow(<View />);
    });

  });

});


function renderOverlay(options = {}) {

  const platform = options.platform || 'win32';

  const wrapper = mount(<KeyboardShortcutsModal
    getGlobal={ mockGlobal(platform) }
  />);

  const keyboardShortcuts = wrapper.find('.keyboard-shortcuts').first();

  return {
    keyboardShortcuts
  };
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