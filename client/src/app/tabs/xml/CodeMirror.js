/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import mitt from 'mitt';

import { basicSetup } from 'codemirror';

import { EditorView } from '@codemirror/view';

import { EditorState, Compartment } from '@codemirror/state';

import {
  undo,
  redo,
  undoDepth,
  redoDepth
} from '@codemirror/commands';

import {
  findNext,
  findPrevious,
  openSearchPanel,
  replaceNext,
  search
} from '@codemirror/search';

import { xml } from '@codemirror/lang-xml';

/**
 * Create a code mirror instance with an editor API.
 *
 * @param  {Object} options
 * @return {EditorView}
 */
export default function create() {

  const emitter = mitt();

  const language = new Compartment().of(xml());
  const tabSize = new Compartment().of(EditorState.tabSize.of(2));
  const searchExtension = new Compartment().of(search({ top: true }));

  function createState(doc, extensions = []) {
    return EditorState.create({
      doc,
      extensions: [
        basicSetup,
        language,
        tabSize,
        searchExtension,
        EditorView.contentAttributes.of({
          'aria-label': 'XML editor',
          'tabindex': 0
        }),
        EditorView.lineWrapping,
        ...extensions
      ]
    });
  }

  function createView() {

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        emitter.emit('change', {
          value: update.view.state.doc.toString()
        });
      }
    });

    const view = new EditorView({
      state: createState('', [ updateListener ])
    });

    view.setValue = function(value) {
      this.setState(createState(value, [ updateListener ]));
    };

    return view;
  }

  const instance = createView();

  instance.getValue = function() {
    return this.state.doc.toString();
  };

  instance.on = emitter.on;
  instance.off = emitter.off;

  instance.attachTo = function(container) {
    container.appendChild(instance.dom);
  };

  instance.detach = function() {
    if (instance.dom.parentNode) {
      instance.dom.parentNode.removeChild(instance.dom);
    }
  };

  instance.importXML = function(xml) {
    this.setValue(xml);
  };

  Object.defineProperty(instance, '_stackIdx', {
    get() {
      return undoDepth(this.state);
    }
  });

  instance.execCommand = function(command) {

    if (command === 'undo') {
      return undo(this);
    }

    if (command === 'undo') {
      return redo(this);
    }

    if (command === 'find') {
      openSearchPanel(this);
    }

    if (command === 'findNext') {
      findNext(this);
    }

    if (command === 'findPrev') {
      findPrevious(this);
    }

    if (command === 'replace') {
      replaceNext(this);
    }
  };

  instance.historySize = function() {
    return {
      undo: undoDepth(this.state),
      redo: redoDepth(this.state)
    };
  };

  instance.undo = function() {
    return this.execCommand('undo');
  };

  instance.redo = function() {
    return this.execCommand('redo');
  };

  return instance;
}
