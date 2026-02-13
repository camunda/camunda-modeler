/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { createRef } from 'react';

import { render, waitFor } from '@testing-library/react';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import { XMLEditor } from '../XMLEditor';

import CodeMirror from 'test/mocks/code-mirror/CodeMirror';

/* global sinon */

const XML = '<xml></xml>';


describe('<XMLEditor>', function() {

  describe('#render', function() {

    it('should render with NO xml', function() {

      const {
        instance
      } = renderEditor();

      expect(instance).to.exist;
    });


    it('should render with xml', function() {

      const {
        instance
      } = renderEditor(XML);

      expect(instance).to.exist;
    });

  });


  it('#getXML', function() {

    // given
    const {
      instance
    } = renderEditor(XML);

    // when
    // then
    expect(instance.getXML()).to.be.equal(XML);
  });


  describe('#handleChanged', function() {

    it('should notify about changes', function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          dirty: true,
          redo: true,
          undo: true
        });
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: XML,
          editor: CodeMirror({
            undo: 1,
            redo: 1
          }),
          stackIdx: 2
        },
        __destroy: () => {}
      });

      const { instance } = renderEditor(XML, {
        id: 'editor',
        cache,
        onChanged: changedSpy
      });

      // when
      instance.handleChanged();
    });


    it('should notify about plugin related changes', function() {

      // given
      const changedSpy = sinon.spy();

      const { instance } = renderEditor(XML, {
        id: 'editor',
        onChanged: changedSpy
      });

      changedSpy.resetHistory();

      // when
      instance.handleChanged();

      // then
      expect(changedSpy).to.be.calledOnce;

      const state = changedSpy.firstCall.args[0];

      expect(state).to.have.property('editable');
      expect(state).to.have.property('searchable');
    });


    it('can be saved in the XML view', function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          save: true,
        });
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: XML,
          editor: CodeMirror({
            undo: 1,
            redo: 1
          }),
          stackIdx: 2
        },
        __destroy: () => {}
      });

      const { instance } = renderEditor(XML, {
        id: 'editor',
        cache,
        onChanged: changedSpy
      });

      instance.handleChanged();
    });


    it('can be saved if it is NOT dirty', function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          dirty: false,
          save: true,
        });
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: XML,
          editor: CodeMirror({
            undo: 1,
            redo: 0
          }),
          stackIdx: 1
        },
        __destroy: () => {}
      });

      const { instance } = renderEditor(XML, {
        id: 'editor',
        cache,
        onChanged: changedSpy
      });

      // when
      const { editor } = instance.getCached();
      editor.undo();
      editor.execCommand(1);

      // then
      instance.handleChanged();
    });

  });


  describe('dirty state', function() {

    let instance;

    beforeEach(function() {
      instance = renderEditor(XML).instance;
    });


    it('should NOT be dirty initially', function() {

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should be dirty after modeling', function() {

      // given
      const { editor } = instance.getCached();

      // when
      // execute 1 command
      editor.execCommand(1);

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.true;
    });


    it('should NOT be dirty after modeling -> undo', function() {

      // given
      const { editor } = instance.getCached();

      editor.execCommand(1);

      // when
      editor.undo();

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should NOT be dirty after save', async function() {

      // given
      const { editor } = instance.getCached();

      // execute 1 command
      editor.execCommand(1);

      // when
      await instance.getXML();

      // then
      await waitFor(() => {
        const dirty = instance.isDirty();
        expect(dirty).to.be.false;
      });
    });

  });

});

// helpers //////////

function noop() {}

const TestEditor = WithCachedState(XMLEditor);

function renderEditor(xml, options = {}) {
  const {
    id,
    onChanged,
  } = options;

  const ref = createRef();

  render(
    <TestEditor
      ref={ ref }
      id={ id || 'editor' }
      xml={ xml }
      activeSheet={ options.activeSheet || { id: 'xml' } }
      onChanged={ onChanged || noop }
      cache={ options.cache || new Cache() }
    />
  );

  const instance = ref.current;

  return {
    instance
  };
}