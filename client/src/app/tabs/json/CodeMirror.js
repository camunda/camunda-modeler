/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import CodeMirror from 'codemirror';

// javascript syntax highlighting (json is a subset)
import 'codemirror/mode/javascript/javascript';

// auto close tags
import 'codemirror/addon/edit/closetag';

// search addons
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';

import 'codemirror/addon/dialog/dialog';

import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/dialog/dialog.css';


/**
 * Create a code mirror instance with an editor API.
 *
 * @param  {Object} options
 * @return {CodeMirror}
 */
export default function create(options) {

  var el = this;

  var instance = CodeMirror(function(_el) {
    el = _el;
  }, {
    autoCloseTags: true,
    dragDrop: true,
    allowDropFileTypes: [
      'text/plain',
      'application/json',
      'application/camunda-form'
    ],
    lineWrapping: true,
    lineNumbers: true,
    mode: {
      name: 'application/json',
      json: true
    },
    tabSize: 2
  });

  instance.attachTo = function(parentNode) {
    parentNode.appendChild(el);

    this.refresh();
  };

  instance.detach = function() {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  };

  instance.importXML = function(json) {
    this.setValue(json);

    this.doc.clearHistory();
  };

  instance.destroy = function() { };

  Object.defineProperty(instance, '_stackIdx', {
    get() {
      return this.doc.historySize().undo;
    }
  });

  return instance;
}
