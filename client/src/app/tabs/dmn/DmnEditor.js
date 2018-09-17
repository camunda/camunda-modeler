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

import CamundaDmnModeler from './DmnModeler';

import { active as isInputActive } from '../../../util/dom/is-input';

import {
  getDmnDrdEditMenu,
  getDmnDecisionTableEditMenu,
  getDmnLiteralExpressionEditMenu
} from './getDmnEditMenu';

import css from './DmnEditor.less';

import generateImage from '../../util/generateImage';

import { merge } from 'min-dash';

import classNames from 'classnames';

import defaultLayout from '../defaultLayout';


class DmnEditor extends CachedComponent {

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

    // update properties panel parent in all configs
    [ 'drd', 'decisionTable', 'literalExpression' ].forEach(viewer => {

      modeler._options[ viewer ].propertiesPanel = {
        parent: this.propertiesPanelRef.current
      };

      // viewers only exist if cached modeler
      if (modeler._viewers[ viewer ]) {
        const config = modeler._viewers[ viewer ].get('config');

        config.propertiesPanel = {
          parent: this.propertiesPanelRef.current
        };
      }

    });

    // if cached modeler event must be fired manually
    if (modeler.getActiveViewer()) {
      modeler.getActiveViewer().get('eventBus').fire('attach');
    }

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

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);
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

  handleImported = (event) => {

    const {
      error,
      warnings
    } = event;

    const {
      modeler
    } = this.getCached();

    const {
      activeSheet
    } = this.props;

    if (error) {
      return this.handleError({ error });
    }

    if (warnings && warnings.length) {
      console.error('imported with warnings', warnings);
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

    let editMenu;

    if (activeView.type === 'drd') {
      editMenu = getDmnDrdEditMenu({
        ...editMenuState,
        editLabel: !inputActive && !!activeViewer.get('selection').get().length,
        lassoTool: !inputActive,
        removeSelected: false
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

  handleMinimapToggle = (event) => {
    this.handleLayoutChange({
      minimap: {
        open: event.open
      }
    });
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
      layout
    } = this.state;

    const propertiesPanel = layout.propertiesPanel || defaultLayout.propertiesPanel;

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

    const modeler = new CamundaDmnModeler({
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