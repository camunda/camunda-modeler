/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import { createTab } from './../EditorTab';

import { mount } from 'enzyme';

import {
  providers as defaultProviders,
  tab as defaultTab
} from './mocks';


describe('<EditorTab>', function() {

  describe('render', function() {

    it('should render', function() {
      const {
        instance
      } = renderEditorTab();

      expect(instance).to.exist;
    });

  });

});


// helpers //////////////////////////////

function noop() {}

function renderEditorTab({
  tab = defaultTab,
  onError = noop,
  onShown = noop
} = {}) {

  const EditorTab = createTab(defaultTab.name, defaultProviders);

  const wrapper = mount(
    <EditorTab
      tab={ tab }
      onError={ onError }
      onShown={ onShown }
    />
  );

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
  };
}