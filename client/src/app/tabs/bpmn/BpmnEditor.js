/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Component } from 'react';

import { isFunction } from 'min-dash';

import { Fill } from '../../slot-fill';

import {
  Button,
  DropdownButton,
  Icon,
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

import PropertiesContainer from '../PropertiesContainer';

import CamundaBpmnModeler from './modeler';

import { active as isInputActive } from '../../../util/dom/isInput';

import getBpmnContextMenu from './getBpmnContextMenu';

import { getBpmnEditMenu } from './getBpmnEditMenu';

import getBpmnWindowMenu from './getBpmnWindowMenu';

import css from './BpmnEditor.less';

import generateImage from '../../util/generateImage';

import applyDefaultTemplates from './modeler/features/apply-default-templates/applyDefaultTemplates';

import {
  findUsages as findNamespaceUsages,
  replaceUsages as replaceNamespaceUsages
} from '../util/namespace';

import configureModeler from './util/configure';

import Metadata from '../../../util/Metadata';


const NAMESPACE_URL_ACTIVITI = 'http://activiti.org/bpmn';

const NAMESPACE_CAMUNDA = {
  uri: 'http://camunda.org/schema/1.0/bpmn',
  prefix: 'camunda'
};

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


export class BpmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.handleResize = debounce(this.handleResize);
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

    if (layout.minimap) {
      minimap.toggle(layout.minimap && !!layout.minimap.open);
    }

    const propertiesPanel = modeler.get('propertiesPanel');

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

    modeler[fn]('elementTemplates.errors', this.handleElementTemplateErrors);

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);
  }

  async loadTemplates() {
    const { getConfig } = this.props;

    const modeler = this.getModeler();

    const templatesLoader = modeler.get('elementTemplatesLoader');

    const templates = await getConfig('bpmn.elementTemplates');

    templatesLoader.setTemplates(templates);

    const propertiesPanel = modeler.get('propertiesPanel', false);

    if (propertiesPanel) {
      const currentElement = propertiesPanel._current && propertiesPanel._current.element;

      if (currentElement) {
        propertiesPanel.update(currentElement);
      }
    }
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

  handleElementTemplateErrors = (event) => {
    const {
      errors
    } = event;

    errors.forEach(error => {
      this.handleError({ error });
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

  handleNamespace = async (xml) => {
    const used = findNamespaceUsages(xml, NAMESPACE_URL_ACTIVITI);

    if (!used) {
      return xml;
    }

    const shouldConvert = await this.shouldConvert();

    if (!shouldConvert) {
      return xml;
    }

    const {
      onContentUpdated
    } = this.props;

    const convertedXML = await replaceNamespaceUsages(xml, used, NAMESPACE_CAMUNDA);

    onContentUpdated(convertedXML);

    return convertedXML;
  }

  async shouldConvert() {
    const { button } = await this.props.onAction('show-dialog', getNamespaceDialog());

    return button === 'yes';
  }

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

    if (!error) {

      if (isNew && !defaultTemplatesApplied) {
        modeler.invoke(applyDefaultTemplates);

        defaultTemplatesApplied = true;
      }

      this.setCached({
        defaultTemplatesApplied,
        lastXML: xml,
        stackIdx
      });

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

    this.importXML();
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

  async importXML() {
    const {
      xml
    } = this.props;

    this.setState({
      importing: true
    });

    const modeler = this.getModeler();

    const importedXML = await this.handleNamespace(xml);


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

  /**
   * @returns {CamundaBpmnModeler}
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
    const svg = await this.exportSVG();

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
    const { propertiesPanel: propertiesPanelLayout } = this.props.layout;
    const modeler = this.getModeler();

    if (action === 'resize') {
      return this.handleResize();
    }

    if (action === 'toggleProperties') {
      const newLayout = {
        propertiesPanel: {
          ...propertiesPanelLayout,
          open: !propertiesPanelLayout.open
        }
      };

      return this.handleLayoutChange(newLayout);
    }

    if (action === 'resetProperties') {
      const newLayout = {
        propertiesPanel: {
          width: 250,
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

    if (action === 'elementTemplates.reload') {
      return this.loadTemplates();
    }

    // TODO(nikku): handle all editor actions
    modeler.get('editorActions').trigger(action, context);
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

  render() {

    const {
      layout,
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
      onError
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
    }, handleMiddlewareExtensions);

    if (warnings.length && isFunction(onError)) {
      onError(
        'Problem(s) configuring BPMN editor: \n\t' +
        warnings.map(error => error.message).join('\n\t') +
        '\n'
      );
    }

    const modeler = new CamundaBpmnModeler({
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
      lastXML: null,
      modeler,
      namespaceDialogShown: false,
      stackIdx,
      templatesLoaded: false
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

function getNamespaceDialog() {
  return {
    type: 'warning',
    title: 'Deprecated <activiti> namespace detected',
    buttons: [
      { id: 'cancel', label: 'Cancel' },
      { id: 'yes', label: 'Yes' }
    ],
    message: 'Would you like to convert your diagram to the <camunda> namespace?',
    detail: [
      'This will allow you to maintain execution related properties.',
      '',
      '<camunda> namespace support works from Camunda BPM versions 7.4.0, 7.3.3, 7.2.6 onwards.'
    ].join('\n')
  };
}

function isCacheStateChanged(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}
