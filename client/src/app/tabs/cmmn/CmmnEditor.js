import React from 'react';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import {
  Loader
} from '../../primitives';

import PropertiesContainer from '../PropertiesContainer';

import CamundaCmmnModeler from './modeler';

import css from './CmmnEditor.less';

import { active as isInputActive } from '../../../util/dom/isInput';

import { getCmmnEditMenu } from './getCmmnEditMenu';
import getCmmnWindowMenu from './getCmmnWindowMenu';

import generateImage from '../../util/generateImage';

const EXPORT_AS = [ 'svg', 'png' ];


export class CmmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();
  }

  componentDidMount() {
    this._isMounted = true;

    const modeler = this.getModeler();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.attachTo(this.propertiesPanelRef.current);

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

  componentDidUpdate(prevProps) {
    if (!isImporting(this.state) && isXMLChange(prevProps.xml, this.props.xml)) {
      this.checkImport();
    }

    if (isChachedStateChange(prevProps, this.props)) {
      this.handleChanged();
    }

    if (prevProps.layout.propertiesPanel !== this.props.layout.propertiesPanel) {
      this.triggerAction('resize');
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
      'attach'
    ].forEach((event) => {
      modeler[fn](event, this.handleChanged);
    });

    modeler[fn]('error', 1500, this.handleError);
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

    onImport(error, warnings);

    if (!error) {
      this.setCached({
        lastXML: xml,
        stackIdx
      });

      this.setState({
        importing: false
      });
    }
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
      close: true,
      copy: false,
      cut: false,
      defaultCopyCutPaste: inputActive,
      dirty,
      editLabel: !inputActive && !!selectionLength,
      exportAs: EXPORT_AS,
      find: !inputActive,
      globalConnectTool: !inputActive,
      handTool: !inputActive,
      inputActive,
      lassoTool: !inputActive,
      moveCanvas: !inputActive,
      moveSelection: !inputActive && !!selectionLength,
      paste: false,
      propertiesPanel: true,
      redo: commandStack.canRedo(),
      removeSelected: !!selectionLength || inputActive,
      save: true,
      selectAll: true,
      spaceTool: !inputActive,
      undo: commandStack.canUndo(),
      zoom: true
    };

    const editMenu = getCmmnEditMenu(newState);
    const windowMenu = getCmmnWindowMenu(newState);

    if (typeof onChanged === 'function') {
      onChanged({
        ...newState,
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

  checkImport() {
    const {
      lastXML,
      modeler
    } = this.getCached();

    const {
      xml
    } = this.props;

    if (isXMLChange(lastXML, xml)) {
      this.setState({
        importing: true
      });

      // TODO(nikku): apply default element templates to initial diagram
      modeler.importXML(xml, this.ifMounted(this.handleImport));
    }
  }

  /**
   * @returns {CamundaCmmnModeler}
   */
  getModeler() {
    const {
      modeler
    } = this.getCached();

    return modeler;
  }

  getXML() {
    const {
      lastXML,
      modeler
    } = this.getCached();

    const commandStack = modeler.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    return new Promise((resolve, reject) => {

      if (!this.isDirty()) {
        return resolve(lastXML || this.props.xml);
      }

      // TODO(nikku): set current modeler version and name to the diagram
      modeler.saveXML({ format: true }, (err, xml) => {
        this.setCached({
          lastXML: xml,
          stackIdx
        });

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

  handleContextMenu = (event) => {

    const {
      onContextMenu
    } = this.props;

    if (typeof onContextMenu === 'function') {
      onContextMenu(event);
    }
  }

  resize = () => {
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

    const {
      importing,
    } = this.state;

    return (
      <div className={ css.CmmnEditor }>

        <Loader hidden={ !importing } />

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

    const modeler = new CamundaCmmnModeler({
      position: 'absolute'
    });

    const commandStack = modeler.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    return {
      __destroy: () => {
        modeler.destroy();
      },
      lastXML: null,
      modeler,
      stackIdx
    };
  }

}

export default WithCache(WithCachedState(CmmnEditor));

// helpers //////////

function isImporting(state) {
  return state.importing;
}

function isXMLChange(prevXML, xml) {
  return prevXML !== xml;
}

function isChachedStateChange(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}