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

import Monaco from './Monaco';

import * as css from './XMLEditor.less';

import { getRobotEditMenu } from './getRobotEditMenu';

import {
  isString
} from 'min-dash';
import BottomPanel from './BottomPanel';


export class RobotEditor extends CachedComponent {

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
    if (isXMLChange(prevProps.xml, this.props.xml)) {
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

    if (isXMLChange(lastXML, xml)) {
      editor.importXML(xml);

      this.setCached({
        lastXML: xml
      });
    }
  }

  isDirty() {
    const {
      editor,
      lastXML
    } = this.getCached();

    return isXMLChange(editor.getValue(), lastXML);
  }

  handleChanged = () => {
    const {
      onChanged
    } = this.props;

    const {
      editor
    } = this.getCached();

    const undoState = {
      redo: editor.editor.getModel().canRedo(),
      undo: editor.editor.getModel().canUndo()
    };

    const editMenu = getRobotEditMenu(undoState);

    const dirty = this.isDirty();

    const newState = {
      canExport: false,
      dirty,
      save: true,
      ...undoState
    };

    // ensure backwards compatibility
    // https://github.com/camunda/camunda-modeler/commit/78357e3ed9e6e0255ac8225fbdf451a90457e8bf#diff-bd5be70c4e5eadf1a316c16085a72f0fL17
    newState.editable = true;
    newState.searchable = true;

    const windowMenu = [];

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

    const xml = editor.getValue();

    this.setCached({
      lastXML: xml,
      stackIdx
    });

    return xml;
  }

  render() {
    const {
      editor
    } = this.getCached();

    console.log(this.props);

    return (
      <div className={ css.XMLEditor }>
        <div className="content" ref={ this.ref }></div>
        <BottomPanel
          getValue={
            () => editor.getValue()
          }
          name={ this.props.file?.name }
          id={ this.props.id }
          onAction={ this.props.onAction }
          key={ this.props.id }
          { ...this.props }
        />
      </div>
    );
  }

  static createCachedState() {

    const editor = Monaco();

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

export default WithCache(WithCachedState(RobotEditor));

// helpers //////////

function isXMLChange(prevXML, xml) {
  return trim(prevXML) !== trim(xml);
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
