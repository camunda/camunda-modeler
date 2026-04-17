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

import { Settings } from '@carbon/icons-react';

import EmptyCanvasOverlay from '../bpmn/EmptyCanvasOverlay';
import AiPanel from '../bpmn/AiPanel';
import AppendWizard from '../bpmn/AppendWizard';
import { ELEMENT_SHAPE_MAP } from '../bpmn/appendCatalog';

import SidePanel, { DEFAULT_LAYOUT as SIDE_PANEL_DEFAULT_LAYOUT } from '../../side-panel/SidePanel';
import SidePanelTitleBar from '../../side-panel/SidePanelTitleBar';
import PropertiesTab from '../../side-panel/tabs/PropertiesTab';
import PropertiesPanelTabActionItem from '../../resizable-container/PropertiesPanelTabActionItem';
import TaskTestingTabActionItem from './side-panel/tabs/task-testing/TaskTestingTabActionItem';

import TaskTestingTab from './side-panel/tabs/task-testing/TaskTestingTab';
import TaskTestingIcon from '../../../../resources/icons/TaskTesting.svg';
import SidePanelHeader from './side-panel/SidePanelHeader';

import VariablesSidePanel, { DEFAULT_LAYOUT as VARIABLES_PANEL_DEFAULT_LAYOUT } from './variables-side-panel/VariablesSidePanel';
import VariablesTabActionItem from './variables-side-panel/VariablesTabActionItem';

import BpmnModeler from './modeler';

import { active as isInputActive } from '../../../util/dom/isInput';

import getBpmnContextMenu from '../bpmn/getBpmnContextMenu';

import { getBpmnEditMenu } from '../bpmn/getBpmnEditMenu';

import getBpmnWindowMenu from '../bpmn/getBpmnWindowMenu';

import * as css from './BpmnEditor.less';

import { svgToImage } from '@bpmn-io/svg-to-image';

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

import {
  applyName,
  applyTimer,
  applyMessage,
  applySignal,
  applyUserTaskForm,
  applyCalledElement
} from './applyConfig';

const EXPORT_AS = [ 'png', 'jpeg', 'svg' ];

export const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.CLOUD
};

const LOW_PRIORITY = 500;


