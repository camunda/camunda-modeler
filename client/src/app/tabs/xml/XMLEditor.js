import React from 'react';

import { Fill } from '../../slot-fill';

import { Button } from '../../primitives';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import CodeMirror from './CodeMirror';

import css from './XMLEditor.less';


class XMLEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();

    console.log('%cXMLEditor#constructor', 'background: orange; color: white; padding: 2px 4px', this.state);

  }

  shouldComponentUpdate(nextProps) {

    // TODO: why do we need to prevent updating in the first place?
    return nextProps.xml !== this.props.xml;
  }

  componentDidMount() {
    const {
      editor
    } = this.getCached();

    editor.attachTo(this.ref.current);

    editor.on('change', this.handleChange);

    this.checkImport();
  }

  componentWillUnmount() {
    const {
      editor
    } = this.getCached();

    editor.detach();

    editor.off('change', this.handleChange);
  }

  componentDidUpdate(previousProps) {
    this.checkImport();
  }

  triggerAction(action) {
    const {
      editor
    } = this.getCached();

    if (action === 'undo') {
      editor.doc.undo();
    }

    if (action === 'redo') {
      editor.doc.redo();
    }

    if (action === 'find') {
      editor.execCommand('findPersistent');
    }

    if (action === 'findNext') {
      editor.execCommand('findNext');
    }

    if (action === 'findPrev') {
      editor.execCommand('findPrev');
    }

    if (action === 'replace') {
      editor.execCommand('replace');
    }
  }

  checkImport() {
    const {
      editor
    } = this.getCached();

    const xml = this.props.xml;

    if (xml !== editor.lastXML) {
      editor.setValue(xml);
    }

    editor.refresh();
  }

  handleChange = () => {
    const { dirtyChanged } = this.props;

    const {
      editor
    } = this.getCached();

    dirtyChanged(editor.lastXML !== editor.getValue());
  }

  getXML() {
    const {
      editor
    } = this.getCached();

    return editor.getValue();
  }

  render() {
    console.log('%cXMLEditor#render', 'background: orange; color: white; padding: 2px 4px', this.state);

    return (
      <div className={ css.XMLEditor }>
        <Fill name="buttons">
          <Button disabled={ !this.state.undo } onClick={ this.undo }>Undo</Button>
          <Button disabled={ !this.state.redo } onClick={ this.redo }>Redo</Button>
        </Fill>
        <div className="content" ref={ this.ref }></div>
      </div>
    );
  }

  static createCachedState() {

    const editor = CodeMirror();

    return {
      editor,
      __destroy: () => {
        editor.destroy();
      }
    };
  }

}

export default WithCache(WithCachedState(XMLEditor));