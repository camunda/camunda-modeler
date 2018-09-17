import React from 'react';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import CamundaCmmnModeler from './modeler';

import css from './CmmnEditor.less';

import { active as isInputActive } from '../../../util/dom/is-input';

import { getCmmnEditMenu } from './getCmmnEditMenu';

import generateImage from '../../util/generateImage';

import { merge } from 'min-dash';

import classNames from 'classnames';

import defaultLayout from '../defaultLayout';


export class CmmnEditor extends CachedComponent {

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

    const selectionLength = selection.get().length;

    const inputActive = isInputActive();

    const editMenu = getCmmnEditMenu({
      canRedo: commandStack.canRedo(),
      canUndo: commandStack.canUndo(),
      editLabel: !inputActive && !!selectionLength,
      find: !inputActive,
      globalConnectTool: !inputActive,
      handTool: !inputActive,
      lassoTool: !inputActive,
      spaceTool: !inputActive,
      moveCanvas: !inputActive,
      moveSelection: !inputActive && !!selectionLength,
      removeSelected: !!selectionLength
    });

    const newState = {
      canExport: [ 'svg', 'png' ],
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

  checkImport() {
    const {
      modeler
    } = this.getCached();

    const {
      xml
    } = this.props;

    if (xml !== modeler.lastXML) {

      modeler.lastXML = xml;

      modeler.importXML(xml, (err) => {
        if (err) {
          this.handleError({
            error: err
          });
        }
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

  handleContextMenu = (event) => {

    const {
      onContextMenu
    } = this.props;

    if (typeof onContextMenu === 'function') {
      onContextMenu(event);
    }
  }

  resize = () => {
    const {
      modeler
    } = this.getCached();

    const canvas = modeler.get('canvas');

    canvas.resized();
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

  render() {
    const {
      layout
    } = this.state;

    const propertiesPanel = layout.propertiesPanel || defaultLayout.propertiesPanel;

    return (
      <div className={ css.CmmnEditor }>

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
    const modeler = new CamundaCmmnModeler({
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


export default WithCache(WithCachedState(CmmnEditor));