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

import { isFunction } from 'min-dash';

import {
  Loader
} from '../../primitives';

import {
  debounce
} from '../../../util';

import {
  CachedComponent
} from '../../cached';

import { Settings } from '@carbon/icons-react';

import SidePanel, { DEFAULT_LAYOUT as SIDE_PANEL_DEFAULT_LAYOUT } from '../../side-panel/SidePanel';
import PropertiesTab from '../../side-panel/tabs/PropertiesTab';
import PropertiesPanelTabActionItem from '../../resizable-container/PropertiesPanelTabActionItem';

import { active as isInputActive, isTextInput } from '../../../util/dom/isInput';

import getBpmnContextMenu from '../bpmn/getBpmnContextMenu';

import { getBpmnEditMenu } from '../bpmn/getBpmnEditMenu';

import getBpmnWindowMenu from '../bpmn/getBpmnWindowMenu';

import { svgToImage } from '@bpmn-io/svg-to-image';

import applyDefaultTemplates from './modeler/features/apply-default-templates/applyDefaultTemplates';

import configureModeler from './util/configure';

import { GridBehavior } from '../util/grid';

import Metadata from '../../../util/Metadata';

import {
  EngineProfile,
  getEngineProfileFromBpmn
} from '../EngineProfile';

import EngineProfileHelper from '../EngineProfileHelper';

const EXPORT_AS = [ 'png', 'jpeg', 'svg' ];

const LOW_PRIORITY = 500;


/**
 * Base class for BPMN editors (platform and cloud variants).
 *
 * Subclasses must implement:
 * - render()
 * - static createCachedState(props)
 * - loadTemplates()
 *
 * Subclasses may override:
 * - getDefaultEngineProfile()
 * - getPlatformString()
 * - preProcessXML(xml) - called before XML import (e.g., namespace conversion)
 * - onImportSuccess(engineProfile) - called on successful import
 * - onEngineProfileSet(engineProfile) - called after engine profile is set on modeler
 * - createEngineProfileSetCached() - returns setCached callback for EngineProfileHelper
 * - getAdditionalListeners() - returns extra event [event, handler] pairs
 * - getExtraChangedState() - returns extra properties for handleChanged state
 * - handleExtraAction(action, context, layout, modeler) - handles variant-specific actions
 * - handleToggleProperties(layout, sidePanelLayout) - variant-specific toggle logic
 * - setupConstructorExtras() - additional constructor setup
 */
