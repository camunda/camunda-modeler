/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Component, Fragment } from 'react';

import {
  isFunction,
  isNil
} from 'min-dash';

import { Fill } from '../../slot-fill';

import {
  Loader
} from '../../primitives';

import {
  Button,
  DropdownButton,
  Icon
} from '../../../shared/ui';

import {
  debounce
} from '../../../util';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import PropertiesContainer from '../PropertiesContainer';

import BpmnModeler from './modeler';

import { active as isInputActive } from '../../../util/dom/isInput';

import getBpmnContextMenu from '../bpmn/getBpmnContextMenu';

import { getBpmnEditMenu } from '../bpmn/getBpmnEditMenu';

import getBpmnWindowMenu from '../bpmn/getBpmnWindowMenu';

import css from './BpmnEditor.less';

import generateImage from '../../util/generateImage';

import Metadata from '../../../util/Metadata';

import { DEFAULT_LAYOUT as propertiesPanelDefaultLayout } from '../PropertiesContainer';

import {
  EngineProfile,
  isKnownEngineProfile,
  getEngineProfileFromBpmn,
  engineProfilesEqual
} from '../EngineProfile';

import { Linting } from '../Linting';

import Panel from '../panel/Panel';

import LintingTab from '../panel/tabs/LintingTab';

import {
  ENGINES
} from '../../../util/Engines';

const EXPORT_AS = [ 'png', 'jpeg', 'svg' ];

const COLORS = [{
  title: 'White',
  fill: 'white',
  stroke: 'black'
}, {
  title: 'Blue',
  fill: 'rgb(187, 222, 251)',
  stroke: 'rgb(30, 136, 229)'
}, {
  title: 'Orange',
  fill: 'rgb(255, 224, 178)',
  stroke: 'rgb(251, 140, 0)'
}, {
  title: 'Green',
  fill: 'rgb(200, 230, 201)',
  stroke: 'rgb(67, 160, 71)'
}, {
  title: 'Red',
  fill: 'rgb(255, 205, 210)',
  stroke: 'rgb(229, 57, 53)'
}, {
  title: 'Purple',
  fill: 'rgb(225, 190, 231)',
  stroke: 'rgb(142, 36, 170)'
}];

const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.CLOUD
};

const LOW_PRIORITY = 500;


