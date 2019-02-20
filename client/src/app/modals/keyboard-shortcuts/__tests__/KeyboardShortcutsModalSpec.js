/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import {
  mount,
  shallow
} from 'enzyme';

import { KeyboardShortcutsModal } from '..';
import View from '../View';
import getShortcuts from '../getShortcuts';

describe('<KeyboardShortcutsModal>', function() {

  it('should render', function() {
    shallow(<KeyboardShortcutsModal />);
  });

  describe('keyboard shortcuts', function() {

    const macModifierKey = 'Command',
          otherModifierKey = 'Control';

    it('should render shortcuts', function() {

      // given
      const isMac = true;

      // when
      const wrapper = mount(<KeyboardShortcutsModal
        isMac={ isMac }
      />);

      const shortcuts = getShortcuts(macModifierKey);

      const keyboardShortcuts = wrapper.find('.keyboard-shortcuts').first();

      // then
      expect(keyboardShortcuts).to.exist;
      expect(keyboardShortcuts.children()).to.have.lengthOf(shortcuts.length);

      wrapper.unmount();

    });


    it('should render with mac modifier key', function() {

      // given
      const isMac = true;

      // when
      const wrapper = mount(<KeyboardShortcutsModal
        isMac={ isMac }
      />);

      const keyboardShortcuts = wrapper.find('.keyboard-shortcuts').first();

      // then
      expect(keyboardShortcuts.text()).to.contain(macModifierKey);
      expect(keyboardShortcuts.text()).not.to.contain(otherModifierKey);

      wrapper.unmount();
    });



    it('should NOT render with mac modifier key', function() {

      // given
      const isMac = false;

      // when
      const wrapper = mount(<KeyboardShortcutsModal
        isMac={ isMac }
      />);

      const keyboardShortcuts = wrapper.find('.keyboard-shortcuts').first();

      // then
      expect(keyboardShortcuts.text()).not.to.contain(macModifierKey);
      expect(keyboardShortcuts.text()).to.contain(otherModifierKey);

      wrapper.unmount();

    });
  });


  describe('<View>', function() {

    it('should render', function() {
      shallow(<View />);
    });

  });

});
