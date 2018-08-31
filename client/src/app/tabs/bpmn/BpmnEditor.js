import React, { Component } from 'react';

import { Fill } from '../../slot-fill';

import {
  Button,
  DropdownButton
} from '../../primitives';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';

import 'bpmn-js-properties-panel/styles/properties.less';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

import css from './BpmnEditor.less';

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

  componentDidMount() {
    const {
      modeler
    } = this.getCached();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.attachTo(this.propertiesPanelRef.current);

    this.checkImport();
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
      modeler[fn](event, this.updateActions);
    });

    modeler[fn]('commandStack.changed', (e) => {
      const commandStack = modeler.get('commandStack');

      this.props.dirtyChanged(commandStack.canUndo());
    });
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

  updateActions = (event) => {
    const {
      modeler
    } = this.getCached();

    const commandStack = modeler.get('commandStack');
    const selection = modeler.get('selection');

    const selectionLength = selection.get().length;

    this.setState({
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      align: selectionLength > 1,
      setColor: selectionLength
    });
  }

  checkImport() {
    const {
      modeler
    } = this.getCached();

    const xml = this.props.xml;

    if (xml !== modeler.lastXML) {

      modeler.lastXML = xml;

      modeler.importXML(xml, function(err) {

      });
    }
  }

  getXML() {
    const {
      modeler
    } = this.getCached();

    return new Promise((resolve, reject) => {

      modeler.saveXML({ format: true }, (err, xml) => {
        modeler.lastXML = xml;

        if (err) {
          return reject(err);
        }

        return resolve(xml);
      });
    });
  }

  handleTriggerEditorAction = (editorAction, context) => {
    const {
      modeler
    } = this.getCached();

    modeler.get('editorActions').trigger(editorAction, context);
  }

  saveDiagram = () => {
    const {
      modeler
    } = this.getCached();

    modeler.saveXML((err, result) => {
      console.log(result);
    });
  }

  handleSetColor = (fill, stroke) => {
    this.handleTriggerEditorAction('setColor', {
      fill,
      stroke
    });
  }

  render() {
    return (
      <div className={ css.BpmnEditor }>

        <Fill name="toolbar" group="general">
          <Button onClick={ this.saveDiagram }>Save Diagram</Button>
        </Fill>

        <Fill name="toolbar" group="commandstack">
          <Button disabled={ !this.state.undo } onClick={ this.undo }>Undo</Button>
          <Button disabled={ !this.state.redo } onClick={ this.redo }>Redo</Button>
        </Fill>

        <Fill name="toolbar" group="image-export">
          <Button onClick={ () => console.log('Export Image') }>Export Image</Button>
        </Fill>

        <Fill name="toolbar" group="color">
          <DropdownButton
            disabled={ !this.state.setColor }
            text="Set Color">
            {
              COLORS.map((color, index) => {
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
          </DropdownButton>
        </Fill>

        <Fill name="toolbar" group="align">
          <Button disabled={ !this.state.align } onClick={ () => this.align('left') }>Align Left</Button>
        </Fill>

        <div className="diagram" ref={ this.ref }></div>

        <div className="properties">
          <div className="toggle">Properties Panel</div>
          <div className="resize-handle"></div>
          <div className="properties-container" ref={ this.propertiesPanelRef }></div>
        </div>
      </div>
    );
  }

  static createCachedState() {
    const modeler = new BpmnModeler({
      additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule
      ]
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