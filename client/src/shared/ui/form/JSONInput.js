/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';

import EventEmitter from 'events';

import { basicSetup } from 'codemirror';

import { EditorView } from '@codemirror/view';

import { EditorState, Compartment } from '@codemirror/state';

import { json } from '@codemirror/lang-json';

import classNames from 'classnames';

import {
  undo,
  redo,
  undoDepth,
  redoDepth
} from '@codemirror/commands';

import { vscodeLight } from '@uiw/codemirror-theme-vscode';

import { Label } from '@camunda/design-system';

import FormFeedback from './FormFeedback';
import DocumentationIcon from './DocumentationIcon';

import {
  fieldError as defaultFieldError
} from './Util';

import * as css from './Field.css';

export default function JSONInput(props) {
  const {
    label,
    field,
    form,
    fieldError,
    documentationUrl
  } = props;

  const {
    name: fieldName,
    value: fieldValue
  } = field;

  const meta = form.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta, fieldName);

  const ref = useRef();

  useEffect(() => {
    const instance = create();

    instance.attachTo(ref.current);

    instance.setValue(fieldValue || '');

    instance.on('change', ({ value }) => {
      form.setFieldValue(fieldName, value);
    });

    return () => {
      instance.detach();
    };
  }, []);

  const { setFieldTouched } = useFormikContext();

  const onBlur = () => {
    setFieldTouched(fieldName, true);
  };

  return (
    <div className={ classNames('form-group', css.Field) }>
      <Label htmlFor={ fieldName }>
        { label }
        <DocumentationIcon url={ documentationUrl } />
      </Label>
      <div
        onBlur={ onBlur }
        ref={ ref }
        className="field__code-editor"
        data-invalid={ !!error || undefined }></div>
      <FormFeedback error={ error } />
    </div>
  );
}

/**
  * Create a code mirror instance.
  *
  * @param  {Object} options
  * @return {EditorView}
  */
function create() {

  const eventEmitter = new EventEmitter();

  let language = new Compartment().of(json());
  let tabSize = new Compartment().of(EditorState.tabSize.of(2));

  function createState(doc, extensions = []) {
    return EditorState.create({
      doc,
      extensions: [
        basicSetup,
        language,
        tabSize,
        EditorView.contentAttributes.of({
          'aria-label': 'JSON editor',
          'tabindex': 0
        }),
        EditorView.lineWrapping,
        vscodeLight,
        EditorView.theme({
          '&': {
            fontSize: '13px'
          },
          '.cm-content': {
            fontFamily: 'var(--font-family-monospace)'
          }
        }),
        ...extensions
      ]
    });
  }

  function createView() {

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        eventEmitter.emit('change', {
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

  instance.on = eventEmitter.on.bind(eventEmitter);
  instance.off = eventEmitter.off.bind(eventEmitter);

  instance.attachTo = function(container) {
    container.appendChild(instance.dom);
  };

  instance.detach = function() {
    if (instance.dom.parentNode) {
      instance.dom.parentNode.removeChild(instance.dom);
    }
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

    if (command === 'redo') {
      return redo(this);
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
