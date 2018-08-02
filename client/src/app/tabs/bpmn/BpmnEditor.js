import React from 'react';

import { Fill } from '../../slot-fill';

import { Button } from '../../primitives';

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

    this.setState({
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      align: selection.get().length > 1
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

  handleTriggerEditorAction = (event, context) => {
    const {
      modeler
    } = this.getCached();

    modeler.get('editorActions').trigger(context.editorAction);
  }

  saveDiagram = () => {
    const {
      modeler
    } = this.getCached();

    modeler.saveXML((err, result) => {
      console.log(result);
    });
  }

  handleSetColor = (event, context) => {
    const {
      modeler
    } = this.getCached();

    const selection = modeler.get('selection').get();

    if (!selection.length) {
      return;
    }

    modeler.get('modeling').setColor(selection, context);
  }

  render() {
    return (
      <div className={ css.BpmnEditor }>

        <Fill name="buttons">
          <Button disabled={ !this.state.undo } onClick={ this.undo }>Undo</Button>
          <Button disabled={ !this.state.redo } onClick={ this.redo }>Redo</Button>
          <Button disabled={ !this.state.align } onClick={ () => this.align('left') }>Align Left</Button>
          <Button onClick={ this.saveDiagram }>Save Diagram</Button>
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