export class BpmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {
      isCanvasEmpty: true,
      aiPanelOpen: false,
      appendWizardSource: null
    };

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

    // Subscribe to the guided-append context-pad entry so the "+" tile
    // opens the React-side AppendWizard.
    const guidedAppend = modeler.get('guidedAppend', false);
    if (guidedAppend) {
      this._unsubscribeGuidedAppend = guidedAppend.on('open', (element) => {
        this.setState({ appendWizardSource: element });
      });
    }

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

    if (this._unsubscribeGuidedAppend) {
      this._unsubscribeGuidedAppend();
      this._unsubscribeGuidedAppend = null;
    }
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

    modeler[fn]('import.done', this.checkCanvasEmpty);
    modeler[fn]('commandStack.changed', this.checkCanvasEmpty);

    modeler[fn]('propertiesPanel.showEntry', this.handleShowEntry);

    modeler[fn]('elementTemplates.errors', this.handleElementTemplateErrors);

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);

    modeler[fn]('propertiesPanel.layoutChanged', this.handlePropertiesPanelLayoutChange);

    // Guided start: auto-open the properties panel only when the user
    // selects a concrete element. Fresh files land with the panel closed
    // (see handleImport) so newcomers aren't greeted with a dense form.
    modeler[fn]('selection.changed', this.handleSelectionAutoOpenPanel);

    if (fn === 'on') {
      modeler[ fn ]('commandStack.changed', LOW_PRIORITY, this.handleLintingDebounced);
    } else if (fn === 'off') {
      modeler[ fn ]('commandStack.changed', this.handleLintingDebounced);
    }
  }

  checkCanvasEmpty = () => {
    const modeler = this.getModeler();
    const elementRegistry = modeler.get('elementRegistry');
    const isCanvasEmpty = elementRegistry.getAll().length <= 1;
    this.setState({ isCanvasEmpty });
  };

  handleStartEventSelect = (eventTypeId, config = {}) => {
    const modeler = this.getModeler();
    const modeling = modeler.get('modeling');
    const elementFactory = modeler.get('elementFactory');
    const canvas = modeler.get('canvas');
    const elementTemplates = modeler.get('elementTemplates', false);

    const rootElement = canvas.getRootElement();
    const viewbox = canvas.viewbox();
    const position = {
      x: Math.round(viewbox.x + viewbox.width / 2),
      y: Math.round(viewbox.y + viewbox.height / 2)
    };

    // If the wizard selected a specific connector template, use it directly
    if (config.template && elementTemplates) {
      const shape = elementTemplates.createElement(config.template);
      const placedTemplateShape = modeling.createShape(shape, position, rootElement);

      // Still apply process name / version tag from the NameTagStep
      this._applyStartEventConfig(placedTemplateShape, eventTypeId, config);

      const { layout } = this.props;
      const sidePanelLayout = (layout && layout.sidePanel) || SIDE_PANEL_DEFAULT_LAYOUT;
      this.handleLayoutChange({
        sidePanel: { ...SIDE_PANEL_DEFAULT_LAYOUT, ...sidePanelLayout, open: true, tab: 'properties' }
      });
      return;
    }

    const EVENT_DEFINITION_MAP = {
      timer: 'bpmn:TimerEventDefinition',
      message: 'bpmn:MessageEventDefinition',
      webhook: 'bpmn:MessageEventDefinition',
      signal: 'bpmn:SignalEventDefinition'
    };

    const eventDefinitionType = EVENT_DEFINITION_MAP[eventTypeId];
    const shapeAttrs = { type: 'bpmn:StartEvent' };

    if (eventDefinitionType) {
      shapeAttrs.eventDefinitionType = eventDefinitionType;
    }

    const shapeElement = elementFactory.createShape(shapeAttrs);
    const placedShape = modeling.createShape(shapeElement, position, rootElement);

    // Apply wizard config to the placed element
    this._applyStartEventConfig(placedShape, eventTypeId, config);

    // Auto-open properties panel so the user can configure the element immediately
    const { layout } = this.props;
    const sidePanelLayout = (layout && layout.sidePanel) || SIDE_PANEL_DEFAULT_LAYOUT;
    this.handleLayoutChange({
      sidePanel: {
        ...SIDE_PANEL_DEFAULT_LAYOUT,
        ...sidePanelLayout,
        open: true,
        tab: 'properties'
      }
    });
  };

  _applyStartEventConfig = (shape, eventTypeId, config) => {
    if (!config || !Object.keys(config).length) return;

    const modeler = this.getModeler();

    // Timer / Message / Signal / Name are applied via shared helpers so the
    // start-event and append flows can't drift. The Webhook / template path
    // is already applied upstream in handleStartEventSelect.
    applyTimer(modeler, shape, config);
    applyMessage(modeler, shape, config);
    applySignal(modeler, shape, config);
    applyName(modeler, shape, config);
  };

  handleAppendWizardClose = () => {
    this.setState({ appendWizardSource: null });
  };

  /**
   * Called by AppendWizard when the user confirms a leaf + its config.
   * Creates the shape, appends it via autoPlace (so a sequence flow is
   * drawn from the source), then applies config via shared helpers.
   */
  handleAppend = (elementId, config = {}) => {
    const source = this.state.appendWizardSource;
    this.setState({ appendWizardSource: null });
    if (!source) return;

    const modeler = this.getModeler();
    const autoPlace = modeler.get('autoPlace');
    const elementFactory = modeler.get('elementFactory');
    const elementTemplates = modeler.get('elementTemplates', false);
    const selection = modeler.get('selection');

    const shapeAttrs = this._buildAppendShapeAttrs(elementId, config);
    if (!shapeAttrs) return;

    // AI Agent sub-process: if an AI Agent element template is loaded, apply
    // it to get a pre-configured agent. Falls back to a plain expanded
    // ad-hoc sub-process otherwise.
    let appliedTemplate = config.template;
    if (!appliedTemplate && elementId === 'ai-agent-subprocess' && elementTemplates) {
      appliedTemplate = this._findAiAgentAdHocTemplate(elementTemplates);
    }

    let placedShape;

    // Template-driven placement (connector / ai-connector / ai-agent-subprocess)
    if (appliedTemplate && elementTemplates) {
      const templatedShape = elementTemplates.createElement(appliedTemplate);

      // When the template produced an ad-hoc sub-process (the expected case
      // for Camunda's agentic AI connector), ensure it renders expanded at
      // a sensible size. Templates don't always carry DI sizing / isExpanded.
      if (elementId === 'ai-agent-subprocess'
          && templatedShape.type === 'bpmn:AdHocSubProcess') {
        templatedShape.isExpanded = true;
        templatedShape.width = shapeAttrs.width;
        templatedShape.height = shapeAttrs.height;
      }

      placedShape = autoPlace.append(source, templatedShape);
    } else {
      const newShape = elementFactory.createShape(shapeAttrs);
      placedShape = autoPlace.append(source, newShape);
    }

    this._applyAppendConfig(placedShape, elementId, config);

    // Select the placed shape and open properties panel
    selection.select(placedShape);
    const { layout } = this.props;
    const sidePanelLayout = (layout && layout.sidePanel) || SIDE_PANEL_DEFAULT_LAYOUT;
    this.handleLayoutChange({
      sidePanel: {
        ...SIDE_PANEL_DEFAULT_LAYOUT,
        ...sidePanelLayout,
        open: true,
        tab: 'properties'
      }
    });
  };

  /**
   * Translate the catalog leaf's elementId (plus wizard-specific config like
   * the intermediate-event trigger type) into bpmn element shape attrs.
   */
  _buildAppendShapeAttrs = (elementId, config) => {
    const base = ELEMENT_SHAPE_MAP[elementId];
    if (!base) return null;

    // Intermediate event: pick a catch event with the chosen trigger
    if (elementId === 'intermediate-event') {
      const trigger = config && config._trigger;
      const TRIGGER_MAP = {
        timer:   'bpmn:TimerEventDefinition',
        message: 'bpmn:MessageEventDefinition',
        signal:  'bpmn:SignalEventDefinition'
      };
      const eventDefinitionType = trigger && TRIGGER_MAP[trigger];
      return {
        type: eventDefinitionType ? 'bpmn:IntermediateCatchEvent' : 'bpmn:IntermediateThrowEvent',
        ...(eventDefinitionType ? { eventDefinitionType } : {})
      };
    }

    return { ...base };
  };

  _applyAppendConfig = (shape, elementId, config) => {
    if (!config || !Object.keys(config).length) return;

    const modeler = this.getModeler();

    // Name first so the shape is labelled even on early-return config types
    applyName(modeler, shape, config);

    // Per-type helpers — each is a no-op when its config key is absent
    applyTimer(modeler, shape, config);
    applyMessage(modeler, shape, config);
    applySignal(modeler, shape, config);

    if (elementId === 'user-task') {
      applyUserTaskForm(modeler, shape, config);
    }
    if (elementId === 'call-activity') {
      applyCalledElement(modeler, shape, config);
    }

    // Template is already applied by elementTemplates.createElement upstream
  };

  /**
   * Find Camunda's "AI Agent Sub-process" element template.
   *
   * Match is by name/id rather than `appliesTo` because the agentic AI
   * connector template's `appliesTo` has shifted between versions (sometimes
   * `bpmn:AdHocSubProcess`, sometimes `bpmn:Task` + an `elementType` override).
   * The name pairing "ai agent" + "sub-process/subprocess" is stable and
   * distinctive enough to target just the sub-process variant without also
   * matching the plain "AI Agent" task template.
   *
   * Returns the template object for `elementTemplates.createElement`, or null.
   */
  _findAiAgentAdHocTemplate = (elementTemplates) => {
    const all = elementTemplates.getLatest();
    if (!all || !all.length) return null;
    const match = all.find(t => {
      const name = (t.name || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      const mentionsSubprocess =
        name.includes('sub-process') || name.includes('subprocess') || name.includes('sub process') ||
        id.includes('adhoc') || id.includes('subprocess');
      const mentionsAgent = name.includes('agent') || id.includes('agent');
      return mentionsAgent && mentionsSubprocess;
    });
    return match || null;
  };

  openAiPanel = () => {
    const { layout } = this.props;
    const sidePanelLayout = (layout && layout.sidePanel) || SIDE_PANEL_DEFAULT_LAYOUT;
    this.handleLayoutChange({
      sidePanel: {
        ...SIDE_PANEL_DEFAULT_LAYOUT,
        ...sidePanelLayout,
        open: false
      }
    });
    this.setState({ aiPanelOpen: true });
  };

  /**
   * Open the properties panel (on the Properties tab) when the user selects
   * a single concrete element. Fresh files stay clean — the panel only
   * appears once the user has something to configure.
   */
  handleSelectionAutoOpenPanel = (event) => {
    const newSelection = (event && event.newSelection) || [];
    if (newSelection.length !== 1) return;

    const element = newSelection[0];
    const type = element && element.type;

    // Skip root-ish shapes (process/collaboration) and plain labels.
    if (!type || type === 'label') return;
    if (type === 'bpmn:Process' || type === 'bpmn:Collaboration') return;

    const { layout } = this.props;
    const sidePanelLayout = (layout && layout.sidePanel) || SIDE_PANEL_DEFAULT_LAYOUT;

    // Already open on the properties tab — don't fight the user's layout.
    if (sidePanelLayout.open && sidePanelLayout.tab === 'properties') return;

    this.handleLayoutChange({
      sidePanel: {
        ...SIDE_PANEL_DEFAULT_LAYOUT,
        ...sidePanelLayout,
        open: true,
        tab: 'properties'
      }
    });
  };

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
        this.handleLinting(engineProfile);
      } catch (err) {
        error = err;
      }
    }

    this.setState({
      importing: false
    });

    // Guided start: land on a clean canvas with the properties panel closed.
    // It will re-open automatically when the user selects an element (see
    // handleSelectionAutoOpenPanel) or places one via the guided wizards.
    if (!error) {
      const { layout } = this.props;
      const sidePanelLayout = (layout && layout.sidePanel) || SIDE_PANEL_DEFAULT_LAYOUT;
      this.handleLayoutChange({
        sidePanel: {
          ...SIDE_PANEL_DEFAULT_LAYOUT,
          ...sidePanelLayout,
          open: false
        }
      });
    }

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
      copyAsImage: !!selectionLength,
      cut: !!selectionLength,
      duplicate: canvasFocused && !!selectionLength,
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
      platform: 'cloud',
      propertiesPanel: true,
      variablesPanel: true,
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

  triggerAction = (action, context = {}) => {
    const {
      layout = {}
    } = this.props;

    const modeler = this.getModeler();

    if (action === 'resize') {
      return this.handleResize();
    }

    if (action === 'toggleGrid') {
      return this.gridBehavior.toggleGrid(layout, this.handleLayoutChange);
    }

    if (action === 'toggleProperties') {
      let { sidePanel: sidePanelLayout = SIDE_PANEL_DEFAULT_LAYOUT } = layout;

      sidePanelLayout = { ...SIDE_PANEL_DEFAULT_LAYOUT, ...sidePanelLayout };

      const newLayout = {
        sidePanel: {
          ...sidePanelLayout,
          open: sidePanelLayout.tab === 'properties' ? !sidePanelLayout.open : true,
          tab: 'properties'
        }
      };

      return this.handleLayoutChange(newLayout);
    }

    if (action === 'toggleVariables') {
      let { variablesSidePanel: variablesSidePanelLayout = VARIABLES_PANEL_DEFAULT_LAYOUT } = layout;

      variablesSidePanelLayout = { ...VARIABLES_PANEL_DEFAULT_LAYOUT, ...variablesSidePanelLayout };

      const newLayout = {
        variablesSidePanel: {
          ...VARIABLES_PANEL_DEFAULT_LAYOUT,
          ...variablesSidePanelLayout,
          open: !variablesSidePanelLayout.open
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

  handleShowEntry = (event) => {
    const { layout = {} } = this.props;

    let { sidePanel: sidePanelLayout = SIDE_PANEL_DEFAULT_LAYOUT } = layout;

    sidePanelLayout = { ...SIDE_PANEL_DEFAULT_LAYOUT, ...sidePanelLayout };

    if (sidePanelLayout.tab === 'properties' && sidePanelLayout.open) {
      return;
    }

    this.handleLayoutChange({
      sidePanel: {
        ...sidePanelLayout,
        open: true,
        tab: 'properties'
      }
    });
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

    const {
      config,
      deployment,
      file,
      id,
      layout,
      onAction,
      startInstance,
      zeebeApi
    } = this.props;

    const modeler = this.getModeler();
    const imported = modeler.getDefinitions();
    const injector = modeler.get('injector');

    const {
      importing,
      isCanvasEmpty,
      aiPanelOpen,
      appendWizardSource
    } = this.state;

    // Collect all start event connector templates available in this modeler instance
    const elementTemplates = modeler.get('elementTemplates', false);
    const startEventTemplates = elementTemplates
      ? elementTemplates.getLatest().filter(t =>
        t.appliesTo && t.appliesTo.some(a => a === 'bpmn:StartEvent')
      )
      : [];

    // Filter templates for the guided-append ServiceTask / AI-connector wizards
    const allTemplates = elementTemplates ? elementTemplates.getLatest() : [];
    const serviceTaskTemplates = allTemplates.filter(t =>
      t.appliesTo && t.appliesTo.some(a => a === 'bpmn:Task' || a === 'bpmn:ServiceTask')
    );
    const aiConnectorTemplates = serviceTaskTemplates.filter(t => {
      const name = (t.name || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      return name.includes('ai') || name.includes('llm') || name.includes('agent') ||
             id.includes('ai') || id.includes('llm') || id.includes('agent');
    });

    return (
      <div className={ css.BpmnEditor }>

        <Loader hidden={ imported && !importing } />

        <div className="editor">
          <div className="diagram-area">
            <div
              className="diagram"
              ref={ this.ref }
              onFocus={ this.handleChanged }
              onContextMenu={ this.handleContextMenu }
            ></div>

            { imported && !importing && isCanvasEmpty && (
              <EmptyCanvasOverlay
                onStartEventSelect={ this.handleStartEventSelect }
                onOpenAiPanel={ this.openAiPanel }
                startEventTemplates={ startEventTemplates }
              />
            ) }

            { appendWizardSource && (
              <AppendWizard
                onConfirm={ this.handleAppend }
                onClose={ this.handleAppendWizardClose }
                serviceTaskTemplates={ serviceTaskTemplates }
                aiConnectorTemplates={ aiConnectorTemplates }
              />
            ) }
          </div>

          <VariablesSidePanel
            injector={ injector }
            layout={ layout }
            onAction={ onAction }
            onLayoutChanged={ this.handleLayoutChange }
          />

          <VariablesTabActionItem
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          />

          <SidePanel
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          >
            <SidePanel.Header>
              <SidePanelTitleBar
                title="Details"
                onClose={ () => this.handleLayoutChange({
                  sidePanel: {
                    ...SIDE_PANEL_DEFAULT_LAYOUT,
                    ...layout.sidePanel,
                    open: false
                  }
                }) }
              />
            </SidePanel.Header>
            <SidePanel.Header>
              <SidePanelHeader injector={ injector } />
            </SidePanel.Header>
            <SidePanel.Tab id="properties" label="Properties" icon={ Settings }>
              <PropertiesTab propertiesPanelRef={ this.propertiesPanelRef } />
            </SidePanel.Tab>
            <SidePanel.Tab id="test" label="Test" icon={ TaskTestingIcon }>
              <TaskTestingTab
                config={ config }
                deployment={ deployment }
                file={ file }
                id={ id }
                injector={ injector }
                layout={ layout }
                onAction={ onAction }
                startInstance={ startInstance }
                zeebeApi={ zeebeApi }
              />
            </SidePanel.Tab>
          </SidePanel>

          { aiPanelOpen && (
            <AiPanel onClose={ () => this.setState({ aiPanelOpen: false }) } />
          ) }

          <PropertiesPanelTabActionItem
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          />
          <TaskTestingTabActionItem
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          />
        </div>

        { engineProfile && <EngineProfile
          type="bpmn"
          engineProfile={ engineProfile }
          onChange={ (engineProfile) => this.engineProfile.set(engineProfile) } />
        }
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
