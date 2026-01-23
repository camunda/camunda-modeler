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
import Monaco from 'monaco-editor';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import * as css from './RPAEditor.less';

import {
  debounce,
  isString
} from 'min-dash';

import { RPAEditor as RPACodeEditor, DebugInfo } from '@camunda/rpa-integration';
import SidePanelContainer from '../../resizable-container/SidePanelContainer';
import { getRPAEditMenu } from './getRobotEditMenu';
import { Fill } from '../../slot-fill';
import RunButton from './RunButton';
import StatusButton from './StatusButton';
import { Loader } from '../../primitives';

import {
  EngineProfile,
  getEngineProfileFromForm
} from '../EngineProfile';

import EngineProfileHelper from '../EngineProfileHelper';
import { ENGINES } from '../../../util/Engines';
export const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.CLOUD
};


export class RPAEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {
      loading: true
    };

    this.modelerRef = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.handleLayoutChange = this.handleLayoutChange.bind(this);
    this.handleLinting = debounce(this.handleLinting.bind(this), 500);

    this.engineProfile = new EngineProfileHelper({
      get: () => {
        const { editor } = this.getCached();

        const value = editor.getValue();

        const schema = JSON.parse(value);

        return getEngineProfileFromForm(schema, DEFAULT_ENGINE_PROFILE);
      },
      set: (engineProfile) => {
        const { editor } = this.getCached();

        editor.eventBus.fire('property.change', {
          key: 'executionPlatformVersion',
          value: engineProfile.executionPlatformVersion
        });
      },
      getCached: () => this.getCached(),
      setCached: (state) => this.setCached(state)
    });
  }


  handleListeners(editor, deregister) {
    const method = deregister ? 'off' : 'on';

    editor.eventBus[method]('config.changed', this.saveConfig);

    editor.eventBus[method]('model.changed', this.handleChanged);

    editor.eventBus[method]('notification.show', this.handleNotification);
  }

  handleNotification = (notification) => {
    this.props.onAction('display-notification', {
      type: 'warning',
      duration: 0,
      ...notification
    });
  };

  saveConfig = (config) => {
    this.props.setConfig('rpa', { workerConfig: config });
    this.setCached({
      lastWorkerConfig: config
    });
  };

  handleLinting = async () => {
    const {
      editor,
    } = this.getCached();

    const contents = editor.getValue();

    const { onAction } = this.props;

    onAction('lint-tab', { contents });
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

    this.handleEngineProfile();
    this.handleChanged();
    this.handleListeners(currentEditor);
    this.setState({
      loading: false
    });
    this.handleLinting();
    this.props.onImport();
  }

  handleEngineProfile() {
    let engineProfile = null;
    let error = null;

    try {
      engineProfile = this.engineProfile.get();
    } catch (err) {
      error = err;
    }

    const { engineProfile: cachedEngineProfile } = this.getCached();

    if (engineProfile.executionPlatformVersion === cachedEngineProfile?.executionPlatformVersion) {
      return;
    }

    if (error) {
      this.setCached({
        engineProfile: null,
      });
    } else {
      this.setCached({
        engineProfile,
      });
    }
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
      scrollBeyondLastLine: false,
      fontFamily: 'var(--font-family-monospace)'
    });

    document.fonts.ready.then(() => {
      Monaco.editor.remeasureFonts();
    });

    this.setCached({
      editor,
      lastXML: this.props.xml,
      lastWorkerConfig: rpaConfig.workerConfig
    });

    this.setState({
      loading: false
    });

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

    this.handleEngineProfile();

    this.handleLinting();
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

    const { editor, engineProfile } = this.getCached();

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

            <SidePanelContainer
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
          { engineProfile && <EngineProfile
            engineProfile={ engineProfile }
            onChange={ (engineProfile) => this.engineProfile.set(engineProfile) } /> }
        </>
        }
      </>
    );
  }

  static createCachedState() {

    // The editor does not support detach/attach events. We will cache DOM elements
    // instead to avoid re-importing the content on each tab switch.
    const editorContainer = document.createElement('div');
    editorContainer.classList.add('monaco-container');
    const propertiesContainer = document.createElement('div');
    propertiesContainer.classList.add('properties-container');

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
