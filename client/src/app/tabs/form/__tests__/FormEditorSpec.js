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

import React from 'react';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import {
  FormEditor
} from '../FormEditor';

import {
  getCopyCutPasteEntries,
  getUndoRedoEntries
} from '../getFormEditMenu';

import { createFormEditor } from 'test/mocks/form-js';

import schemaJSON from './form.json'

const schema = JSON.stringify(schemaJSON, null, 2);

const { spy } = sinon;


describe('<FormEditor>', function() {

  it('should render', async function() {
    const {
      instance
    } = await renderEditor(schema);

    expect(instance).to.exist;
  });


  it('#getXML', async function() {

    // given
    const { instance } = await renderEditor(schema, {
      onImport
    });

    async function onImport() {

      // when
      const exportedSchema = await instance.getXML();

      // then
      expect(exportedSchema).to.exist;
      expect(exportedSchema).to.eql(schema);
    }
  });


  describe('#listen', function() {

    function expectHandleChanged(event) {
      return async function() {
        const form = createFormEditor({ schema });

        const cache = new Cache();

        cache.add('editor', {
          cached: {
            attachForm() {},
            detachForm() {},
            form,
            lastSchema: schema
          },
          __destroy: () => {}
        });

        const changedSpy = spy();

        await renderEditor(schema, {
          id: 'editor',
          cache,
          onChanged: changedSpy
        });

        form._emit(event);

        expect(changedSpy).to.have.been.called;
      };
    }


    it('changed', expectHandleChanged('changed'));

    it('propertiesPanel.focusin', expectHandleChanged('propertiesPanel.focusin'));
    
    it('propertiesPanel.focusout', expectHandleChanged('propertiesPanel.focusout'));
    
    it('selection.changed', expectHandleChanged('selection.changed'));

  });


  describe('#handleChanged', function() {

    it('should notify about changes', async function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          dirty: false,
          inputActive: false,
          save: true
        });
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          attachForm() {},
          detachForm() {},
          form: createFormEditor({ schema }),
          lastSchema: schema,
          __destroy: () => {}
        }
      });

      const { instance } = await renderEditor(schema, {
        id: 'editor',
        cache,
        onChanged: changedSpy
      });

      // when
      instance.handleChanged();
    });


    describe('edit menu', function() {

      it('should provide undo/redo entries', async function() {

        // given
        const changedSpy = (state) => {

          const editMenuEntries = getUndoRedoEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);
        };

        const { instance } = await renderEditor(schema, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });


      it('should provide copy/paste entries', async function() {

        // given
        const changedSpy = (state) => {

          const editMenuEntries = getCopyCutPasteEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);
        };

        const { instance } = await renderEditor(schema, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });

    });

  });


  describe('import', function() {

    afterEach(sinon.restore);


    it('should import without errors', function(done) {

      // when
      renderEditor(schema, {
        onImport
      });

      // then
      function onImport(error) {
        try {
          expect(error).to.not.exist;

          done();
        } catch (error) {
          done(error);
        }
      }
    });


    it('should import with error', function(done) {

      // given
      const errorInducingFakeJSON = '{ "importError": true }';

      // when
      renderEditor(errorInducingFakeJSON, {
        onImport
      });

      // then
      function onImport(error) {
        try {
          expect(error).to.exist;

          done();
        } catch (error) {
          done(error);
        }
      }
    });


    it('should not import when provided JSON is the same as the cached one', async function() {

      // given
      const isImportNeededSpy = sinon.spy(FormEditor.prototype, 'isImportNeeded');
      const cache = new Cache();

      cache.add('editor', {
        cached: {
          attachForm() {},
          detachForm() {},
          form: createFormEditor({ schema }),
          lastSchema: schema,
          __destroy: () => {}
        }
      });

      await renderEditor(schema, {
        cache
      });

      // then
      expect(isImportNeededSpy).to.be.called;
      expect(isImportNeededSpy).to.have.always.returned(false);
    });


    it('should not import when props did not changed', async function() {

      // given
      const {
        instance
      } = await renderEditor(schema);

      const isImportNeededSpy = sinon.spy(instance, 'isImportNeeded');

      // when
      await instance.componentDidUpdate({
        xml: schema
      });

      // then
      expect(isImportNeededSpy).to.be.called;
      expect(isImportNeededSpy).to.have.always.returned(false);

    });


    it('should unset lastXML on import error', async function() {

      // given
      const { instance } = await renderEditor(schema, {
        onImport
      });

      async function onImport() {

        // assume
        expect(instance.getCached().lastSchema).to.equal(schema);

        // when
        await instance.handleError(new Error(), []);

        // then
        expect(instance.getCached().lastSchema).to.be.null;
      }
    });

  });


  describe('dirty state', function() {

    let instance;

    beforeEach(async function() {
      const form = createFormEditor({ schema });

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          attachForm() {},
          detachForm() {},
          form,
          lastSchema: schema
        },
        __destroy: () => {}
      });

      ({ instance } = await renderEditor(schema, {
        id: 'editor',
        cache
      }));
    });


    it('should NOT be dirty initially', function() {

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should be dirty after modeling', function() {

      // given
      const { form } = instance.getCached();

      // when
      form._emit('changed');

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.true;
    });


    it('should NOT be dirty after save', async function() {

      // given
      const { form } = instance.getCached();

      form._emit('changed');

      // when
      await instance.getXML();

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });

  });

});


// helpers //////////

function noop() {}

const TestEditor = WithCachedState(FormEditor);

async function renderEditor(schema, options = {}) {
  const {
    id,
    layout,
    onAction,
    onChanged,
    onContentUpdated,
    onError,
    onImport,
    onLayoutChanged,
    onModal,
    getConfig,
    getPlugins,
    isNew
  } = options;

  const wrapper = await mount(
    <TestEditor
      id={ id || 'editor' }
      xml={ schema }
      isNew={ isNew !== false }
      activeSheet={ options.activeSheet || { id: 'bpmn' } }
      onAction={ onAction || noop }
      onChanged={ onChanged || noop }
      onError={ onError || noop }
      onImport={ onImport || noop }
      onLayoutChanged={ onLayoutChanged || noop }
      onContentUpdated={ onContentUpdated || noop }
      onModal={ onModal || noop }
      getConfig={ getConfig || noop }
      getPlugins={ getPlugins || (() => []) }
      cache={ options.cache || new Cache() }
      layout={ layout || {} }
    />
  );

  const instance = wrapper.find(FormEditor).instance();

  return {
    instance,
    wrapper
  };
}