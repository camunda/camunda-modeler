/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import EventEmitter from 'events';

import { basicSetup } from 'codemirror';

import { EditorView, Decoration, WidgetType } from '@codemirror/view';

import { EditorState, Compartment, StateField } from '@codemirror/state';

import { json } from '@codemirror/lang-json';

import classNames from 'classnames';

import {
  undo,
  redo,
  undoDepth,
  redoDepth
} from '@codemirror/commands';

import { vscodeLight } from '@uiw/codemirror-theme-vscode';

import { View, ViewOff, WarningAlt } from '@carbon/icons-react';

import FormFeedback from './FormFeedback';
import DocumentationIcon from './DocumentationIcon';

import {
  fieldError as defaultFieldError
} from './Util';

export default function JSONInput(props) {
  const {
    label,
    field,
    form,
    fieldError,
    documentationUrl,
    hiddenPaths = []
  } = props;

  const {
    name: fieldName,
    value: fieldValue
  } = field;

  const meta = form.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta, fieldName);

  const ref = useRef();
  const instanceRef = useRef(null);
  const isInternalChange = useRef(false);
  const [ secretsVisible, setSecretsVisible ] = useState(false);
  const [ isValidJSON, setIsValidJSON ] = useState(true);

  useEffect(() => {
    const instance = create(secretsVisible ? [] : hiddenPaths, setIsValidJSON);
    instanceRef.current = instance;

    instance.attachTo(ref.current);

    instance.setValue(fieldValue || '');

    instance.on('change', ({ value }) => {
      isInternalChange.current = true;
      form.setFieldValue(fieldName, value);
    });

    return () => {
      instance.detach();
    };
  }, [ secretsVisible ]);

  // Update the editor value when it changes externally (not from user input)
  useEffect(() => {
    if (instanceRef.current && !isInternalChange.current) {
      const currentValue = instanceRef.current.getValue();
      if (currentValue !== fieldValue) {
        instanceRef.current.setValue(fieldValue || '');
      }
    }
    isInternalChange.current = false;
  }, [ fieldValue ]);

  const { setFieldTouched } = useFormikContext();

  const onBlur = () => {
    setFieldTouched(fieldName, true);
  };

  return (
    <React.Fragment>
      <div className="form-group">
        <div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }>
          <label htmlFor={ fieldName } style={ { margin: 0 } }>
            { label }
            <DocumentationIcon url={ documentationUrl } />
          </label>
          {hiddenPaths && hiddenPaths.length > 0 && (
            <button
              type="button"
              className="btn"
              onClick={ () => setSecretsVisible(!secretsVisible) }
              title={ secretsVisible ? 'Hide secrets' : 'Show secrets' }
              style={ {
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '12px',
                background: 'transparent',
                border: 'none',
                minWidth: '0',
                cursor: 'pointer'
              } }
            >
              {secretsVisible ? (
                <>
                  <ViewOff size={ 16 } />
                </>
              ) : (
                <>
                  <View size={ 16 } />
                </>
              )}
            </button>
          )}
        </div>
        {!isValidJSON && (
          <div style={ {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--color-grey-225-10-35)',
            marginBottom: '4px'
          } }>
            <WarningAlt size={ 16 } style={ { fill: 'var(--color-grey-225-10-35)' } } />
            <span>Invalid JSON{hiddenPaths && hiddenPaths.length > 0 ? ' - using text-based masking' : ''}</span>
          </div>
        )}
        <div
          onBlur={ onBlur }
          ref={ ref }
          className={ classNames('custom-control-codemirror', {
            'is-invalid': !!error
          }) }></div>
        <FormFeedback
          error={ error }
        />
      </div>
    </React.Fragment>
  );
}

/**
  * Create a code mirror instance.
  *
  * @param  {Array<string>} hiddenPaths - Array of JSON paths to mask (e.g., ['credentials.password', 'secret'])
  * @param  {Function} onValidityChange - Callback to notify parent of JSON validity changes
  * @return {EditorView}
  */
