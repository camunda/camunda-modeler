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

import CamundaBpmnModeler from './modeler';

import { active as isInputActive } from '../../../util/dom/is-input';

import { getBpmnEditMenu } from './getBpmnEditMenu';

import css from './BpmnEditor.less';

import generateImage from '../../util/generateImage';

import classNames from 'classnames';

import { merge } from 'min-dash';

import defaultLayout from '../defaultLayout';

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

    const {
      layout
    } = this.props;

    this.state = {
      layout: merge({}, defaultLayout, layout)
    };

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();
  }

  componentDidMount() {
    const {
      modeler
    } = this.getCached();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.attachTo(this.propertiesPanelRef.current);

    this.checkImport();
    this.resize();
  }

  componentWillUnmount() {
    const {
      modeler
    } = this.getCached();

    this.listen('off');

    modeler.detach();

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.detach();
  }


  listen(fn) {
    const {
      modeler
    } = this.getCached();

    [
      'import.done',
      'saveXML.done',
      'commandStack.changed',
      'selection.changed',
      'attach'
    ].forEach((event) => {
      modeler[fn](event, this.updateState);
    });

    modeler[fn]('elementTemplates.errors', this.handleElementTemplateErrors);

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);
  }

  componentDidUpdate(previousProps) {
    this.checkImport();
  }

  undo = () => {
    const {
      modeler
    } = this.getCached();

    modeler.get('commandStack').undo();
  }

  redo = () => {
    const {
      modeler
    } = this.getCached();

    modeler.get('commandStack').redo();
  }

  align = (type) => {
    const {
      modeler
    } = this.getCached();

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

  updateState = (event) => {
    const {
      modeler
    } = this.getCached();

    const {
      onChanged
    } = this.props;

    const commandStack = modeler.get('commandStack');
    const selection = modeler.get('selection');
    const canPaste = !modeler.get('clipboard').isEmpty();

    const selectionLength = selection.get().length;

    const inputActive = isInputActive();

    const editMenu = getBpmnEditMenu({
      align: selectionLength > 1,
      canCopy: !!selectionLength,
      canPaste,
      canRedo: commandStack.canRedo(),
      canUndo: commandStack.canUndo(),
      distribute: selectionLength > 2,
      editLabel: !inputActive && !!selectionLength,
      find: !inputActive,
      globalConnectTool: !inputActive,
      handTool: !inputActive,
      lassoTool: !inputActive,
      moveToOrigin: !inputActive,
      moveSelection: !inputActive && !!selectionLength,
      spaceTool: !inputActive,
      moveCanvas: !inputActive,
      removeSelected: !!selectionLength
    });

    const newState = {
      align: selectionLength > 1,
      canExport: [ 'svg', 'png' ],
      distribute: selectionLength > 2,
      redo: commandStack.canRedo(),
      setColor: selectionLength,
      undo: commandStack.canUndo()
    };

    if (typeof onChanged === 'function') {
      onChanged({
        ...newState,
        editMenu
      });
    }

    this.setState(newState);
  }

  checkImport() {
    const {
      modeler
    } = this.getCached();

    const {
      xml
    } = this.props;

    if (xml !== modeler.lastXML) {

      modeler.lastXML = xml;

      this.setState({
        loading: true
      });

      // TODO(nikku): apply default element templates to initial diagram
      modeler.importXML(xml, (err) => {
        if (err) {
          return this.handleError({
            error: err
          });
        }

        this.setState({
          loading: false
        });
      });
    }
  }

  getXML() {
    const {
      modeler
    } = this.getCached();

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
    const {
      modeler
    } = this.getCached();

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
    const {
      modeler
    } = this.getCached();

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

  handlePropertiesPanelToggle = () => {
    const {
      layout
    } = this.state;

    this.handleLayoutChange({
      propertiesPanel: {
        open: !layout.propertiesPanel.open
      }
    });
  }

  handleLayoutChange(newLayout) {
    const {
      onLayoutChanged
    } = this.props;

    const {
      layout
    } = this.state;

    newLayout = merge(layout, newLayout);

    this.setState({
      layout: newLayout
    });

    onLayoutChanged(newLayout);
  }

  resize = () => {
    const {
      modeler
    } = this.getCached();

    const canvas = modeler.get('canvas');

    canvas.resized();
  }

  render() {
    const {
      layout,
      loading
    } = this.state;

    const propertiesPanel = layout.propertiesPanel || defaultLayout.propertiesPanel;

    return (
      <div className={ css.BpmnEditor }>

        <Loader hidden={ !loading } />

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
          <DropdownButton title="Deploy Current Diagram" items={ [{
            text: 'Deploy Current Diagram',
            onClick: () => console.log('Deploy Current Diagram')
          }, {
            text: 'Configure Deployment Endpoint',
            onClick: () => console.log('Configure Deployment Endpoint')
          }] }>
            <Icon name="deploy" />
          </DropdownButton>
        </Fill>

        <div
          className="diagram"
          ref={ this.ref }
          onFocus={ this.updateState }
          onContextMenu={ this.handleContextMenu }
        ></div>

        <div className={ classNames('properties', { 'open': propertiesPanel.open }) }>
          <div className="toggle" onClick={ this.handlePropertiesPanelToggle }>Properties Panel</div>
          <div className="resize-handle"></div>
          <div className="properties-container" ref={ this.propertiesPanelRef }></div>
        </div>
      </div>
    );
  }

  static createCachedState(props) {

    const {
      layout
    } = props;

    const minimap = layout.minimap || defaultLayout.minimap;

    // TODO(nikku): wire element template loading
    const modeler = new CamundaBpmnModeler({
      position: 'absolute',
      minimap: {
        open: minimap.open
      }
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