export class BpmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.handleResize = debounce(this.handleResize);

    this.handleLintingDebounced = debounce(this.handleLinting.bind(this));
  }

  componentDidMount() {
    this._isMounted = true;

    const {
      layout
    } = this.props;

    const modeler = this.getModeler();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const minimap = modeler.get('minimap');

    if (layout.minimap) {
      minimap.toggle(layout.minimap && !!layout.minimap.open);
    }

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.attachTo(this.propertiesPanelRef.current);

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
  }

  listen(fn) {
    const modeler = this.getModeler();

    [
      'import.done',
      'saveXML.done',
      'commandStack.changed',
      'selection.changed',
      'attach',
      'elements.copied',
      'propertiesPanel.focusin',
      'propertiesPanel.focusout',
      'directEditing.activate',
      'directEditing.deactivate',
      'searchPad.closed',
      'searchPad.opened'
    ].forEach((event) => {
      modeler[fn](event, this.handleChanged);
    });

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);

    modeler[ fn ]('commandStack.changed', LOW_PRIORITY, this.handleLintingDebounced);
  }

  undo = () => {
    const modeler = this.getModeler();

    modeler.get('commandStack').undo();
  }

  redo = () => {
    const modeler = this.getModeler();

    modeler.get('commandStack').redo();
  }

  handleAlignElements = (type) => {
    this.triggerAction('alignElements', {
      type
    });
  }

  handleMinimapToggle = (event) => {
    this.handleLayoutChange({
      minimap: {
        open: event.open
      }
    });
  }

  handleError = (event) => {
    const {
      error
    } = event;

    const {
      onError
    } = this.props;

    onError(error);
  }

  handleImport = (error, warnings) => {
    const {
      onImport,
      xml
    } = this.props;

    const modeler = this.getModeler();

    const commandStack = modeler.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    if (error) {
      this.setCached({
        engineProfile: null,
        lastXML: null
      });
    } else {
      const engineProfile = this.getEngineProfile();

      if (isNil(engineProfile)) {
        this.setCached({
          engineProfile,
          lastXML: xml,
          stackIdx
        });
      } else if (isKnownEngineProfile(engineProfile)) {
        this.setCached({
          engineProfile,
          lastXML: xml,
          stackIdx
        });

        this.handleLinting();
      } else {
        error = new Error(getUnknownEngineProfileErrorMessage(engineProfile));

        this.setCached({
          engineProfile: null,
          lastXML: null
        });
      }

      this.setState({
        importing: false
      });
    }

    onImport(error, warnings);
  }

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

    const newState = {
      align: selectionLength > 1,
      close: true,
      copy: !!selectionLength,
      cut: false,
      defaultCopyCutPaste: inputActive,
      defaultUndoRedo: inputActive,
      dirty,
      distribute: selectionLength > 2,
      editLabel: !inputActive && !!selectionLength,
      exportAs: EXPORT_AS,
      find: !inputActive,
      globalConnectTool: !inputActive,
      handTool: !inputActive,
      inputActive,
      lassoTool: !inputActive,
      moveCanvas: !inputActive,
      moveToOrigin: !inputActive,
      moveSelection: !inputActive && !!selectionLength,
      paste: !modeler.get('clipboard').isEmpty(),
      propertiesPanel: true,
      redo: commandStack.canRedo(),
      removeSelected: !!selectionLength || inputActive,
      save: true,
      selectAll: true,
      setColor: !!selectionLength,
      spaceTool: !inputActive,
      undo: commandStack.canUndo(),
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

    const engineProfile = this.getEngineProfile();

    const { engineProfile: cachedEngineProfile } = this.getCached();

    if (!engineProfilesEqual(engineProfile, cachedEngineProfile) && isKnownEngineProfile(engineProfile)) {
      this.setCached({
        engineProfile
      });
    }
  }

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
  }

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

    const stackIdx = commandStack._stackIdx;

    if (!this.isDirty()) {
      return lastXML || this.props.xml;
    }

    try {

      const { xml } = await modeler.saveXML({ format: true });

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

  triggerAction = (action, context) => {
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

    if (action === 'toggleProperties') {
      const newLayout = {
        propertiesPanel: {
          ...propertiesPanelDefaultLayout,
          ...propertiesPanelLayout,
          open: !propertiesPanelLayout.open
        }
      };

      return this.handleLayoutChange(newLayout);
    }

    if (action === 'resetProperties') {
      const newLayout = {
        propertiesPanel: {
          ...propertiesPanelDefaultLayout,
          open: true
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

    if (action === 'selectElement') {
      const { id } = context;

      const modeler = this.getModeler(),
            canvas = modeler.get('canvas'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const element = elementRegistry.get(id);

      if (element) {
        selection.select(element);

        canvas.scrollToElement(element);
      }

      return;
    }

    // TODO(nikku): handle all editor actions
    return modeler.get('editorActions').trigger(action, context);
  }

  handleSetColor = (fill, stroke) => {
    this.triggerAction('setColor', {
      fill,
      stroke
    });
  }

  handleDistributeElements = (type) => {
    this.triggerAction('distributeElements', {
      type
    });
  }

  handleContextMenu = (event) => {

    const {
      onContextMenu
    } = this.props;

    if (isFunction(onContextMenu)) {
      onContextMenu(event);
    }
  }

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
  }

  getEngineProfile = () => {
    const modeler = this.getModeler();

    const definitions = modeler.getDefinitions();

    return getEngineProfileFromBpmn(definitions, DEFAULT_ENGINE_PROFILE);
  }

  setEngineProfile = (engineProfile) => {
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

    this.setCached({ engineProfile });
  }

  render() {
    const { engineProfile } = this.getCached();

    const {
      layout,
      linting = [],
      onAction,
      onLayoutChanged
    } = this.props;

    const imported = this.getModeler().getDefinitions();

    const {
      importing
    } = this.state;

    return (
      <div className={ css.BpmnEditor }>

        <Loader hidden={ imported && !importing } />

        <Fill slot="toolbar" group="5_color">
          <DropdownButton
            title="Set element color"
            disabled={ !this.state.setColor }
            items={
              () => COLORS.map((color, index) => {
                const { fill, stroke, title } = color;

                return (
                  <Color
                    fill={ fill }
                    key={ index }
                    stroke={ stroke }
                    title={ title }
                    onClick={ () => this.handleSetColor(fill, stroke) } />
                );
              })
            }
          >
            <Icon name="set-color-tool" />
          </DropdownButton>
        </Fill>

        <Fill slot="toolbar" group="6_align">
          <Button
            title="Align elements left"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('left') }
          >
            <Icon name="align-left-tool" />
          </Button>
          <Button
            title="Align elements center"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('center') }
          >
            <Icon name="align-center-tool" />
          </Button>
          <Button
            title="Align elements right"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('right') }
          >
            <Icon name="align-right-tool" />
          </Button>
          <Button
            title="Align elements top"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('top') }>
            <Icon name="align-top-tool" />
          </Button>
          <Button
            title="Align elements middle"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('middle') }
          >
            <Icon name="align-middle-tool" />
          </Button>
          <Button
            title="Align elements bottom"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('bottom') }
          >
            <Icon name="align-bottom-tool" />
          </Button>
        </Fill>

        <Fill slot="toolbar" group="7_distribute">
          <Button
            title="Distribute elements horizontally"
            disabled={ !this.state.distribute }
            onClick={ () => this.handleDistributeElements('horizontal') }
          >
            <Icon name="distribute-horizontal-tool" />
          </Button>
          <Button
            title="Distribute elements vertically"
            disabled={ !this.state.distribute }
            onClick={ () => this.handleDistributeElements('vertical') }
          >
            <Icon name="distribute-vertical-tool" />
          </Button>
        </Fill>

        <div className="editor">
          <div
            className="diagram"
            ref={ this.ref }
            onFocus={ this.handleChanged }
            onContextMenu={ this.handleContextMenu }
          ></div>

          <PropertiesContainer
            className="properties"
            layout={ layout }
            ref={ this.propertiesPanelRef }
            onLayoutChanged={ onLayoutChanged } />
        </div>

        { engineProfile && <EngineProfile
          type="bpmn"
          engineProfile={ engineProfile }
          onChange={ this.setEngineProfile } />
        }

        {
          engineProfile && <Fragment>
            <Panel
              layout={ layout }>
              <LintingTab
                layout={ layout }
                linting={ linting }
                onAction={ onAction }
                onLayoutChanged={ onLayoutChanged } />
            </Panel>
            <Linting
              layout={ layout }
              linting={ linting }
              onLayoutChanged={ onLayoutChanged } />
          </Fragment>
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
      onAction,
    } = props;

    // TODO @pinussilvestrus: ignore plugins for now
    const options = {
      position: 'absolute',
      exporter: {
        name,
        version
      }
    };

    const modeler = new BpmnModeler({
      ...options,
      position: 'absolute'
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
      stackIdx
    };
  }

}


export default WithCache(WithCachedState(BpmnEditor));

class Color extends Component {
  render() {
    const {
      fill,
      onClick,
      stroke,
      title,
      ...rest
    } = this.props;

    return (
      <div
        className={ css.Color }
        onClick={ onClick }
        style={ {
          backgroundColor: fill,
          borderColor: stroke
        } }
        title={ title }
        { ...rest }></div>
    );
  }
}

// helpers //////////

function isCacheStateChanged(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}

function getUnknownEngineProfileErrorMessage(engineProfile = {}) {
  const {
    executionPlatform = '<no-execution-platform>',
    executionPlatformVersion = '<no-execution-platform-version>'
  } = engineProfile;

  return `An unknown execution platform (${ executionPlatform } ${ executionPlatformVersion }) was detected.`;
}
