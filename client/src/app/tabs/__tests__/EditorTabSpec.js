/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import TestRenderer from 'react-test-renderer';

import { createTab } from './../EditorTab';
import ErrorTab from './../ErrorTab';

import {
  Editor as MockEditor,
  providers as defaultProviders,
  tab as defaultTab
} from './mocks';

/* global sinon */


describe('<EditorTab>', function() {

  describe('render', function() {

    it('should render', function() {

      // when
      const {
        instance
      } = renderEditorTab();

      // then
      expect(instance, 'did not render').to.exist;
    });

  });


  describe('error handling', function() {

    afterEach(sinon.restore);


    it('should display ErrorTab when editor fails', function() {

      // given
      sinon.stub(MockEditor.prototype, 'render').throwsException();

      // when
      const {
        wrapper
      } = renderEditorTab();

      // then
      verifyChildIsPresent(wrapper, ErrorTab);
    });

  });

});


// helpers //////////////////////////////

function noop() {}

function renderEditorTab({
  onError = noop,
  onShown = noop,
  providers = defaultProviders,
  tab = defaultTab
} = {}) {

  const EditorTab = createTab(tab.name, providers);

  const testRenderer = TestRenderer.create(
    <EditorTab
      tab={ tab }
      onError={ onError }
      onShown={ onShown }
    />
  );

  const instance = testRenderer.getInstance();

  return {
    instance,
    wrapper: testRenderer.root
  };
}

function verifyChildIsPresent(wrapper, childType) {
  function isChildPresent() {
    return wrapper.findByType(childType);
  }

  expect(isChildPresent, `did not display ${childType.name}`).to.not.throw();
}
