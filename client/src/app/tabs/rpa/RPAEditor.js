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

import * as css from './RPAEditor.less';

import {
  isString
} from 'min-dash';

import { RPAEditor as RPACodeEditor, DebugInfo } from '@camunda/rpa-integration';
import PropertiesPanelContainer from '../../resizable-container/PropertiesPanelContainer';
import { getRPAEditMenu } from './getRobotEditMenu';
import { Fill } from '../../slot-fill';
import RunButton from './RunButton';
import StatusButton from './StatusButton';
import { Loader } from '../../primitives';

export class RPAEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {
      loading: true
    };

    this.modelerRef = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.handleLayoutChange = this.handleLayoutChange.bind(this);
  }


  handleListeners(editor, deregister) {
    const method = deregister ? 'off' : 'on';

    editor.eventBus[method]('config.changed', this.saveConfig);

    editor.eventBus[method]('model.changed', this.handleChanged);
  }


  saveConfig = (config) => {
    this.props.setConfig('rpa', { workerConfig: config });
    this.setCached({
      lastWorkerConfig: config
    });
  };


  async componentDidMount() {

    const {
      editorContainer,
      propertiesContainer,
      editor
    } = this.getCached();

    this.modelerRef.current.appendChild(editorContainer);
    this.propertiesPanelRef.current.appendChild(propertiesContainer);

    let currentEditor = editor;

    try {
      if (!currentEditor) {

        // Create editor if not present
        currentEditor = await this.createEditor();
      } else {

        // or reimport if config changed
        currentEditor = await this.checkImport();
      }

    } catch (e) {
      this.handleError(e);
      return;
    }

    this.handleChanged();
    this.handleListeners(currentEditor);
    this.setState({
      loading: false
    });
    this.props.onImport();
  }

  async createEditor() {
    this.setState({
      loading: true
    });

    const rpaConfig = await this.props.getConfig('rpa', {});

    const {
      editorContainer,
      propertiesContainer,
      editor: cachedEditor
    } = this.getCached();

    if (cachedEditor) {
      cachedEditor.destroy();
    }

    const editor = RPACodeEditor({
      container: editorContainer,
      propertiesPanel: {
        container: propertiesContainer
      },
      workerConfig: rpaConfig.workerConfig,
      value: this.props.xml
    });

    // Prevent scrolling
    editor.editor.updateOptions({
      scrollBeyondLastLine: false
    });

    this.setCached({
      editor,
      lastXML: this.props.xml,
      lastWorkerConfig: rpaConfig.workerConfig
    });

    this.setState({
      loading: false
    });

    this.handleListeners(editor);
    return editor;
  }

  handleError(error) {
    this.setCached({
      editor: null,
      lastXML: null,
    });

    this.props.onImport(error);
  }

  componentWillUnmount() {
    const {
      editorContainer,
      propertiesContainer,
      editor
    } = this.getCached();

    editorContainer.remove();
    propertiesContainer.remove();

    if (!editor) {
      return;
    }

    this.handleListeners(editor, true);
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

    const {
      editor: monaco
    } = editor;

    if (action === 'undo') {
      monaco.trigger('menu', 'undo');
    }

    if (action === 'redo') {
      monaco.trigger('menu', 'redo');
    }

    if (action === 'find') {
      monaco.getAction('actions.find').run();
    }

    if (action === 'findNext') {
      monaco.getAction('editor.action.nextMatchFindAction').run();
    }

    if (action === 'findPrev') {
      monaco.getAction('editor.action.previousMatchFindAction').run();
    }

    if (action === 'replace') {
      monaco.getAction('editor.action.startFindReplaceAction').run();
    }
  }

  async checkImport() {
    const { xml } = this.props;

    const {
      lastXML,
      lastWorkerConfig,
      editor
    } = this.getCached();

    if (isXMLChange(lastXML, xml)) {
      return this.createEditor();
    }

    const rpaConfig = await this.props.getConfig('rpa', {});
    if (isWorkerConfigChange(rpaConfig.workerConfig, lastWorkerConfig)) {
      editor.workerConfig = rpaConfig.workerConfig;
      editor.eventBus.fire('config.changed', rpaConfig.workerConfig);
    }

    return editor;
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
      editor: monaco
    } = this.getCached();

    if (!monaco) {
      return;
    }

    const undoState = {
      redo: monaco.editor.getModel().canRedo(),
      undo: monaco.editor.getModel().canUndo()
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
    const { editor } = this.getCached();

    const xml = editor.getValue();

    this.setCached({
      lastXML: xml
    });

    return xml;
  }

  render() {

    const { editor } = this.getCached();

    const loading = this.state.loading;

    return (
      <>
        <Loader hidden={ !loading } />

        <div className={ css.RPAEditor }>
          <div className="editor">
            <div
              ref={ this.modelerRef }
              className="content">
            </div>

            <PropertiesPanelContainer
              ref={ this.propertiesPanelRef }
              layout={ this.props.layout }
              onLayoutChanged={ this.handleLayoutChange } />
          </div>
        </div>

        { !loading && <>
          <Fill
            { ...this.props }
            slot="bottom-panel"
            id="RPA-output"
            label="Testing"
            priority={ 15 }
          >
            <DebugInfo editor={ editor } />
          </Fill>

          <StatusButton getConfig={ this.props.getConfig } setConfig={ this.props.getConfig } editor={ editor } />
          <RunButton editor={ editor } layout={ this.props.layout } onAction={ this.props.onAction } />
        </>
        }

        <Fill slot="status-bar__file" group="1_engine">
          <div>Camunda 8</div>
        </Fill>
      </>
    );
  }

  static createCachedState() {

    // The editor does not support detach/attach events. We will cache DOM elements
    // instead to avoid re-importing the content on each tab switch.
    const editorContainer = document.createElement('div');
    editorContainer.classList.add('monaco-container');
    const propertiesContainer = document.createElement('div');

    return {
      editorContainer,
      propertiesContainer,
      lastXML: null,
      editor: null
    };
  }

}

export default WithCache(WithCachedState(RPAEditor));

// helpers //////////

function isXMLChange(prevXML, xml) {
  return trim(prevXML) !== trim(xml);
}

function isWorkerConfigChange(prevConfig, config) {
  return JSON.stringify(prevConfig) !== JSON.stringify(config);
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