export default class BpmnEditorBase extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.setupConstructorExtras();

    this.engineProfile = new EngineProfileHelper({
      get: () => {
        const modeler = this.getModeler();

        const definitions = modeler.getDefinitions();

        return getEngineProfileFromBpmn(definitions, this.getDefaultEngineProfile());
      },
      set: (engineProfile) => {
        const modeler = this.getModeler();

        const canvas = modeler.get('canvas'),
              modeling = modeler.get('modeling');

        const definitions = modeler.getDefinitions();

        const {
          executionPlatform,
          executionPlatformVersion
        } = engineProfile;

        modeling.updateModdleProperties(canvas.getRootElement(), definitions, {
          'modeler:executionPlatform': executionPlatform,
          'modeler:executionPlatformVersion': executionPlatformVersion
        });

        this.onEngineProfileSet(engineProfile);
      },
      getCached: () => this.getCached(),
      setCached: this.createEngineProfileSetCached()
    });

    this.gridBehavior = new GridBehavior({
      getDiagram: () => this.getModeler()
    });

    this.handleResize = debounce(this.handleResize);

    this.handleLintingDebounced = debounce(this.handleLinting.bind(this));
    this.handlePropertiesPanelLayoutChange = this.handlePropertiesPanelLayoutChange.bind(this);
    this.handleLayoutChange = this.handleLayoutChange.bind(this);
  }


  // -- Hooks for subclasses to override --

  /**
   * Returns the default engine profile for this editor variant.
   * @returns {{ executionPlatform: string }}
   */
  getDefaultEngineProfile() {
    throw new Error('Subclass must implement getDefaultEngineProfile()');
  }

  /**
   * Returns 'platform' or 'cloud'.
   * @returns {string}
   */
  getPlatformString() {
    throw new Error('Subclass must implement getPlatformString()');
  }

  /**
   * Called during constructor for variant-specific setup.
   * Default: no-op.
   */
  setupConstructorExtras() {}

  /**
   * Called after engine profile is set on the modeler via modeling API.
   * Cloud variant emits an event; platform is no-op.
   * @param {{ executionPlatform: string, executionPlatformVersion: string }} engineProfile
   */
  onEngineProfileSet(engineProfile) {}

  /**
   * Returns the setCached callback for EngineProfileHelper.
   * Platform passes state directly; cloud adds debounced handling.
   * @returns {function}
   */
  createEngineProfileSetCached() {
    return (state) => this.setCached(state);
  }

  /**
   * Pre-process XML before importing into the modeler.
   * Platform applies namespace conversion; cloud returns xml as-is.
   * @param {string} xml
   * @returns {Promise<string>}
   */
  async preProcessXML(xml) {
    return xml;
  }

  /**
   * Called after a successful import.
   * Cloud emits engine profile changed event; platform is no-op.
   * @param {{ executionPlatform: string, executionPlatformVersion?: string } | null} engineProfile
   */
  onImportSuccess(engineProfile) {}

  /**
   * Returns extra event/handler pairs for listen().
   * @returns {Array<[string, function] | [string, number, function]>}
   */
  getAdditionalListeners() {
    return [];
  }

  /**
   * Returns extra state properties for handleChanged().
   * Cloud adds { variablesPanel: true }.
   * @returns {Object}
   */
  getExtraChangedState() {
    return {};
  }

  /**
   * Handles variant-specific trigger actions.
   * Return HANDLED or a value to indicate the action was handled.
   * Return null to fall through to default handling.
   */
  handleExtraAction(action, context, layout, modeler) {
    return null;
  }

  /**
   * Handles the toggleProperties action.
   * Platform uses simple toggle; cloud uses enhanced multi-tab logic.
   * Return layout object or null to skip default behavior.
   */
  handleToggleProperties(layout, sidePanelLayout) {
    const newLayout = {
      sidePanel: {
        ...SIDE_PANEL_DEFAULT_LAYOUT,
        ...sidePanelLayout,
        open: !sidePanelLayout.open,
        tab: 'properties'
      }
    };

    return newLayout;
  }


  // -- Lifecycle methods --

  async componentDidMount() {
    this._isMounted = true;

    const {
      layout
    } = this.props;

    const modeler = this.getModeler();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const minimap = modeler.get('minimap');

    minimap.toggle(layout.minimap?.open === true);

    this.gridBehavior.update(layout);

    const propertiesPanel = modeler.get('propertiesPanel');

    if (layout.propertiesPanel) {
      propertiesPanel.setLayout(layout.propertiesPanel);
    }

    propertiesPanel.attachTo(this.propertiesPanelRef.current);


    try {
      await this.loadTemplates();
    } catch (error) {
      this.handleError({ error });
    }

    this.checkImport();
  }

  componentWillUnmount() {
    this._isMounted = false;

    const modeler = this.getModeler();

    this.listen('off');

    modeler.detach();

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.detach();
  }

  componentDidUpdate(prevProps) {
    this.checkImport(prevProps);

    if (isCacheStateChanged(prevProps, this.props)) {
      this.handleChanged();
    }

    if (prevProps.linting !== this.props.linting) {
      const { lastXML } = this.getCached();

      if (lastXML && !this.state.importing) {
        this.getModeler().get('linting').setErrors(this.props.linting || []);
      }
    }

    if (prevProps.file !== this.props.file) {
      this.loadTemplates();
    }

    const { layout = {} } = this.props;

    const { panel = {} } = layout;

    if (panel.open && panel.tab === 'linting') {
      this.getModeler().get('linting').activate();
    } else if (!panel.open || panel.tab !== 'linting') {
      this.getModeler().get('linting').deactivate();
    }

    if (isPropertiesPanelLayoutChanged(prevProps, this.props)) {
      const modeler = this.getModeler();
      const propertiesPanel = modeler.get('propertiesPanel');

      propertiesPanel.setLayout(this.props.layout.propertiesPanel);
    }

    this.gridBehavior.checkUpdate(prevProps.layout, layout);
  }


  // -- Event wiring --

  listen(fn) {
    const modeler = this.getModeler();

    modeler[fn]('attach', this.handleAttach);

    [
      'import.done',
      'saveXML.done',
      'commandStack.changed',
      'selection.changed',
      'attach',
      'elements.copied',
      'propertiesPanel.focusin',
      'propertiesPanel.focusout',
      'canvas.focus.changed'
    ].forEach((event) => {
      modeler[fn](event, this.handleChanged);
    });

    modeler[fn]('elementTemplates.errors', this.handleElementTemplateErrors);

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);

    modeler[fn]('propertiesPanel.layoutChanged', this.handlePropertiesPanelLayoutChange);

    if (fn === 'on') {
      modeler[ fn ]('commandStack.changed', LOW_PRIORITY, this.handleLintingDebounced);
    } else if (fn === 'off') {
      modeler[ fn ]('commandStack.changed', this.handleLintingDebounced);
    }

    // variant-specific listeners
    const additionalListeners = this.getAdditionalListeners();
    for (const args of additionalListeners) {
      modeler[fn](...args);
    }
  }

  handlePropertiesPanelLayoutChange(e) {
    this.handleLayoutChange({
      propertiesPanel: e.layout
    });
  }


  // -- Templates --

  /**
   * Subclasses must implement this method.
   */
  async loadTemplates() {
    throw new Error('Subclass must implement loadTemplates()');
  }


  // -- Commands --

  undo = () => {
    const modeler = this.getModeler();

    modeler.get('commandStack').undo();
  };

  redo = () => {
    const modeler = this.getModeler();

    modeler.get('commandStack').redo();
  };

  handleAlignElements = (type) => {
    this.triggerAction('alignElements', {
      type
    });
  };


  // -- Event handlers --

  handleMinimapToggle = (event) => {
    this.handleLayoutChange({
      minimap: {
        open: event.open
      }
    });
  };

  handleElementTemplateErrors = (event) => {
    const {
      onWarning
    } = this.props;

    const {
      errors
    } = event;

    errors.forEach(error => {
      onWarning({ message: error.message });
    });
  };

  handleAttach = (event) => {
    const modeler = this.getModeler();

    modeler.get('canvas').focus();
  };

  handleError = (event) => {
    const {
      error
    } = event;

    const {
      onError
    } = this.props;

    onError(error);
  };


  // -- Import --

  handleImport = (error, warnings) => {
    const {
      isNew,
      onImport,
      xml
    } = this.props;

    let {
      defaultTemplatesApplied
    } = this.getCached();

    const modeler = this.getModeler();

    const commandStack = modeler.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    let engineProfile = null;

    if (!error) {
      try {
        engineProfile = this.engineProfile.get(true);
      } catch (err) {
        error = err;
      }
    }

    if (!error && isNew && !defaultTemplatesApplied) {
      try {
        modeler.invoke(applyDefaultTemplates);

        defaultTemplatesApplied = true;
      } catch (err) {
        error = err;
      }
    }

    if (error) {
      this.setCached({
        defaultTemplatesApplied: false,
        engineProfile: null,
        lastXML: null
      });
    } else {
      this.setCached({
        defaultTemplatesApplied,
        engineProfile,
        lastXML: xml,
        stackIdx
      });

      this.onImportSuccess(engineProfile);
    }

    if (!error) {
      try {
        this.handleLinting(engineProfile);
      } catch (err) {
        error = err;
      }
    }

    this.setState({
      importing: false
    });

    onImport(error, warnings);
  };


  // -- Changed state --

  handleChanged = () => {
    const modeler = this.getModeler();

    const {
      onChanged
    } = this.props;

    const dirty = this.isDirty();

    const commandStack = modeler.get('commandStack');
    const selection = modeler.get('selection');

    const selectionLength = selection.get().length;
    const selectionIncludesShapes = selection.get().some(el => !el.waypoints);

    const inputActive = isInputActive();

    const canvasFocused = modeler.get('canvas').isFocused();

    const newState = {
      align: selectionLength > 1,
      appendElement: canvasFocused,
      canvasFocused,
      close: true,
      copy: selectionIncludesShapes,
      copyAsImage: selectionIncludesShapes,
      cut: selectionIncludesShapes,
      duplicate: canvasFocused && selectionIncludesShapes,
      createElement: canvasFocused,
      defaultCopyCutPaste: !canvasFocused,
      defaultUndoRedo: !canvasFocused,
      dirty,
      distribute: selectionLength > 2,
      editLabel: canvasFocused && selectionLength === 1,
      exportAs: EXPORT_AS,
      find: canvasFocused,
      globalConnectTool: canvasFocused,
      handTool: canvasFocused,
      inputActive,
      lassoTool: canvasFocused,
      moveCanvas: canvasFocused,
      moveToOrigin: canvasFocused,
      moveSelection: canvasFocused && !!selectionLength,
      paste: true,
      platform: this.getPlatformString(),
      propertiesPanel: true,
      grid: this.gridBehavior.hasGrid(),
      redo: canvasFocused && commandStack.canRedo(),
      removeSelected: canvasFocused && !!selectionLength,
      replaceElement: canvasFocused && selectionLength == 1,
      save: true,
      selectAll: canvasFocused || inputActive,
      setColor: !!selectionLength,
      spaceTool: canvasFocused,
      undo: canvasFocused && commandStack.canUndo(),
      zoom: true,
      ...this.getExtraChangedState()
    };

    // ensure backwards compatibility
    // https://github.com/camunda/camunda-modeler/commit/78357e3ed9e6e0255ac8225fbdf451a90457e8bf#diff-bd5be70c4e5eadf1a316c16085a72f0fL17
    newState.bpmn = true;
    newState.editable = true;
    newState.elementsSelected = !!selectionLength;
    newState.inactiveInput = !inputActive;

    const contextMenu = getBpmnContextMenu(newState);

    const editMenu = getBpmnEditMenu(newState);

    const windowMenu = getBpmnWindowMenu(newState);

    if (isFunction(onChanged)) {
      onChanged({
        ...newState,
        contextMenu,
        editMenu,
        windowMenu
      });
    }

    this.setState(newState);

    try {
      const engineProfile = this.engineProfile.get();

      this.engineProfile.setCached(engineProfile);
    } catch (err) {

      // TODO
    }
  };


  // -- Linting --

  handleLinting = (engineProfileOverride) => {
    const {
      engineProfile: cachedEngineProfile,
      modeler
    } = this.getCached();

    const engineProfile = engineProfileOverride || cachedEngineProfile;

    if (!engineProfile) {
      return;
    }

    const contents = modeler.getDefinitions();

    const { onAction } = this.props;

    onAction('lint-tab', { contents });
  };

  isLintingActive = () => {
    return this.getModeler().get('linting').isActive();
  };


  // -- Dirty state --

  isDirty() {
    const {
      modeler,
      stackIdx
    } = this.getCached();

    const commandStack = modeler.get('commandStack');

    return commandStack._stackIdx !== stackIdx;
  }


  // -- Import --

  checkImport(prevProps) {
    if (!this.isImportNeeded(prevProps)) {
      return;
    }

    const { xml } = this.props;

    this.importXML(xml);
  }

  isImportNeeded(prevProps) {
    const {
      importing
    } = this.state;

    if (importing) {
      return false;
    }

    const {
      xml
    } = this.props;

    if (prevProps && prevProps.xml === xml) {
      return false;
    }

    const {
      lastXML
    } = this.getCached();

    return xml !== lastXML;
  }

  async importXML(xml) {
    this.setState({
      importing: true
    });

    const modeler = this.getModeler();

    const importedXML = await this.preProcessXML(xml);

    let error = null, warnings = null;
    try {

      const result = await modeler.importXML(importedXML);
      warnings = result.warnings;
    } catch (err) {

      error = err;
      warnings = err.warnings;
    }

    if (this._isMounted) {
      this.handleImport(error, warnings);
    }
  }


  // -- Modeler access --

  /**
   * @returns {BpmnModeler}
   */
  getModeler() {
    const {
      modeler
    } = this.getCached();

    return modeler;
  }

  async getXML() {
    const {
      lastXML,
      modeler
    } = this.getCached();

    const commandStack = modeler.get('commandStack');

    if (!this.isDirty()) {
      return lastXML || this.props.xml;
    }

    try {
      const { xml } = await modeler.saveXML({ format: true });

      const stackIdx = commandStack._stackIdx;

      this.setCached({ lastXML: xml, stackIdx });

      return xml;
    } catch (error) {
      this.handleError({ error });

      return Promise.reject(error);
    }
  }

  async exportAs(type) {
    let svg;

    try {
      svg = await this.exportSVG();
    } catch (error) {
      this.handleError({ error });

      return Promise.reject(error);
    }

    if (type === 'svg') {
      return svg;
    }

    return svgToImage(svg, { imageType: type, outputFormat: 'dataUrl' });
  }

  async exportSVG() {
    const modeler = this.getModeler();

    try {
      const { svg } = await modeler.saveSVG();

      return svg;
    } catch (err) {

      return Promise.reject(err);
    }
  }


  // -- Actions --

  triggerAction = (action, context = {}) => {
    const {
      layout = {}
    } = this.props;

    const {
      sidePanel: sidePanelLayout = {}
    } = layout;

    const modeler = this.getModeler();

    if (action === 'resize') {
      return this.handleResize();
    }

    if (action === 'toggleGrid') {
      return this.gridBehavior.toggleGrid(layout, this.handleLayoutChange);
    }

    if (action === 'toggleProperties') {
      const newLayout = this.handleToggleProperties(layout, sidePanelLayout);

      return this.handleLayoutChange(newLayout);
    }

    // Check variant-specific actions first
    const extraResult = this.handleExtraAction(action, context, layout, modeler);
    if (extraResult !== null) {
      return extraResult;
    }

    if (action === 'zoomIn') {
      action = 'stepZoom';

      context = {
        value: 1
      };
    }

    if (action === 'zoomOut') {
      action = 'stepZoom';

      context = {
        value: -1
      };
    }

    if (action === 'resetZoom') {
      action = 'zoom';

      context = {
        value: 1
      };
    }

    if (action === 'zoomFit') {
      action = 'zoom';

      context = {
        value: 'fit-viewport'
      };
    }

    if (action === 'showLintError') {
      this.getModeler().get('linting').showError(context);

      return;
    }

    if (action === 'elementTemplates.reload') {
      return this.loadTemplates();
    }

    // TODO(nikku): handle all editor actions
    return modeler.get('editorActions').trigger(action, context);
  };

  handleSetColor = (fill, stroke) => {
    this.triggerAction('setColor', {
      fill,
      stroke
    });
  };

  handleDistributeElements = (type) => {
    this.triggerAction('distributeElements', {
      type
    });
  };


  // -- Context menu --

  handleContextMenu = (event) => {

    // allow default context menu for text inputs,
    // e.g. FEEL popup or direct editing
    if (isTextInput(event.target)) {
      return;
    }

    const {
      onContextMenu
    } = this.props;

    if (isFunction(onContextMenu)) {
      onContextMenu(event);
    }
  };


  // -- Layout --

  handleLayoutChange(newLayout) {
    const {
      onLayoutChanged
    } = this.props;

    if (isFunction(onLayoutChanged)) {
      onLayoutChanged(newLayout);
    }
  }

  handleResize = () => {
    const modeler = this.getModeler();

    const canvas = modeler.get('canvas');
    const eventBus = modeler.get('eventBus');

    canvas.resized();
    eventBus.fire('propertiesPanel.resized');
  };
}


