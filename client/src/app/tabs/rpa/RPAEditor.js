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

// import {
//   WithCache,
//   WithCachedState,
//   CachedComponent
// } from 'camunda-modeler-plugin-helpers/components';

const {
  WithCache,
  WithCachedState,
  CachedComponent
} = window.components;


// import Monaco from './Monaco';

import * as css from './RPAEditor.less';

// import { getRobotEditMenu } from './getRobotEditMenu';

import {
  isString
} from 'min-dash';

import { RPAEditor as coolRpaEditor, OutputContent } from '@camunda/rpa-integration';
import PropertiesPanelContainer from '../../resizable-container/PropertiesPanelContainer';
import { getRPAEditMenu } from './getRobotEditMenu';
import { Fill } from '../../slot-fill';
import RunButton from './RunButton';
import StatusButton from './StatusButton';

export class RPAEditor extends CachedComponent {

  constructor(props) {
    super(props);

    console.log('props', props);
    this.state = {
      save: true
    };

    this.modelerRef = React.createRef();
    this.propertiesPanelRef = React.createRef();
    this._editor = {};

    this.handleLayoutChange = this.handleLayoutChange.bind(this);
  }

  componentDidMount() {

    // const {
    //   editor
    // } = this.getCached();

    // editor.attachTo(this.modelerRef.current);


    this._editor = coolRpaEditor({
      container: this.modelerRef.current,
      propertiesPanel: {
        container: this.propertiesPanelRef.current
      },
      value: this.props.xml
    });

    this.handleChanged();

    // this.checkImport();
  }

  // componentWillUnmount() {
  //   const {
  //     editor
  //   } = this.getCached();

  //   editor.detach();

  //   editor.off('change', this.handleChanged);
  // }

  // componentDidUpdate(prevProps) {
  //   if (isXMLChange(prevProps.xml, this.props.xml)) {
  //     this.checkImport();
  //   }

  //   if (isChachedStateChange(prevProps, this.props)) {
  //     this.handleChanged();
  //   }
  // }

  triggerAction(action) {

    console.log('triggerAction', action);

    // const {
    //   editor
    // } = this.getCached();

    // return editor.execCommand(action);
  }

  // checkImport() {
  //   const { xml } = this.props;

  //   const {
  //     editor,
  //     lastXML
  //   } = this.getCached();

  //   if (isXMLChange(lastXML, xml)) {
  //     editor.importXML(xml);

  //     this.setCached({
  //       lastXML: xml
  //     });
  //   }
  // }

  isDirty() {
    console.log('isDirty');

    // const {
    //   editor,
    //   lastXML
    // } = this.getCached();

    // return isXMLChange(editor.getValue(), lastXML);
    return true;
  }

  handleChanged = () => {
    console.log('handleChanged');

    const {
      onChanged
    } = this.props;

    const
          editor
     = this._editor;

    const undoState = {
      redo: editor.editor.getModel().canRedo(),
      undo: editor.editor.getModel().canUndo()
    };

    const editMenu = getRPAEditMenu(undoState);

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

  handleLayoutChange(newLayout) {
    const {
      onLayoutChanged
    } = this.props;

    if (onLayoutChanged) {
      onLayoutChanged(newLayout);
    }
  }


  getXML() {
    const editor = this._editor;

    // const stackIdx = editor._stackIdx;

    const xml = editor.getValue();

    this.setCached({
      lastXML: xml

      // stackIdx
    });

    return xml;
  }

  render() {
    return (
      <>
        <div className={ css.RPAEditor }>
          <div className="editor">
            <div
              ref={ this.modelerRef }
              className="diagram">
            </div>

            <PropertiesPanelContainer
              ref={ this.propertiesPanelRef }

              layout={ this.props.layout }
              onLayoutChanged={ this.handleLayoutChange } />
          </div>
        </div>
        <Fill slot="bottom-panel"
          id="RPA-output"
          label="Testing"
          priority={ 15 }
          { ...this.props }
        >
          <OutputContent editor={ this._editor } />
        </Fill>

        <RunButton editor={ this._editor } />
        <StatusButton editor={ this._editor } />
      </>
    );
  }

  static createCachedState() {

    // const editor = Monaco();

    // const stackIdx = editor._stackIdx;

    return {

      // __destroy: () => {
      //   editor.destroy();
      // },
      // editor,
      lastXML: null,
      save: true

      // stackIdx
    };
  }

}

export default WithCache(WithCachedState(RPAEditor));

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
