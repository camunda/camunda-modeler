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

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import CodeMirror from './CodeMirror';

import * as css from './JSONEditor.less';

import {
  getEditMenu,
  getWindowMenu
} from './Menu';

import {
  isString
} from 'min-dash';


export class JSONEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
  }

  componentDidMount() {
    const {
      editor
    } = this.getCached();

    editor.attachTo(this.ref.current);

    editor.on('change', this.handleChanged);

    this.handleChanged();

    this.checkImport();
  }

  componentWillUnmount() {
    const {
      editor
    } = this.getCached();

    editor.detach();

    editor.off('change', this.handleChanged);
  }

  componentDidUpdate(prevProps) {
    if (isValueChange(prevProps.xml, this.props.xml)) {
      this.checkImport();
    }

    if (isChachedStateChange(prevProps, this.props)) {
      this.handleChanged();
    }
  }

  triggerAction(action) {
    const {
      editor
    } = this.getCached();

    return editor.execCommand(action);
  }

  checkImport() {
    const { xml } = this.props;

    const {
      editor,
      lastXML
    } = this.getCached();

    if (isValueChange(lastXML, xml)) {
      editor.importXML(xml);

      const stackIdx = editor._stackIdx;

      this.setCached({
        lastXML: xml,
        stackIdx
      });
    }
  }

  isDirty() {
    const {
      editor,
      stackIdx
    } = this.getCached();

    return editor._stackIdx !== stackIdx;
  }

  handleChanged = () => {
    const {
      onChanged
    } = this.props;

    const {
      editor
    } = this.getCached();

    const history = editor.historySize();

    const editMenu = getEditMenu({
      canRedo: !!history.redo,
      canUndo: !!history.undo
    });

    const dirty = this.isDirty();

    const newState = {
      canExport: false,
      dirty,
      redo: !!history.redo,
      undo: !!history.undo
    };

    // ensure backwards compatibility
    // https://github.com/camunda/camunda-modeler/commit/78357e3ed9e6e0255ac8225fbdf451a90457e8bf#diff-bd5be70c4e5eadf1a316c16085a72f0fL17
    newState.editable = true;
    newState.searchable = true;

    const windowMenu = getWindowMenu();

    if (typeof onChanged === 'function') {
      onChanged({
        ...newState,
        editMenu,
        windowMenu
      });
    }

    this.setState({
      ...newState
    });
  };

  getXML() {
    const {
      editor
    } = this.getCached();

    const stackIdx = editor._stackIdx;

    const json = editor.getValue();

    this.setCached({
      lastXML: json,
      stackIdx
    });

    return json;
  }

  render() {
    return (
      <div className={ css.JSONEditor }>
        <div className="content" ref={ this.ref }></div>
      </div>
    );
  }

  static createCachedState() {

    const editor = CodeMirror();

    const stackIdx = editor._stackIdx;

    return {
      __destroy: () => {
        editor.destroy();
      },
      editor,
      lastXML: null,
      stackIdx
    };
  }

}

export default WithCache(WithCachedState(JSONEditor));

// helpers //////////

function isValueChange(previousValue, value) {
  return trim(previousValue) !== trim(value);
}

function trim(string) {
  if (isString(string)) {
    return string.trim();
  }

  return string;
}

function isChachedStateChange(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}
