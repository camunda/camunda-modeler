/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import * as monaco from 'monaco-editor';

export default function create() {

  // const model = monaco.editor.createModel('', 'robotframework');

  const _container = document.createElement('div');
  _container.style.width = '100%';
  _container.style.height = '100%';
  const editor = monaco.editor.create(_container, {
    automaticLayout: true,
    value: 'This is a test'
  });

  let _changeHandler = () => {};

  editor.onDidChangeModelContent(event => {
    _changeHandler();
  });

  const instance = {};

  instance._stackIdx = 0;

  instance.editor = editor;

  instance.attachTo = (container) => {
    container.appendChild(_container);
  };


  instance.on = (event, callback) => {
    if (event === 'change') {
      _changeHandler = callback;
    }
  };
  instance.off = (event, callback) => {
    if (event === 'change') {
      _changeHandler = () => {};
    }
  };


  instance.historySize = () => 0;
  instance.detach = () => {
    editor.dispose();
  };

  instance.execCommand = (cmd) => {
    console.log(cmd);
    if (cmd === 'undo') {
      editor.trigger('menu', 'undo');
    }

    if (cmd === 'redo') {
      editor.trigger('menu', 'redo');
    }

    if (cmd === 'find') {
      editor.getAction('actions.find').run();
    }


    if (cmd === 'findNext') {
      editor.getAction('editor.action.nextMatchFindAction').run();

    }

    if (cmd === 'findPrev') {
      editor.getAction('editor.action.previousMatchFindAction').run();

    }

    if (cmd === 'replace') {
      editor.getAction('editor.action.startFindReplaceAction').run();

    }

  };

  instance.getValue = function() {
    return editor.getValue();
  };

  instance.importXML = (xml) => {
    editor.setValue(xml);
    console.log(editor.getValue(), editor.getDomNode());
    editor.layout();

  };

  return instance;

}