function create(hiddenPaths = [], onValidityChange = null) {

  const eventEmitter = new EventEmitter();

  let language = new Compartment().of(json());
  let tabSize = new Compartment().of(EditorState.tabSize.of(2));

  // Create the mask decoration once
  const maskDecoration = Decoration.replace({
    widget: new class extends WidgetType {
      toDOM() {
        const span = document.createElement('span');
        span.textContent = '"******"';
        span.className = 'cm-json-masked-value';
        return span;
      }
    }
  });

  /**
   * Creates a masking extension that hides values at specified JSON paths
   */
  function createMaskingExtension(hiddenPaths) {
    if (!hiddenPaths || hiddenPaths.length === 0) {
      return [];
    }

    const maskField = StateField.define({
      create(state) {
        return findAndMaskPaths(state, hiddenPaths);
      },
      update(decorations, tr) {
        if (tr.docChanged) {
          return findAndMaskPaths(tr.state, hiddenPaths);
        }
        return decorations;
      },
      provide: f => EditorView.decorations.from(f)
    });

    return [ maskField ];
  }

  /**
   * Finds JSON values at specified paths and returns decorations to mask them
   */
  function findAndMaskPaths(state, hiddenPaths) {
    const decorations = [];
    const doc = state.doc.toString();

    try {
      const parsed = JSON.parse(doc);

      const pathsToMask = [];
      findAllPaths(parsed, '', (path, value) => {
        if (hiddenPaths.some(pattern => matchesPattern(path, pattern))) {
          pathsToMask.push(path);
        }
      });

      pathsToMask.forEach(path => {
        const positions = findValuePositionsInDoc(doc, path);
        positions.forEach(({ from, to }) => {
          decorations.push(maskDecoration.range(from, to));
        });
      });
    } catch (e) {

      const searchTerms = hiddenPaths.map(pattern => {
        return pattern.replace(/\*+/g, '').replace(/\./g, '');
      }).filter(term => term.length > 0);

      if (searchTerms.length > 0) {
        const lines = doc.split('\n');
        let position = 0;

        lines.forEach(line => {
          const lineLength = line.length;
          const trimmedLine = line.trim();

          const matchesTerm = searchTerms.some(term =>
            trimmedLine.toLowerCase().includes(term.toLowerCase())
          );

          if (matchesTerm) {
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
              const afterColon = line.substring(colonIndex + 1).trim();
              const valueMatch = afterColon.match(/^("(?:[^"\\]|\\.)*"|[^,}\]\s]+)/);

              if (valueMatch) {
                const valueStart = position + line.indexOf(valueMatch[0], colonIndex);
                const valueEnd = valueStart + valueMatch[0].length;
                decorations.push(maskDecoration.range(valueStart, valueEnd));
              }
            }
          }

          position += lineLength + 1;
        });
      }
    }

    return Decoration.set(decorations, true);
  }

  function findAllPaths(obj, prefix, callback) {
    if (obj === null || typeof obj !== 'object') {
      return;
    }

    Object.keys(obj).forEach(key => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      callback(currentPath, obj[key]);

      if (obj[key] && typeof obj[key] === 'object') {
        findAllPaths(obj[key], currentPath, callback);
      }
    });
  }

  function matchesPattern(path, pattern) {
    if (path === pattern) {
      return true;
    }

    const pathParts = path.split('.');
    const patternParts = pattern.split('.');

    if (patternParts.length === 1) {
      const patternPart = patternParts[0];

      if (patternPart.startsWith('*') && patternPart.endsWith('*') && patternPart.length > 2) {
        const searchText = patternPart.slice(1, -1);
        return pathParts.some(part => part && part.includes(searchText));
      }

      if (patternPart.endsWith('*')) {
        const prefix = patternPart.slice(0, -1);
        return pathParts.some(part => part && part.startsWith(prefix));
      }

      if (patternPart.startsWith('*')) {
        const suffix = patternPart.slice(1);
        return pathParts.some(part => part && part.endsWith(suffix));
      }

      if (patternPart === '*') {
        return true;
      }

      return pathParts.includes(patternPart);
    }

    if (pattern.startsWith('**.')) {
      const suffix = pattern.substring(3);
      return path.endsWith(`.${suffix}`) || path === suffix;
    }

    if (patternParts.length !== pathParts.length && !pattern.includes('**')) {
      return false;
    }

    return patternParts.every((patternPart, i) => {
      const pathPart = pathParts[i];

      if (patternPart === '**') {
        return true;
      }

      if (patternPart === '*') {
        return true;
      }

      if (patternPart.startsWith('*') && patternPart.endsWith('*') && patternPart.length > 2) {
        const searchText = patternPart.slice(1, -1);
        return pathPart && pathPart.includes(searchText);
      }

      if (patternPart.endsWith('*')) {
        const prefix = patternPart.slice(0, -1);
        return pathPart && pathPart.startsWith(prefix);
      }

      if (patternPart.startsWith('*')) {
        const suffix = patternPart.slice(1);
        return pathPart && pathPart.endsWith(suffix);
      }

      return pathPart === patternPart;
    });
  }

  function findValuePositionsInDoc(doc, path) {
    const positions = [];
    const keys = path.split('.');

    const lastKey = keys[keys.length - 1];
    const regex = new RegExp(`"${lastKey}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|[^,}\\]\\s]+)`, 'g');

    let match;
    while ((match = regex.exec(doc)) !== null) {
      const valueMatch = match[1];
      const valueStart = match.index + match[0].indexOf(valueMatch);
      const valueEnd = valueStart + valueMatch.length;

      if (isMatchAtPath(doc, match.index, keys)) {
        positions.push({ from: valueStart, to: valueEnd });
      }
    }

    return positions;
  }

  function isMatchAtPath(doc, matchIndex, keys) {
    if (keys.length === 1) return true;

    const precedingDoc = doc.substring(0, matchIndex);
    const parentKeys = keys.slice(0, -1);

    return parentKeys.every(key => precedingDoc.includes(`"${key}"`));
  }

  const maskingExtension = createMaskingExtension(hiddenPaths);

  /**
   * Creates a validation extension that checks JSON validity
   */
  function createValidationExtension() {
    const validationField = StateField.define({
      create(state) {
        validateJSON(state);
        return null;
      },
      update(value, tr) {
        if (tr.docChanged) {
          validateJSON(tr.state);
        }
        return value;
      }
    });

    return [ validationField ];
  }

  function validateJSON(state) {
    const doc = state.doc.toString();
    try {
      JSON.parse(doc);
      if (onValidityChange) {
        onValidityChange(true);
      }
    } catch (e) {
      if (onValidityChange) {
        onValidityChange(false);
      }
    }
  }

  const validationExtension = createValidationExtension();

  function createState(doc, extensions = []) {
    return EditorState.create({
      doc,
      extensions: [
        basicSetup,
        language,
        tabSize,
        EditorView.contentAttributes.of({
          'aria-label': 'JSON editor',
          'tabindex': '0'
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
        ...maskingExtension,
        ...validationExtension,
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
