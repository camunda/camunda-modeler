import React, { Fragment } from 'react';

import { Fill } from '../../slot-fill';

import { Button } from '../../primitives';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import { EventListener } from '../../events';

import DmnModeler from './DmnModeler';

import 'dmn-js/dist/assets/diagram-js.css';
import 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css';
import 'dmn-js/dist/assets/dmn-js-decision-table-controls.css';
import 'dmn-js/dist/assets/dmn-js-decision-table.css';
import 'dmn-js/dist/assets/dmn-js-drd.css';
import 'dmn-js/dist/assets/dmn-js-literal-expression.css'
import 'dmn-js/dist/assets/dmn-js-shared.css'

import styled from 'styled-components';

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  .dmn-decision-table-container,
  .viewer-container {
    padding: 10px;
  }

  .djs-overlay .drill-down-overlay {
    padding: 0px 5px 2px;
  }
`;

class DmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();

    console.log('%cDmnEditor#constructor', 'background: red; color: white; padding: 2px 4px');
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

    [
      'import.done',
      'saveXML.done',
      'attach'
    ].forEach((event) => {
      modeler[fn](event, this.updateActions)
    });

    modeler[fn]('views.changed', this.viewsChanged);

    modeler[fn]('view.contentChanged', () => {
      this.updateActions();

      this.props.dirtyChanged(this.checkDirty());
    });
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

  viewsChanged = ({ activeView, views }) => {

    const {
      setCachedState,
      secondaryTabsChanged
    } = this.props;

    let newActiveSecondaryTab;

    const newSecondaryTabs = views.map(view => {
      const { element } = view;
      
      const newSecondaryTab = {
        element,
        id: element.id,
        name: getSecondaryTabName(view),
        order: -1,
        type: 'dmn'
      };

      if (view === activeView) {
        newActiveSecondaryTab = newSecondaryTab;
      }

      return newSecondaryTab;
    });

    secondaryTabsChanged('dmn', newSecondaryTabs, newActiveSecondaryTab);

    // needs to be called last
    setCachedState({
      activeView,
      views
    });
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

    const commandStack = activeViewer.get('commandStack');

    console.log('%cDmnEditor#setState', 'background: red; color: white; padding: 2px 4px', {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo()
    });

    this.setState({
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo()
    });
  }

  checkImport = () => {
    
    console.log('%DmnEditor#checkImport', 'background: steelblue; color: white; padding: 2px 4px');
    const {
      modeler
    } = this.getCached();

    const {
      secondaryTab,
      xml
    } = this.props;

    if (xml !== modeler.lastXML) {      
      modeler.lastXML = xml;

      window.modeler = modeler;

      modeler.importXML(xml, (err) => {
        console.log('%cimporting', 'background: steelblue; color: white; padding: 2px 4px');

        console.log('tab:', secondaryTab);

        // open diagram view by default
        const definitions = modeler.getDefinitions();

        if (secondaryTab && secondaryTab.element) {
          this.open(secondaryTab.element);
        } else {
          this.open(definitions);
        }
      });
    } else {
      secondaryTab
        && secondaryTab.element
        && this.open(secondaryTab.element);
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
      console.log('%copening view for element ' + view.element.id, 'background: steelblue; color: white; padding: 2px 4px');
      modeler.open(view);
    }
  }

  handleTriggerEditorAction = (event, context) => {
    const {
      modeler
    } = this.getCached();

    modeler.getActiveViewer()
      .get('editorActions')
      .trigger(context.editorAction);
  }

  getXML(done) {
    const {
      modeler
    } = this.getCached();

    modeler.saveXML({ format: true }, (err, xml) => {
      modeler.lastXML = xml;

      done(xml);
    });
  }

  render() {
    console.log('%cDmnEditor#render', 'background: red; color: white; padding: 2px 4px', this.state);

    return (
      <Fragment>
        <EventListener event="triggerEditorAction" handler={this.handleTriggerEditorAction} />

        <Fill name="buttons">
          <Button disabled={ !this.state.undo } onClick={this.undo}>Undo</Button>
          <Button disabled={ !this.state.redo } onClick={this.redo}>Redo</Button>
        </Fill>
        <Container innerRef={ this.ref }></Container>
      </Fragment>
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

function getSecondaryTabName(view) {
  if (view.type === 'drd') {
    return 'Diagram';
  }

  return view.element.name || viewNames[view.type];
}