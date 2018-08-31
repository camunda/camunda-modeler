import React from 'react';

import { Fill } from '../../slot-fill';

import { Button } from '../../primitives';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import DmnModeler from './DmnModeler';

import 'dmn-js/dist/assets/diagram-js.css';
import 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css';
import 'dmn-js/dist/assets/dmn-js-decision-table-controls.css';
import 'dmn-js/dist/assets/dmn-js-decision-table.css';
import 'dmn-js/dist/assets/dmn-js-drd.css';
import 'dmn-js/dist/assets/dmn-js-literal-expression.css';
import 'dmn-js/dist/assets/dmn-js-shared.css';

import css from './DmnEditor.less';


class DmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
  }

  componentDidMount() {
    const {
      modeler
    } = this.getCached();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    this.checkImport();
  }

  componentWillUnmount() {
    const {
      modeler
    } = this.getCached();

    this.listen('off');

    modeler.detach();
  }

  componentDidUpdate() {
    this.checkImport();
  }

  listen(fn) {
    const {
      modeler
    } = this.getCached();

    modeler[fn]('import.done', this.handleImported);

    [
      'saveXML.done',
      'attach'
    ].forEach((event) => {
      modeler[fn](event, this.updateActions);
    });

    modeler[fn]('views.changed', this.viewsChanged);

    modeler[fn]('view.contentChanged', this.viewContentChanged);
  }

  checkDirty = () => {
    const {
      modeler
    } = this.getCached();

    return modeler.getViews().reduce((dirty, view) => {
      const viewer = modeler._getViewer(view);

      const commandStack = viewer.get('commandStack', false);

      if (!commandStack) {
        return dirty;
      }

      return dirty || commandStack.canUndo();
    }, false);
  }

  viewContentChanged = () => {
    this.updateActions();

    this.props.dirtyChanged(this.checkDirty());
  }

  handleImported = (event) => {

    const {
      error,
      warmings
    } = event;

    const {
      modeler
    } = this.getCached();

    const {
      activeSheet
    } = this.props;

    if (error) {
      console.error('imported with error', error);

      return;
    }

    if (warmings.length) {
      console.error('imported with warnings', warmings);
    }

    const initialView = modeler._getInitialView(modeler._views);

    if (activeSheet && activeSheet.element) {
      this.open(activeSheet.element);
    } else {
      this.open(initialView.element);
    }
  }

  viewsChanged = ({ activeView, views }) => {

    const {
      setCachedState,
      onSheetsChanged
    } = this.props;

    let activeSheet;

    const sheets = views.map(view => {
      const { element } = view;

      const newSheet = {
        element,
        id: element.id,
        name: getSheetName(view),
        order: -1
      };

      if (view === activeView) {
        activeSheet = newSheet;
      }

      return newSheet;
    });

    onSheetsChanged(sheets, activeSheet);

    // needs to be called last
    setCachedState({
      activeView,
      views
    });

    this.updateActions();
  }

  undo = () => {
    const {
      modeler
    } = this.getCached();

    modeler.getActiveViewer().get('commandStack').undo();
  }

  redo = () => {
    const {
      modeler
    } = this.getCached();

    modeler.getActiveViewer().get('commandStack').redo();
  }

  updateActions = (event) => {
    const {
      modeler
    } = this.getCached();

    const activeViewer = modeler.getActiveViewer();

    if (!activeViewer) {
      return;
    }

    const commandStack = activeViewer.get('commandStack');

    this.setState({
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo()
    });
  }

  checkImport = () => {
    const {
      modeler
    } = this.getCached();

    const {
      activeSheet,
      xml
    } = this.props;

    if (xml !== modeler.lastXML) {
      modeler.lastXML = xml;

      window.modeler = modeler;

      modeler.importXML(xml, { open: false });
    } else {
      activeSheet
        && activeSheet.element
        && this.open(activeSheet.element);
    }
  }

  open = (element) => {
    const {
      activeView,
      modeler
    } = this.getCached();

    let view = modeler.getView(element);

    if (!view) {

      // try to find view based on ID
      // after re-import reference comparison won't work anymore
      view = modeler.getViews().find(view => view.element.id === element.id);
    }

    if (!view) {
      return;
    }

    if (!activeView
      || activeView.element !== element) {
      modeler.open(view);
    }
  }

  triggerAction = (action, options) => {
    const {
      modeler
    } = this.getCached();

    modeler.getActiveViewer()
      .get('editorActions')
      .trigger(action);
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

  render() {
    return (
      <div className={ css.DmnEditor }>

        <Fill name="toolbar">
          <Button disabled={ !this.state.undo } onClick={ this.undo }>Undo</Button>
          <Button disabled={ !this.state.redo } onClick={ this.redo }>Redo</Button>
        </Fill>

        <div className="diagram" ref={ this.ref }></div>
      </div>
    );
  }

  static createCachedState() {

    const modeler = new DmnModeler();

    return {
      modeler,
      __destroy: () => {
        modeler.destroy();
      }
    };
  }

}

export default WithCache(WithCachedState(DmnEditor));

// helpers //////////

const viewNames = {
  decisionTable: 'Decision Table',
  literalExpression: 'Literal Expression'
};

function getSheetName(view) {
  if (view.type === 'drd') {
    return 'Diagram';
  }

  return view.element.name || viewNames[view.type];
}