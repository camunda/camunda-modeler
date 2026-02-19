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

import { render, waitFor, screen, act } from '@testing-library/react';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import { RPAEditor } from '../RPAEditor';

import { RPACodeEditor as MockRPACodeEditor } from 'test/mocks/rpa';

const RPA = '{"script": "Hello, World!", "executionPlatform": "Camunda Cloud",  "executionPlatformVersion": "8.8.0"}';
const INVALID_RPA = 'invalid rpa';

/* global sinon */

describe('<RPAEditor>', function() {

  describe('import', function() {

    it('should import with script', async function() {

      // this can take a while on macOS CI...
      this.timeout(30000);

      // given
      const onImportSpy = sinon.spy((errors) => {
        expect(errors).not.to.exist;
      });

      renderEditor(RPA, {
        onImport: onImportSpy,
        cache: new Cache()
      });

      await waitFor(() => {
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
      renderEditor(INVALID_RPA, {
        onImport: onImportSpy,
        cache: new Cache()
      });

      // then
      await waitFor(() => {
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

    it('should be dirty before first save', async function() {

      // given
      const { instance } = renderEditor(RPA, {
        cache: new Cache()
      });

      // then
      await waitFor(() => {
        expect(screen.getByText('RPA Script')).to.exist;
      });

      const dirty = instance.isDirty();

      expect(dirty).to.be.true;
    });


    it('should NOT be dirty after save', async function() {

      // given
      const { instance } = renderEditor(RPA, {
        cache: new Cache()
      });

      // when
      await waitFor(() => {
        expect(screen.getByText('RPA Script')).to.exist;
      });

      await instance.getXML();

      // then
      await waitFor(() => {
        const dirty = instance.isDirty();
        expect(dirty).to.be.false;
      });
    });


    it('should be dirty after modeling', async function() {

      // given
      const { instance } = renderEditor(RPA, {
        cache: new Cache()
      });

      await waitFor(() => {
        expect(screen.getByText('RPA Script')).to.exist;
      });

      await instance.getXML();

      // when
      const { editor } = instance.getCached();
      act(() => {
        editor.eventBus.fire('property.change', {
          key: 'script',
          value: 'new value'
        });
      });

      // then
      // State update is async
      await waitFor(() => {
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


  describe('linting', function() {

    describe('behavior', function() {

      it('should lint on import', async function() {

        // given
        const onActionSpy = sinon.spy();

        // when
        renderEditor(RPA, {
          onAction: onActionSpy
        });

        // then
        await waitFor(() => {
          const calls = onActionSpy.getCalls()
            .filter(call => call.args[0] === 'lint-tab');

          expect(calls).to.have.lengthOf(1);
        });

      });


      it('should lint on model.changed', async function() {

        // given
        const onActionSpy = sinon.spy();

        const { instance } = renderEditor(RPA, {
          onAction: onActionSpy
        });


        await waitFor(() => {
          const calls = onActionSpy.getCalls()
            .filter(call => call.args[0] === 'lint-tab');

          expect(calls).to.have.lengthOf(1);
        });

        // when
        const { editor } = instance.getCached();

        act(() => {
          editor.eventBus.fire('model.changed');
        });

        await waitFor(() => {
          const calls = onActionSpy.getCalls()
            .filter(call => call.args[0] === 'lint-tab');

          // then
          expect(calls).to.have.lengthOf(2);
        });
      });


      it('should unsubscribe on unmount', async function() {

        // given
        const onActionSpy = sinon.spy();

        const {
          instance,
          unmount
        } = renderEditor(RPA, {
          onAction: onActionSpy
        });

        const { editor } = instance.getCached();

        // when
        unmount();

        editor.eventBus.fire('model.changed');

        await waitFor(() => {
          const calls = onActionSpy.getCalls()
            .filter(call => call.args[0] === 'lint-tab');

          // then
          expect(calls).to.have.lengthOf(1);
        });
      });


      it('should NOT break application with linting tab open', async function() {

        // given
        const props = {
          layout: {
            panel: {
              open: true,
              tab: 'linting'
            }
          }
        };

        // when
        try {
          renderEditor(RPA, props);
        } catch (error) {

          // then
          expect(true, 'should not reach error block').to.be.false;
        }
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
    onImport,
    ...props
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

  const ref = React.createRef();

  const rendered = render(
    <TestEditor
      ref={ ref }
      getConfig={ () => ({}) }
      onAction={ noop }
      onImport={ onImport || noop }
      id={ id || 'editor' }
      xml={ xml }
      activeSheet={ options.activeSheet || { id: 'xml' } }
      onChanged={ onChanged || noop }
      layout={ options.layout || {} }
      cache={ cache }
      { ...props }
    />
  );

  return {
    ...rendered,
    instance: ref.current
  };
}