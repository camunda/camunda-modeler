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
import { waitFor } from '@testing-library/react';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import { RPAEditor } from '../RPAEditor';

import { RPACodeEditor as MockRPACodeEditor } from 'test/mocks/rpa';

const RPA = '{"script": "Hello, World!"}';
const INVALID_RPA = 'invalid rpa';

/* global sinon */

describe('<RPAEditor>', function() {

  describe('import', function() {

    it('should import with script', async function() {

      // given
      const onImportSpy = sinon.spy((errors) => {
        expect(errors).not.to.exist;
      });

      const {
        instance
      } = await renderEditor(RPA, {
        onImport: onImportSpy,
        cache: new Cache()
      });

      return waitFor(() => {
        expect(instance).to.exist;
        expect(onImportSpy).to.have.been.calledOnce;
        expect(onImportSpy.args[0][0]).not.to.exist;
      });
    });


    it('should report import errors', async function() {

      // given
      const onImportSpy = sinon.spy((errors) => {
        expect(errors).to.exist;
      });

      // when
      await renderEditor(INVALID_RPA, {
        onImport: onImportSpy,
        cache: new Cache()
      });

      // then
      return waitFor(() => {
        expect(onImportSpy).to.have.been.calledOnce;
        expect(onImportSpy.args[0][0]).to.exist;
      });
    });

  });


  it('#getXML', function() {

    // given
    const {
      instance
    } = renderEditor(RPA);

    // then
    expect(instance.getXML()).to.be.equal(RPA);
  });


  describe('#handleChanged', function() {

    it('should notify about changes', function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          dirty: true,
          undo: true,
          redo: true,
        });
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: RPA,
          editor: new MockRPACodeEditor(),
          editorContainer: document.createElement('div'),
          propertiesContainer: document.createElement('div')
        }
      });

      const { instance } = renderEditor(RPA, {
        id: 'editor',
        cache,
        onChanged: changedSpy
      });

      const { editor } = instance.getCached();

      editor.value = 'new value';
      editor.canUndo = true;
      editor.canRedo = true;

      // when
      editor.eventBus.fire('model.changed');
    });

  });


  describe('dirty state', function() {

    let instance;

    beforeEach(async function() {
      let resolve;
      const promise = new Promise(r => resolve = r);
      instance = renderEditor(RPA, {
        onImport: resolve,
        cache: new Cache()
      }).instance;


      return promise;
    });


    it('should be dirty before first save', function() {

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.true;
    });


    it('should NOT be dirty after save', async function() {

      // when
      await instance.getXML();

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should be dirty after modeling', async function() {

      // given
      await instance.getXML();

      // when
      const { editor } = instance.getCached();
      editor.eventBus.fire('property.change', {
        key: 'script',
        value: 'new value'
      });

      // then
      // State update is async
      return waitFor(() => {
        const dirty = instance.isDirty();
        expect(dirty).to.be.true;
      });
    });

  });


  describe('actions', function() {

    let instance;

    beforeEach(function() {
      instance = renderEditor(RPA).instance;
    });

    [ 'undo', 'redo' ].forEach(action => {

      it(`should trigger ${action}`, function() {

        // given
        const { editor } = instance.getCached();

        const triggerSpy = sinon.spy(editor.editor, 'trigger');

        // when
        instance.triggerAction(action);

        // then
        expect(triggerSpy).to.have.been.calledWith('menu', action);
      });

    });

    [
      [ 'find', 'actions.find' ],
      [ 'findNext', 'editor.action.nextMatchFindAction' ],
      [ 'findPrev', 'editor.action.previousMatchFindAction' ],
      [ 'replace', 'editor.action.startFindReplaceAction' ]
    ].forEach(([ action, monacoAction ]) => {

      it(`should map ${action} to monaco action`, function() {

        // given
        const { editor } = instance.getCached();

        const getActionStub = sinon.stub(editor.editor, 'getAction');

        const runSpy = sinon.spy();

        getActionStub.withArgs(monacoAction).returns({ run: runSpy });

        // when
        instance.triggerAction(action);

        // then
        expect(runSpy).to.have.been.calledOnce;
      });

    });

  });

});

// helpers //////////

function noop() {}

const TestEditor = WithCachedState(RPAEditor);

function renderEditor(xml, options = {}) {
  const {
    id,
    onChanged,
    onImport
  } = options;

  let cache = options.cache;

  if (!cache) {
    cache = new Cache();
    cache.add('editor', {
      cached: {
        editor: new MockRPACodeEditor({ value: xml }),
        lastXML: xml,
        editorContainer: document.createElement('div'),
        propertiesContainer: document.createElement('div')
      }
    });
  }

  const component = mount(
    <TestEditor
      getConfig={ () => ({}) }
      onImport={ onImport || noop }
      id={ id || 'editor' }
      xml={ xml }
      activeSheet={ options.activeSheet || { id: 'xml' } }
      onChanged={ onChanged || noop }
      layout={ options.layout || {} }
      cache={ cache }
    />
  );

  const wrapper = component.find(RPAEditor);

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
  };
}