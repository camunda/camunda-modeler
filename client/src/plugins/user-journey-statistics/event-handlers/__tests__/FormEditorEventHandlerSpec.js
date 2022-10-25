/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import MixpanelHandler from '../../MixpanelHandler';

import {
  LAYOUT_CHANGED_EVENT_NAME,
  INPUT_DATA_CHANGED_EVENT_NAME,
  PREVIEW_CHANGED_EVENT_NAME,
  default as FormEditorEventHandler
} from '../FormEditorEventHandler';

import engineProfilePlatform from './fixtures/engine-platform.form';

import engineProfileCloud from './fixtures/engine-cloud.form';


describe('<FormEditorEventHandler>', () => {

  let subscribe, track;

  beforeEach(() => {

    subscribe = sinon.spy();

    track = sinon.spy();

    new FormEditorEventHandler({
      track,
      subscribe
    });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });


  describe('formEditor:layoutChanged', () => {


    it('should subscribe to form.modeler.playgroundLayoutChanged', () => {

      // then
      expect(subscribe.getCall(0).args[0]).to.eql('form.modeler.playgroundLayoutChanged');
    });


    it('should send layout', async () => {

      // given
      const tab = createTab({
        file: {},
        type: 'form'
      });

      const layout = {
        'form-preview': { open: true },
        'form-input': { open: false },
        'form-output': { open: true }
      };

      const handleLayoutChanged = subscribe.getCall(0).args[1];

      // when
      await handleLayoutChanged({
        tab,
        layout
      });

      // then
      expect(track).to.have.been.calledWith(LAYOUT_CHANGED_EVENT_NAME, {
        layout
      });

    });


    it('should send triggeredBy', async () => {

      // given
      const tab = createTab({
        file: {},
        type: 'form'
      });

      const layout = {
        'form-preview': { open: true },
        'form-input': { open: false },
        'form-output': { open: true }
      };

      const triggeredBy = 'foo';

      const handleLayoutChanged = subscribe.getCall(0).args[1];

      // when
      await handleLayoutChanged({
        tab,
        layout,
        triggeredBy
      });

      // then
      expect(track).to.have.been.calledWith(LAYOUT_CHANGED_EVENT_NAME, {
        layout,
        triggeredBy
      });

    });


    it('should send engine profile - C7', async () => {

      // given
      const tab = createTab({
        file: { contents: engineProfilePlatform },
        type: 'form'
      });

      const handleLayoutChanged = subscribe.getCall(0).args[1];

      // when
      await handleLayoutChanged({
        tab
      });

      // then
      expect(track).to.have.been.calledWith(LAYOUT_CHANGED_EVENT_NAME, {
        layout: undefined,
        executionPlatform: 'Camunda Platform',
        executionPlatformVersion: '7.15'
      });
    });


    it('should send engine profile - C8', async () => {

      // given
      const tab = createTab({
        file: { contents: engineProfileCloud },
        type: 'form'
      });

      const handleLayoutChanged = subscribe.getCall(0).args[1];

      // when
      await handleLayoutChanged({
        tab
      });

      expect(track).to.have.been.calledWith(LAYOUT_CHANGED_EVENT_NAME, {
        layout: undefined,
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '1.1'
      });

    });

  });


  describe('formEditor:inputDataChanged', () => {


    it('should subscribe to form.modeler.inputDataChanged', () => {

      // then
      expect(subscribe.getCall(1).args[0]).to.eql('form.modeler.inputDataChanged');
    });


    it('should send engine profile - C7', async () => {

      // given
      const tab = createTab({
        file: { contents: engineProfilePlatform },
        type: 'form'
      });

      const handleInputDataChanged = subscribe.getCall(1).args[1];

      // when
      await handleInputDataChanged({
        tab
      });

      // then
      expect(track).to.have.been.calledWith(INPUT_DATA_CHANGED_EVENT_NAME, {
        executionPlatform: 'Camunda Platform',
        executionPlatformVersion: '7.15'
      });
    });


    it('should send engine profile - C8', async () => {

      // given
      const tab = createTab({
        file: { contents: engineProfileCloud },
        type: 'form'
      });

      const handleInputDataChanged = subscribe.getCall(1).args[1];

      // when
      await handleInputDataChanged({
        tab
      });

      expect(track).to.have.been.calledWith(INPUT_DATA_CHANGED_EVENT_NAME, {
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '1.1'
      });

    });

  });


  describe('formEditor:previewChanged', () => {


    it('should subscribe to form.modeler.previewChanged', () => {

      // then
      expect(subscribe.getCall(2).args[0]).to.eql('form.modeler.previewChanged');
    });


    it('should send engine profile - C7', async () => {

      // given
      const tab = createTab({
        file: { contents: engineProfilePlatform },
        type: 'form'
      });

      const handleInputDataChanged = subscribe.getCall(2).args[1];

      // when
      await handleInputDataChanged({
        tab
      });

      // then
      expect(track).to.have.been.calledWith(PREVIEW_CHANGED_EVENT_NAME, {
        executionPlatform: 'Camunda Platform',
        executionPlatformVersion: '7.15'
      });
    });


    it('should send engine profile - C8', async () => {

      // given
      const tab = createTab({
        file: { contents: engineProfileCloud },
        type: 'form'
      });

      const handleInputDataChanged = subscribe.getCall(2).args[1];

      // when
      await handleInputDataChanged({
        tab
      });

      expect(track).to.have.been.calledWith(PREVIEW_CHANGED_EVENT_NAME, {
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '1.1'
      });

    });

  });

});



// helpers //////

function createTab(overrides = {}) {
  return {
    id: 42,
    name: 'foo.bar',
    type: 'bar',
    title: 'foo',
    file: {
      name: 'foo.bar',
      contents: '',
      path: null
    },
    ...overrides
  };
}