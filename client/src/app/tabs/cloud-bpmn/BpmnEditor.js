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
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import PropertiesPanelContainer, { DEFAULT_LAYOUT as PROPERTIES_PANEL_DEFAULT_LAYOUT } from '../../resizable-container/PropertiesPanelContainer';

import TaskTestingTab from '../../panel/tabs/task-testing/TaskTestingTab';
import VariableTab from '../../panel/tabs/variable-outline/VariableOutlineTab';

import BpmnModeler from './modeler';

import { active as isInputActive } from '../../../util/dom/isInput';

import getBpmnContextMenu from '../bpmn/getBpmnContextMenu';

import { getBpmnEditMenu } from '../bpmn/getBpmnEditMenu';

import getBpmnWindowMenu from '../bpmn/getBpmnWindowMenu';

import * as css from './BpmnEditor.less';

import generateImage from '../../util/generateImage';

import applyDefaultTemplates from '../bpmn-shared/modeler/features/apply-default-templates/applyDefaultTemplates';

import configureModeler from '../bpmn-shared/util/configure';

import Metadata from '../../../util/Metadata';

import { GridBehavior } from '../util/grid';

import {
  EngineProfile,
  getEngineProfileFromBpmn
} from '../EngineProfile';

import EngineProfileHelper from '../EngineProfileHelper';

import {
  ENGINES
} from '../../../util/Engines';

import { getCloudTemplates } from '../../../util/elementTemplates';

const EXPORT_AS = [ 'png', 'jpeg', 'svg' ];

export const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.CLOUD
};

const LOW_PRIORITY = 500;