// -- Static helpers for createCachedState --

/**
 * Shared logic for creating cached modeler state.
 * Used by subclass static createCachedState() implementations.
 */
BpmnEditorBase.createModelerForCachedState = function(props, variantConfig) {

  const {
    configureModelerType,
    changeTemplateCommand,
    extraModelerOptions = {},
    onModelerCreated,
    cachedStateExtras = {}
  } = variantConfig;

  const {
    name,
    version
  } = Metadata;

  const {
    getPlugins,
    onAction,
    onError,
    layout = {},
    settings
  } = props;

  // notify interested parties that modeler will be configured
  const handleMiddlewareExtensions = (middlewares) => {
    onAction('emit-event', {
      type: 'bpmn.modeler.configure',
      payload: {
        middlewares
      }
    });
  };

  const {
    options,
    warnings
  } = configureModeler(getPlugins, {
    exporter: {
      name,
      version
    },
    settings
  }, handleMiddlewareExtensions, configureModelerType);

  if (warnings.length && isFunction(onError)) {
    onError(
      'Problem(s) configuring BPMN editor: \n\t' +
      warnings.map(error => error.message).join('\n\t') +
      '\n'
    );
  }

  const BpmnModeler = variantConfig.BpmnModeler;

  const modeler = new BpmnModeler({
    ...options,
    position: 'absolute',
    changeTemplateCommand,
    linting: {
      active: layout.panel && layout.panel.open && layout.panel.tab === 'linting'
    },
    keyboard: {
      bind: false
    },
    ...extraModelerOptions
  });

  if (onModelerCreated) {
    onModelerCreated(modeler);
  }

  const commandStack = modeler.get('commandStack');

  const stackIdx = commandStack._stackIdx;

  // notify interested parties that modeler was created
  onAction('emit-event', {
    type: 'bpmn.modeler.created',
    payload: {
      modeler
    }
  });

  return {
    __destroy: () => {
      modeler.destroy();
    },
    engineProfile: null,
    lastXML: null,
    modeler,
    stackIdx,
    templatesLoaded: false,
    ...cachedStateExtras
  };
};


// -- Re-exports for subclasses --

export {
  EXPORT_AS,
  SIDE_PANEL_DEFAULT_LAYOUT,

  // React and utilities
  React,
  isFunction,
  Loader,
  debounce,

  // UI components
  Settings,
  SidePanel,
  PropertiesTab,
  PropertiesPanelTabActionItem,

  // Modeler utilities
  isInputActive,
  isTextInput,
  getBpmnContextMenu,
  getBpmnEditMenu,
  getBpmnWindowMenu,
  svgToImage,
  applyDefaultTemplates,
  configureModeler,
  GridBehavior,
  Metadata,
  EngineProfile,
  getEngineProfileFromBpmn,
  EngineProfileHelper,

  LOW_PRIORITY
};


// -- Shared helpers --

export function isCacheStateChanged(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}

export function isPropertiesPanelLayoutChanged(prevProps, props) {

  // same Object
  if (props.layout === prevProps.layout) {
    return false;
  }

  // deleted in one of the two
  if (!props.layout || !prevProps.layout) {
    return true;
  }

  // check JSON equality
  return JSON.stringify(prevProps.layout.propertiesPanel) !== JSON.stringify(props.layout.propertiesPanel);
}
