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


    it('should allow to save latest known xml when editor fails', function() {

      // given
      sinon.stub(MockEditor.prototype, 'render').throwsException();

      const {
        instance
      } = renderEditorTab();

      // when
      const result = instance.triggerAction('save');

      // then
      expect(result).to.be.eql(defaultTab.file.contents);
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
