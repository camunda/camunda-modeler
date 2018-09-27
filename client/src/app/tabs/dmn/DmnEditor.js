import React from 'react';

import { Fill } from '../../slot-fill';

import {
  DropdownButton,
  Icon
} from '../../primitives';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import PropertiesContainer from '../PropertiesContainer';

import CamundaDmnModeler from './DmnModeler';

import { active as isInputActive } from '../../../util/dom/is-input';

import {
  getDmnDrdEditMenu,
  getDmnDecisionTableEditMenu,
  getDmnLiteralExpressionEditMenu
} from './getDmnEditMenu';

import css from './DmnEditor.less';

import generateImage from '../../util/generateImage';


export class DmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = { };

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();
  }

  componentDidMount() {
    const {
      modeler
    } = this.getCached();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const activeViewer = modeler.getActiveViewer();

    // if cached modeler event must be fired manually
    if (activeViewer) {
      activeViewer.get('propertiesPanel').attachTo(this.propertiesPanelRef.current);
    }

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

    [
      'saveXML.done',
      'attach',
      // TODO(philippfromme): fix, this will result in endless update loop
      // 'view.selectionChanged',
      'view.directEditingChanged'
    ].forEach((event) => {
      modeler[fn](event, this.handleChanged);
    });

    modeler[fn]('views.changed', this.viewsChanged);

    modeler[fn]('view.contentChanged', this.viewContentChanged);

    modeler[fn]('error', this.handleError);
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
    this.handleChanged();

    this.props.onChanged(this.checkDirty());
  }

  handleImported = (error, warnings) => {

    const {
      modeler
    } = this.getCached();

    const {
      activeSheet
    } = this.props;

    if (error) {
      return this.handleError({ error });
    }

    if (warnings.length) {
      console.error('imported with warnings', warnings);
    }

    if (activeSheet && activeSheet.element) {
      return this.open(activeSheet.element);
    }

    const initialView = modeler._getInitialView(modeler._views);

    this.open(initialView.element);
  }

  viewsChanged = ({ activeView, views }) => {

    const {
      onSheetsChanged
    } = this.props;

    const {
      modeler
    } = this.getCached();

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

    const activeViewer = modeler.getActiveViewer();

    // if cached modeler event must be fired manually
    if (activeViewer) {
      activeViewer.get('propertiesPanel').attachTo(this.propertiesPanelRef.current);
    }

    // needs to be called last
    this.setCached({
      activeView,
      views
    });

    this.handleChanged();
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

  handleChanged = (event) => {
    const {
      modeler
    } = this.getCached();

    const {
      onChanged
    } = this.props;

    const activeViewer = modeler.getActiveViewer(),
          activeView = modeler.getActiveView();

    if (!activeViewer) {
      return;
    }

    const commandStack = activeViewer.get('commandStack');

    const inputActive = isInputActive();

    const editMenuState = {
      redo: commandStack.canRedo(),
      undo: commandStack.canUndo()
    };

    const selection = activeViewer.get('selection');

    const selectionLength = selection.get().length;

    let editMenu;

    if (activeView.type === 'drd') {
      editMenu = getDmnDrdEditMenu({
        ...editMenuState,
        editLabel: !inputActive && !!selectionLength,
        lassoTool: !inputActive,
        moveCanvas: !inputActive,
        moveSelection: !inputActive && !!selectionLength,
        removeSelected: !inputActive && !!selectionLength
      });
    } else if (activeView.type === 'decisionTable') {
      editMenu = getDmnDecisionTableEditMenu({
        ...editMenuState,
        hasSelection: activeViewer.get('selection').hasSelection()
      });
    } else if (activeView.type === 'literalExpression') {
      editMenu = getDmnLiteralExpressionEditMenu({
        ...editMenuState
      });
    }

    const newState = {
      canExport: 'saveSVG' in activeViewer ? [ 'svg', 'png' ] : false,
      redo: commandStack.canRedo(),
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

  handleError = (event) => {
    const {
      error
    } = event;

    const {
      onError
    } = this.props;

    onError(error);
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

      modeler.importXML(xml, { open: false }, this.handleImported);
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

    const viewer = modeler.getActiveViewer();

    return new Promise((resolve, reject) => {

      viewer.saveSVG((err, svg) => {
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

  render() {
    const {
      layout,
      onLayoutChanged
    } = this.props;

    const {
      modeler
    } = this.getCached();

    const activeView = modeler.getActiveView();

    const hideIfCollapsed = activeView && activeView.type !== 'drd';

    return (
      <div className={ css.DmnEditor }>

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

        <div className="diagram" ref={ this.ref }></div>

        <PropertiesContainer
          className="properties"
          layout={ layout }
          ref={ this.propertiesPanelRef }
          hideIfCollapsed={ hideIfCollapsed }
          onLayoutChanged={ onLayoutChanged } />

      </div>
    );
  }

  static createCachedState() {
    const modeler = new CamundaDmnModeler();

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