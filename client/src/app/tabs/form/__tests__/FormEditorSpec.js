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
  DEFAULT_ENGINE_PROFILE,
  FORM_PREVIEW_TRIGGER,
  FormEditor
} from '../FormEditor';

import {
  getDefaultCopyCutPasteEntries,
  getSelectionEntries,
  getUndoRedoEntries
} from '../../getEditMenu';

import { FormPlayground as FormPlaygroundMock } from 'test/mocks/form-js';

import schema from './form.form';

import engineProfileSchema from '../../__tests__/EngineProfile.platform.form';
import noEngineProfile from '../../__tests__/EngineProfile.vanilla.form';
import unknownEngineProfileSchema from '../../__tests__/EngineProfile.unknown.form';
import missingPatchEngineProfile from '../../__tests__/EngineProfile.missing-patch.platform.form';
import patchEngineProfile from '../../__tests__/EngineProfile.patch.platform.form';

import { SlotFillRoot } from '../../../slot-fill';

const { spy } = sinon;


describe('<FormEditor>', function() {

  it('should render', async function() {
    const { instance } = await renderEditor(schema);

    expect(instance).to.exist;
  });


  describe('caching behavior', function() {

    let createCachedStateSpy;

    beforeEach(function() {
      createCachedStateSpy = sinon.spy(FormEditor, 'createCachedState');
    });

    afterEach(function() {
      createCachedStateSpy.restore();
    });


    it('should create editor if not cached', async function() {

      // when
      const {
        instance
      } = await renderEditor(schema);

      // then
      const {
        form
      } = instance.getCached();

      expect(form).to.exist;
      expect(createCachedStateSpy).to.have.been.calledOnce;
    });


    it('should use cached form', async function() {

      // given
      const cache = new Cache();

      cache.add('editor', {
        cached: {
          form: new FormPlaygroundMock()
        },
        __destroy: () => {}
      });

      // when
      await renderEditor(schema, {
        id: 'editor',
        cache
      });

      // then
      expect(createCachedStateSpy).not.to.have.been.called;
    });

  });


  it('#getXML', async function() {

    // given
    const { instance } = await renderEditor(schema);

    // when
    const exportedSchema = instance.getXML();

    // then
    expect(exportedSchema).to.exist;
    expect(exportedSchema).to.eql(schema);
  });


  describe('#listen', function() {

    function expectHandleChanged(event) {
      return async function() {
        const form = new FormPlaygroundMock();

        const cache = new Cache();

        cache.add('editor', {
          cached: {
            form,
            lastSchema: schema
          },
          __destroy: () => {}
        });

        const onChangedSpy = spy();

        await renderEditor(schema, {
          id: 'editor',
          cache,
          onChanged: onChangedSpy,
          waitForImport: false
        });

        form._editor._emit(event);

        expect(onChangedSpy).to.have.been.called;
      };
    }


    it('commandStack.changed', expectHandleChanged('commandStack.changed'));

    it('propertiesPanel.focusin', expectHandleChanged('propertiesPanel.focusin'));

    it('propertiesPanel.focusout', expectHandleChanged('propertiesPanel.focusout'));

    it('selection.changed', expectHandleChanged('selection.changed'));

    it('attach', expectHandleChanged('attach'));

  });


  describe('#handleChanged', function() {

    function createCache() {
      const cache = new Cache();

      cache.add('editor', {
        cached: {
          engineProfile: DEFAULT_ENGINE_PROFILE,
          form: new FormPlaygroundMock({
            modules: {
              commandStack: {
                canRedo: () => true,
                canUndo: () => true,
                _stackIdx: 1
              },
              selection: {
                get: () => []
              }
            }
          }),
          lastSchema: schema,
          stackIdx: 2
        },
        __destroy: () => {}
      });

      return cache;
    }

    it('should notify about changes', async function() {

      // given
      const onChangedSpy = spy((state) => {

        // then
        expect(state).to.include({
          defaultUndoRedo: false,
          dirty: true,
          inputActive: false,
          redo: true,
          save: true,
          undo: true
        });
      });

      const { instance } = await renderEditor(schema, {
        cache: createCache(),
        id: 'editor',
        onChanged: onChangedSpy,
        waitForImport: false
      });

      // when
      instance.handleChanged();

      // then
      expect(onChangedSpy).to.have.been.calledOnce;
    });


    describe('edit menu', function() {

      it('should provide undo/redo entries', async function() {

        // given
        const onChangedSpy = spy((state) => {

          const editMenuEntries = getUndoRedoEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);
        });

        const { instance } = await renderEditor(schema, {
          cache: createCache(),
          id: 'editor',
          onChanged: onChangedSpy,
          waitForImport: false
        });

        // when
        instance.handleChanged();

        // then
        expect(onChangedSpy).to.have.been.calledOnce;
      });


      it('should provide copy/paste entries', async function() {

        // given
        const onChangedSpy = spy((state) => {

          const editMenuEntries = getDefaultCopyCutPasteEntries(false);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);
        });

        const { instance } = await renderEditor(schema, {
          cache: createCache(),
          id: 'editor',
          onChanged: onChangedSpy,
          waitForImport: false
        });

        // when
        instance.handleChanged();

        // then
        expect(onChangedSpy).to.have.been.calledOnce;
      });


      it('should provide selection entries', async function() {

        // given
        const onChangedSpy = (state) => {

          const editMenuEntries = getSelectionEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);
        };

        const { instance } = await renderEditor(schema, {
          onChanged: onChangedSpy
        });

        // when
        instance.handleChanged();
      });

    });

  });


  describe('#triggerAction', function() {

    it('should return value of editor action', async function() {

      // given
      const editorActions = {
        isRegistered(action) {
          return action === 'foo';
        },
        trigger(action, context) {
          if (action === 'foo') {
            return 'bar';
          }
        }
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          form: new FormPlaygroundMock({
            modules: {
              editorActions
            }
          })
        }
      });

      // when
      const { instance } = await renderEditor(schema, { cache });

      // when
      const returnValue = instance.triggerAction('foo');

      // then
      expect(returnValue).to.equal('bar');
    });


    it('should trigger showLintError', async function() {

      // given
      const triggerSpy = spy();

      const editorActions = {
        isRegistered(action) {
          return action === 'selectFormField';
        },
        trigger: triggerSpy
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          form: new FormPlaygroundMock({
            modules: {
              editorActions
            }
          })
        }
      });

      // when
      const { instance } = await renderEditor(schema, { cache });

      // when
      instance.triggerAction('showLintError', {
        id: 'foo',
        path: []
      });

      // then
      expect(triggerSpy).to.have.been.calledOnceWith('selectFormField', {
        id: 'foo',
        path: []
      });
    });


    it('should trigger collapsePreview', async function() {

      // given
      const { instance } = await renderEditor(schema);

      const triggerSpy = sinon.spy(instance, 'onCollapsePreview');

      // when
      instance.triggerAction('collapsePreview');

      // then
      expect(triggerSpy).to.have.been.calledOnce;
    });


    it('should trigger openPreview', async function() {

      // given
      const { instance } = await renderEditor(schema);

      const triggerSpy = sinon.spy(instance, 'onOpenPreview');

      // when
      instance.triggerAction('openPreview');

      // then
      expect(triggerSpy).to.have.been.calledOnce;
    });

  });


  describe('import', function() {

    afterEach(sinon.restore);


    it('should import without errors and warnings', async function() {

      // given
      const onImportSpy = spy((error, warnings) => {

        // then
        expect(error).to.not.exist;
        expect(warnings).to.be.empty;
      });

      // when
      await renderEditor(schema, {
        onImport: onImportSpy
      });

      // then
      expect(onImportSpy).to.have.been.calledOnce;
    });


    it('should import with error', async function() {

      // given
      const onImportSpy = spy((error, warnings) => {

        // then
        expect(error).to.exist;
        expect(warnings).to.have.length(0);
      });

      // when
      await renderEditor('{ "importError": true }', {
        onImport: onImportSpy
      });

      // then
      expect(onImportSpy).to.have.been.calledOnce;
    });


    it('should not import when provided JSON is the same as the cached one', async function() {

      // given
      const isImportNeededSpy = sinon.spy(FormEditor.prototype, 'isImportNeeded');

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          form: new FormPlaygroundMock(),
          lastSchema: schema
        },
        __destroy: () => {}
      });

      await renderEditor(schema, {
        cache,
        waitForImport: false
      });

      // then
      expect(isImportNeededSpy).to.have.been.calledOnce;
      expect(isImportNeededSpy).to.have.always.returned(false);
    });


    it('should not import when props did not change', async function() {

      // given
      const { instance } = await renderEditor(schema);

      const isImportNeededSpy = sinon.spy(instance, 'isImportNeeded');

      // when
      await instance.componentDidUpdate({
        xml: schema
      });

      // then
      expect(isImportNeededSpy).to.have.been.calledOnce;
      expect(isImportNeededSpy).to.have.always.returned(false);
    });


    it('should unset lastXML on import error', async function() {

      // given
      const { instance } = await renderEditor(schema);

      // assume
      expect(instance.getCached().lastSchema).to.equal(schema);

      // when
      await instance.importSchema('{ "importError": true }');

      // then
      expect(instance.getCached().lastSchema).to.be.null;
    });

  });


  describe('dirty state', function() {

    let instance;

    beforeEach(async function() {
      ({ instance } = await renderEditor(schema));
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
      // execute 1 command
      form.get('commandStack').execute(1);

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.true;
    });


    it('should NOT be dirty after modeling -> undo', function() {

      // given
      const { form } = instance.getCached();

      form.get('commandStack').execute(1);

      // when
      form.get('commandStack').undo();

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should NOT be dirty after save', async function() {

      // given
      const { form } = instance.getCached();

      // execute 1 command
      form.get('commandStack').execute(1);

      // when
      instance.getXML();

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });

  });


  describe('engine profile', function() {

    function expectEngineProfile(schema, engineProfile) {
      return async function() {

        // when
        const { instance, wrapper } = await renderEditor(schema);

        wrapper.update();

        // then
        expect(wrapper.find('EngineProfile').exists()).to.be.true;

        expect(instance.getCached().engineProfile).to.eql(engineProfile);
      };
    }


    it('should show engine profile (no engine profile)', expectEngineProfile(noEngineProfile, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: undefined
    }));


    it('should show engine profile (Camunda Platform 7.16.0)', expectEngineProfile(engineProfileSchema, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: '7.16.0'
    }));


    it('should show engine profile (Camunda Platform 7.16)', expectEngineProfile(missingPatchEngineProfile, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: '7.16.0'
    }));


    it('should show engine profile (Camunda Platform 7.16.1)', expectEngineProfile(patchEngineProfile, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: '7.16.1'
    }));


    it('should update cached engine profile on change', async function() {

      // given
      const { instance, wrapper } = await renderEditor(engineProfileSchema);

      wrapper.update();

      // assume
      expect(wrapper.find('EngineProfile').exists()).to.be.true;

      expect(instance.getCached().engineProfile).to.eql({
        executionPlatform: 'Camunda Platform',
        executionPlatformVersion: '7.16.0'
      });

      // when
      const schema = instance.getCached().form.getSchema();

      schema.executionPlatform = 'Camunda Platform';
      schema.executionPlatformVersion = '7.15.0';

      instance.handleChanged();

      // then
      expect(instance.getCached().engineProfile).to.eql({
        executionPlatform: 'Camunda Platform',
        executionPlatformVersion: '7.15.0'
      });
    });


    it('should not open form if unknown execution profile', async function() {

      // given
      const onImportSpy = spy();

      // when
      const { instance } = await renderEditor(unknownEngineProfileSchema, {
        onImport: onImportSpy
      });

      // then
      expect(onImportSpy).to.have.been.calledOnce;
      expect(onImportSpy).to.have.been.calledWith(sinon.match({ message: 'An unknown execution platform (Camunda Unknown 7.16.0) was detected.' }), []);

      expect(instance.getCached().engineProfile).to.be.null;
    });

  });


  describe('linting', function() {

    describe('behavior', function() {

      it('should lint on import (engine profile)', async function() {

        // given
        const onActionSpy = spy();

        // when
        const { instance } = await renderEditor(engineProfileSchema, {
          onAction: onActionSpy
        });

        // then
        const { form } = instance.getCached();

        const calls = onActionSpy.getCalls()
          .filter(call => call.args[0] === 'lint-tab');

        // then
        expect(calls).to.have.lengthOf(1);
        expect(onActionSpy).to.have.been.calledWith('lint-tab', { contents: form.getSchema() });
      });


      it('should lint on commandStack.changed (engine profile)', async function() {

        // given
        const onActionSpy = spy();

        const { instance } = await renderEditor(engineProfileSchema, {
          onAction: onActionSpy
        });

        // when
        const { form } = instance.getCached();

        form._editor._emit('commandStack.changed');

        const calls = onActionSpy.getCalls()
          .filter(call => call.args[0] === 'lint-tab');

        // then
        expect(calls).to.have.lengthOf(2);

        calls.forEach(function(call) {
          expect(call[1] === form.getSchema());
        });
      });


      it('should not lint on import or commandStack.changed (no engine profile)', async function() {

        // given
        const onActionSpy = spy();

        const { instance } = await renderEditor(schema, {
          onAction: onActionSpy
        });

        // when
        const { form } = instance.getCached();

        form.emit('commandStack.changed');

        // then
        expect(onActionSpy).not.to.have.been.calledWith('lint-tab');
      });


      it('should show linting in status bar', async function() {

        // when
        const { wrapper } = await renderEditor(engineProfileSchema);

        wrapper.update();

        // then
        expect(wrapper.find('Linting').exists()).to.be.true;
      });


      it('should unsubscribe on unmount', async function() {

        // given
        const onActionSpy = spy();

        const {
          instance,
          wrapper
        } = await renderEditor(engineProfileSchema, {
          onAction: onActionSpy
        });

        const { form } = instance.getCached();

        // when
        wrapper.unmount();

        form.emit('commandStack.changed');

        const calls = onActionSpy.getCalls()
          .filter(call => call.args[0] === 'lint-tab');

        // then
        expect(calls).to.have.lengthOf(1);
      });

    });


    describe('#onToggleLinting', function() {

      it('should open', async function() {

        // given
        const onLayoutChangedSpy = spy();

        const { instance } = await renderEditor(schema, {
          layout: {
            panel: {
              open: false
            }
          },
          onLayoutChanged: onLayoutChangedSpy
        });

        // when
        instance.onToggleLinting();

        // then
        expect(onLayoutChangedSpy).to.have.been.calledOnceWith({
          panel: {
            open: true,
            tab: 'linting'
          }
        });
      });


      it('should open (different tab open)', async function() {

        // given
        const onLayoutChangedSpy = spy();

        const { instance } = await renderEditor(schema, {
          layout: {
            panel: {
              open: true,
              tab: 'foo'
            }
          },
          onLayoutChanged: onLayoutChangedSpy
        });

        // when
        instance.onToggleLinting();

        // then
        expect(onLayoutChangedSpy).to.have.been.calledOnceWith({
          panel: {
            open: true,
            tab: 'linting'
          }
        });
      });


      it('should close', async function() {

        // given
        const onLayoutChangedSpy = spy();

        const { instance } = await renderEditor(schema, {
          layout: {
            panel: {
              open: true,
              tab: 'linting'
            }
          },
          onLayoutChanged: onLayoutChangedSpy
        });

        // when
        instance.onToggleLinting();

        // then
        expect(onLayoutChangedSpy).to.have.been.calledOnceWith({
          panel: {
            open: false,
            tab: 'linting'
          }
        });
      });

    });

  });


  describe('form preview', function() {

    it('should set initial layout state', async function() {

      // given
      const collapseSpy = spy();
      const openSpy = spy();

      const { instance } = await renderEditor(schema, {
        layout: {
          formEditor: {
            'form-preview': { open: true },
            'form-input': { open: false },
            'form-output': { open: false }
          }
        }
      });

      const { form } = instance.getCached();
      form.collapse = collapseSpy;
      form.open = openSpy;

      // when
      instance.handleInitialPlaygroundLayout();

      // then
      expect(collapseSpy).to.have.been.calledOnceWith([
        'form-input', 'form-output'
      ]);

      expect(openSpy).to.have.been.calledOnceWith([
        'form-preview'
      ]);
    });


    it('should notify on layout changes', async function() {

      // given
      const onLayoutChangedSpy = spy();

      const { instance } = await renderEditor(schema, {
        layout: {
          panel: {
            open: false
          }
        },
        onLayoutChanged: onLayoutChangedSpy
      });

      const { form } = instance.getCached();

      // when
      form.emit('formPlayground.layoutChanged', {
        layout: {
          'form-preview': { open: true }
        }
      });

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnceWith({
        formEditor: {
          'form-preview': { open: true }
        }
      });
    });


    it('#onCollapsePreview', async function() {

      // given
      const onLayoutChangedSpy = spy();

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          form: new FormPlaygroundMock({
            emitLayoutChanged: true
          })
        }
      });

      const { instance } = await renderEditor(schema, {
        cache,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.onCollapsePreview();

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnceWith({
        formEditor: {
          'form-preview': { open: false },
          'form-input': { open: false },
          'form-output': { open: false }
        }
      });
    });


    it('#onOpenPreview', async function() {

      // given
      const onLayoutChangedSpy = spy();

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          form: new FormPlaygroundMock({
            emitLayoutChanged: true
          })
        }
      });

      const { instance } = await renderEditor(schema, {
        cache,
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.onOpenPreview();

      // then
      expect(onLayoutChangedSpy).to.have.been.calledOnceWith({
        formEditor: {
          'form-preview': { open: true },
          'form-input': { open: true },
          'form-output': { open: true }
        }
      });
    });
  });


  describe('extensions event emitting', function() {

    let recordActions, emittedEvents;

    beforeEach(function() {
      emittedEvents = [];

      recordActions = (action, options) => {
        emittedEvents.push(options);
      };
    });


    it('should notify when form was created', async function() {

      // when
      const {
        instance
      } = await renderEditor(engineProfileSchema, {
        onAction: recordActions
      });

      const {
        form
      } = instance.getCached();

      // then
      const modelerCreatedEvent = getEvent(emittedEvents, 'form.modeler.created');

      const {
        payload,
      } = modelerCreatedEvent;

      expect(modelerCreatedEvent).to.exist;
      expect(payload).to.eql(form);
    });


    it('should notify on playground layout changes', async function() {

      // given
      const {
        instance
      } = await renderEditor(schema, {
        onAction: recordActions
      });

      const {
        form
      } = instance.getCached();

      const layout = {
        'form-preview': { open: true },
        'form-input': { open: false },
        'form-output': { open: false }
      };

      // when
      form.emit('formPlayground.layoutChanged', {
        layout
      });

      // then
      const playgroundChangedEvent = getEvent(emittedEvents, 'form.modeler.playgroundLayoutChanged');

      const {
        payload
      } = playgroundChangedEvent;

      expect(playgroundChangedEvent).to.exist;
      expect(payload).to.eql({
        layout,
        triggeredBy: FORM_PREVIEW_TRIGGER.PREVIEW_PANEL
      });
    });


    it('should add <triggeredBy> to layout changes', async function() {

      // given
      const {
        instance
      } = await renderEditor(schema, {
        onAction: recordActions
      });

      const layout = {
        'form-preview': { open: true },
        'form-input': { open: false },
        'form-output': { open: false }
      };

      // when
      instance.setState({ triggeredBy: 'foo' });
      instance.handlePlaygroundLayoutChanged({
        layout
      });

      // then
      const playgroundChangedEvent = getEvent(emittedEvents, 'form.modeler.playgroundLayoutChanged');

      const {
        payload
      } = playgroundChangedEvent;

      expect(playgroundChangedEvent).to.exist;
      expect(payload).to.eql({
        layout,
        triggeredBy: 'foo'
      });
    });

  });

});