export class BpmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.handleEngineProfileChangeDebounced = debounce(this.handleEngineProfileChange);

    this.engineProfile = new EngineProfileHelper({
      get: () => {
        const modeler = this.getModeler();

        const definitions = modeler.getDefinitions();

        return getEngineProfileFromBpmn(definitions, DEFAULT_ENGINE_PROFILE);
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

        this.props.onAction('emit-event', {
          type: 'tab.engineProfileChanged',
          payload: {
            executionPlatform,
            executionPlatformVersion
          }
        });
      },
      getCached: () => this.getCached(),
      setCached: ({ engineProfile }) => {
        this.handleEngineProfileChangeDebounced({ engineProfile });

        this.setCached({ engineProfile });
      }
    });

    this.gridBehavior = new GridBehavior({
      getDiagram: () => this.getModeler()
    });

    this.handleResize = debounce(this.handleResize);

    this.handleLintingDebounced = debounce(this.handleLinting.bind(this));

    this.handlePropertiesPanelLayoutChange = this.handlePropertiesPanelLayoutChange.bind(this);
    this.handleLayoutChange = this.handleLayoutChange.bind(this);
  }

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
      this.getModeler().get('linting').setErrors(this.props.linting || []);
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
  }

  handlePropertiesPanelLayoutChange(e) {
    this.handleLayoutChange({
      propertiesPanel: e.layout
    });
  }

  handleEngineProfileChange = ({ engineProfile }) => {
    const { executionPlatformVersion: version } = engineProfile;

    if (!version) {
      return;
    }

    const elementTemplates = this.getModeler().get('elementTemplates');

    const engines = {
      ...elementTemplates.getEngines(),
      camunda: version
    };

    elementTemplates.setEngines(engines);
  };

  async loadTemplates() {
    const { getConfig } = this.props;

    const modeler = this.getModeler();

    const templatesLoader = modeler.get('elementTemplatesLoader');

    let templates = await getConfig('bpmn.elementTemplates');

    templatesLoader.setTemplates(getCloudTemplates(templates));
  }

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

      if (engineProfile) {
        const { executionPlatform, executionPlatformVersion } = engineProfile;

        this.props.onAction('emit-event', {
          type: 'tab.engineProfileChanged',
          payload: {
            executionPlatform,
            executionPlatformVersion
          }
        });
      }
    }

    if (!error) {
      try {
        this.handleLinting();
      } catch (err) {
        error = err;
      }
    }

    this.setState({
      importing: false
    });

    onImport(error, warnings);
  };

  handleChanged = () => {
    const modeler = this.getModeler();

    const {
      onChanged
    } = this.props;

    const dirty = this.isDirty();

    const commandStack = modeler.get('commandStack');
    const selection = modeler.get('selection');

    const selectionLength = selection.get().length;

    const inputActive = isInputActive();

    const canvasFocused = modeler.get('canvas').isFocused();

    const newState = {
      align: selectionLength > 1,
      appendElement: canvasFocused,
      canvasFocused,
      close: true,
      copy: !!selectionLength,
      cut: false,
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
      paste: !modeler.get('clipboard').isEmpty(),
      platform: 'cloud',
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
      zoom: true
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

  handleLinting = () => {
    const {
      engineProfile,
      modeler
    } = this.getCached();

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

  isDirty() {
    const {
      modeler,
      stackIdx
    } = this.getCached();

    const commandStack = modeler.get('commandStack');

    return commandStack._stackIdx !== stackIdx;
  }

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

    let error = null, warnings = null;
    try {

      const result = await modeler.importXML(xml);
      warnings = result.warnings;
    } catch (err) {

      error = err;
      warnings = err.warnings;
    }

    if (this._isMounted) {
      this.handleImport(error, warnings);
    }
  }

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

    return generateImage(type, svg);
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

  triggerAction = (action, context = {}) => {
    const {
      layout = {}
    } = this.props;

    const {
      propertiesPanel: propertiesPanelLayout = {}
    } = layout;

    const modeler = this.getModeler();

    if (action === 'resize') {
      return this.handleResize();
    }

    if (action === 'toggleGrid') {
      return this.gridBehavior.toggleGrid(layout, this.handleLayoutChange);
    }

    if (action === 'toggleProperties') {
      const newLayout = {
        propertiesPanel: {
          ...PROPERTIES_PANEL_DEFAULT_LAYOUT,
          ...propertiesPanelLayout,
          open: !propertiesPanelLayout.open
        }
      };

      return this.handleLayoutChange(newLayout);
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

    if (action === 'resources.reload') {
      return modeler.get('resources.resourceLoader').reload();
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

  handleContextMenu = (event) => {

    const {
      onContextMenu
    } = this.props;

    if (isFunction(onContextMenu)) {
      onContextMenu(event);
    }
  };

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

  render() {
    const engineProfile = this.engineProfile.getCached();

    const { layout, onAction } = this.props;

    const modeler = this.getModeler();
    const imported = modeler.getDefinitions();
    const injector = modeler.get('injector');

    const {
      importing
    } = this.state;

    return (
      <div className={ css.BpmnEditor }>

        <Loader hidden={ imported && !importing } />

        <div className="editor">
          <div
            className="diagram"
            ref={ this.ref }
            onFocus={ this.handleChanged }
            onContextMenu={ this.handleContextMenu }
          ></div>

          <PropertiesPanelContainer
            ref={ this.propertiesPanelRef }
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange } />
        </div>

        { engineProfile && <EngineProfile
          type="bpmn"
          engineProfile={ engineProfile }
          onChange={ (engineProfile) => this.engineProfile.set(engineProfile) } />
        }

        <TaskTestingTab
          config={ this.props.config }
          deployment={ this.props.deployment }
          file={ this.props.file }
          id={ this.props.id }
          injector={ injector }
          layout={ layout }
          onAction={ onAction }
          startInstance={ this.props.startInstance }
          zeebeApi={ this.props.zeebeApi } />

        <VariableTab
          id={ this.props.id }
          injector={ injector }
          layout={ layout }
          onAction={ onAction } />
      </div>
    );
  }

  static createCachedState(props) {

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
    }, handleMiddlewareExtensions, 'cloud');

    if (warnings.length && isFunction(onError)) {
      onError(
        'Problem(s) configuring BPMN editor: \n\t' +
        warnings.map(error => error.message).join('\n\t') +
        '\n'
      );
    }

    const modeler = new BpmnModeler({
      ...options,
      position: 'absolute',
      changeTemplateCommand: 'propertiesPanel.zeebe.changeTemplate',
      linting: {
        active: layout.panel && layout.panel.open && layout.panel.tab === 'linting'
      },
      propertiesPanel: {
        feelTooltipContainer: '.editor',
        feelPopupContainer: '.bjs-container',
        layout: layout.propertiesPanel
      },
      elementTemplateChooser: false,
      keyboard: {
        bind: false
      },
      elementTemplates: {
        engines: {
          camundaDesktopModeler: version
        }
      }
    });

    modeler.on('elementTemplates.errors', (event) => {
      console.warn('Element templates errors', event.errors);
    });

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
      templatesLoaded: false
    };
  }

}


export default WithCache(WithCachedState(BpmnEditor));

// helpers //////////

function isCacheStateChanged(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}

function isPropertiesPanelLayoutChanged(prevProps, props) {

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
