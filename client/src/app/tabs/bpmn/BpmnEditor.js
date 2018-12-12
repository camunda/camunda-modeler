import React, { Component } from 'react';

import { Fill } from '../../slot-fill';

import {
  Button,
  DropdownButton,
  Icon,
  Loader
} from '../../primitives';

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

import {
  hasNamespaceUrl,
  replaceNamespace
} from './util/namespace';

const NAMESPACE_URL_ACTIVITI = 'http://activiti.org/bpmn',
      NAMESPACE_URL_CAMUNDA = 'http://camunda.org/schema/1.0/bpmn',
      NAMESPACE_PREFIX_ACTIVITI = 'activiti',
      NAMESPACE_PREFIX_CAMUNDA = 'camunda';

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

    this.resize();
  }

  componentWillUnmount() {
    this._isMounted = false;

    const modeler = this.getModeler();

    this.listen('off');

    modeler.detach();

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.detach();
  }

  componentDidUpdate() {
    if (!this.state.importing) {
      this.checkImport();
    }
  }

  ifMounted = (fn) => {
    return (...args) => {
      if (this._isMounted) {
        fn(...args);
      }
    };
  }

  listen(fn) {
    const modeler = this.getModeler();

    [
      'import.done',
      'saveXML.done',
      'commandStack.changed',
      'selection.changed',
      'attach',
      'elements.copied'
    ].forEach((event) => {
      modeler[fn](event, this.handleChanged);
    });

    modeler[fn]('elementTemplates.errors', this.handleElementTemplateErrors);

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);
  }

  async loadTemplates() {
    const modeler = this.getModeler();
    const templatesLoader = modeler.get('elementTemplatesLoader');

    const templates = await this.props.onLoadConfig('bpmn.elementTemplates');

    templatesLoader.setTemplates(templates);
  }

  undo = () => {
    const modeler = this.getModeler();

    modeler.get('commandStack').undo();
  }

  redo = () => {
    const modeler = this.getModeler();

    modeler.get('commandStack').redo();
  }

  align = (type) => {
    const modeler = this.getModeler();

    const selection = modeler.get('selection').get();

    modeler.get('alignElements').trigger(selection, type);
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
    const {
      onAction,
      onContentUpdated
    } = this.props;

    const answer = await onAction('show-dialog', getNamespaceDialog());

    if (answer === 'yes') {
      xml = await replaceNamespace(xml, {
        newNamespacePrefix: NAMESPACE_PREFIX_CAMUNDA,
        newNamespaceUrl: NAMESPACE_URL_CAMUNDA,
        oldNamespacePrefix: NAMESPACE_PREFIX_ACTIVITI,
        oldNamespaceUrl: NAMESPACE_URL_ACTIVITI
      });

      if (typeof onContentUpdated === 'function') {
        onContentUpdated(xml);
      }

    }

    return xml;
  }

  handleImport = (error, warnings) => {
    const {
      onImport,
      xml
    } = this.props;

    const modeler = this.getModeler();

    onImport(error, warnings);

    if (!error) {
      modeler.lastXML = xml;

      this.setState({
        importing: false
      });
    }
  }


  handleChanged = (event = {}) => {
    const modeler = this.getModeler();

    const {
      onChanged
    } = this.props;

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
      distribute: selectionLength > 2,
      editLabel: !inputActive && !!selectionLength,
      exportAs: [ 'svg', 'png' ],
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

    const contextMenu = getBpmnContextMenu(newState);

    const editMenu = getBpmnEditMenu(newState);

    const windowMenu = getBpmnWindowMenu(newState);

    if (typeof onChanged === 'function') {
      onChanged({
        ...newState,
        contextMenu,
        editMenu,
        windowMenu
      });
    }

    this.setState(newState);
  }

  async checkImport() {
    const {
      namespaceDialogShown
    } = this.getCached();

    const modeler = this.getModeler();

    let {
      xml
    } = this.props;

    if (xml !== modeler.lastXML) {
      this.setState({
        importing: true
      });

      const namespaceFound = await hasNamespaceUrl(xml, NAMESPACE_URL_ACTIVITI);

      if (!namespaceDialogShown && namespaceFound) {
        this.setCached({
          namespaceDialogShown: true
        });

        xml = await this.handleNamespace(xml);
      }

      // TODO(nikku): apply default element templates to initial diagram
      modeler.importXML(xml, this.ifMounted(this.handleImport));
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

  getXML() {
    const modeler = this.getModeler();

    return new Promise((resolve, reject) => {

      // TODO(nikku): set current modeler version and name to the diagram

      modeler.saveXML({ format: true }, (err, xml) => {
        modeler.lastXML = xml;

        if (err) {
          this.handleError({
            error: err
          });

          return reject(err);
        }

        return resolve(xml);
      });
    });
  }

  exportAs(type) {
    const modeler = this.getModeler();

    return new Promise((resolve, reject) => {

      modeler.saveSVG((err, svg) => {
        let contents;

        if (err) {
          this.handleError({
            error: err
          });

          return reject(err);
        }

        if (type !== 'svg') {
          try {
            contents = generateImage(type, svg);
          } catch (err) {
            this.handleError({
              error: err
            });

            return reject(err);
          }
        } else {
          contents = svg;
        }

        resolve(contents);
      });

    });
  }

  triggerAction = (action, context) => {
    const modeler = this.getModeler();

    if (action === 'resize') {
      return this.resize();
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

    if (typeof onContextMenu === 'function') {
      onContextMenu(event);
    }
  }

  handleLayoutChange(newLayout) {
    const {
      onLayoutChanged
    } = this.props;

    if (typeof onLayoutChanged === 'function') {
      onLayoutChanged(newLayout);
    }
  }

  resize = () => {
    const modeler = this.getModeler();

    const canvas = modeler.get('canvas');

    canvas.resized();
  }

  render() {

    const {
      layout,
      onLayoutChanged
    } = this.props;

    const {
      importing,
    } = this.state;

    return (
      <div className={ css.BpmnEditor }>

        <Loader hidden={ !importing } />

        <Fill name="toolbar" group="color">
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

        <Fill name="toolbar" group="align">
          <Button
            title="Align elements left"
            disabled={ !this.state.align }
            onClick={ () => this.align('left') }
          >
            <Icon name="align-left-tool" />
          </Button>
          <Button
            title="Align elements center"
            disabled={ !this.state.align }
            onClick={ () => this.align('center') }
          >
            <Icon name="align-center-tool" />
          </Button>
          <Button
            title="Align elements right"
            disabled={ !this.state.align }
            onClick={ () => this.align('right') }
          >
            <Icon name="align-right-tool" />
          </Button>
          <Button
            title="Align elements top"
            disabled={ !this.state.align }
            onClick={ () => this.align('top') }>
            <Icon name="align-top-tool" />
          </Button>
          <Button
            title="Align elements middle"
            disabled={ !this.state.align }
            onClick={ () => this.align('middle') }
          >
            <Icon name="align-middle-tool" />
          </Button>
          <Button
            title="Align elements bottom"
            disabled={ !this.state.align }
            onClick={ () => this.align('bottom') }
          >
            <Icon name="align-bottom-tool" />
          </Button>
        </Fill>

        <Fill name="toolbar" group="distribute">
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

        <Fill name="toolbar" group="deploy">
          <Button
            onClick={ this.props.onModal.bind(null, 'DEPLOY_DIAGRAM') }
            title="Deploy Current Diagram"
          >
            <Icon name="deploy" />
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

  static createCachedState() {

    // TODO(nikku): wire element template loading
    const modeler = new CamundaBpmnModeler({
      position: 'absolute'
    });

    return {
      modeler,
      __destroy: () => {
        modeler.destroy();
      }
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