// helpers //////////

function noop() {}

const TestEditor = WithCachedState(FormEditor);

async function renderEditor(schema, options = {}) {
  const {
    cache = new Cache(),
    getConfig = noop,
    id = 'editor',
    layout = {},
    linting = [],
    onAction = noop,
    onChanged = noop,
    onContentUpdated = noop,
    onError = noop,
    onImport = noop,
    onLayoutChanged = noop,
    onModal = noop,
    waitForImport = true
  } = options;

  return new Promise((resolve) => {
    let instance,
        wrapper;

    const resolveOnImport = (...args) => {
      onImport(...args);

      resolve({
        instance,
        wrapper
      });
    };

    wrapper = mount(
      <SlotFillRoot>
        <TestEditor
          cache={ cache }
          getConfig={ getConfig }
          id={ id }
          layout={ layout }
          linting={ linting }
          onAction={ onAction }
          onChanged={ onChanged }
          onContentUpdated={ onContentUpdated }
          onError={ onError }
          onImport={ waitForImport ? resolveOnImport : onImport }
          onLayoutChanged={ onLayoutChanged }
          onModal={ onModal }
          xml={ schema }
        />
      </SlotFillRoot>
    );

    instance = wrapper.find(FormEditor).instance();

    // properly mock form playground instantiation
    const { form } = instance.getCached();
    form.emit('formPlayground.rendered');

    if (!waitForImport) {
      resolve({
        instance,
        wrapper
      });
    }
  });
}


function getEvent(events, eventName) {
  return events.find(e => e.type === eventName);
}
