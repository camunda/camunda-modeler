import React from 'react';

import {
  TabLinks,
  TabContainer
} from '../primitives';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../cached';

import css from './MultiSheetTab.less';


class MultiSheetTab extends CachedComponent {

  constructor(props) {
    super(props);

    this.editorRef = React.createRef();
  }

  /**
   * React to current sheet provider reporting
   * changed sheets.
   */
  sheetsChanged = (newSheets, newActiveSheet) => {
    let {
      activeSheet,
      sheets
    } = this.getCached();

    if (!sheets) {
      sheets = [];
    }

    const provider = activeSheet.provider;

    const wiredNewSheets = newSheets.map(newSheet => {
      return {
        ...newSheet,
        provider
      };
    });

    sheets = sheets
      .filter(sheet => sheet.provider !== provider)
      .concat(wiredNewSheets)
      .map(t => ({ ...t, order: t.order || 0 }))
      .sort((a, b) => a.order > b.order);

    if (newActiveSheet) {
      activeSheet = sheets.find(s => s.id === newActiveSheet.id);
    }

    this.setCached({
      sheets,
      activeSheet
    });
  }

  handleChanged = (dirty) => {

    const { tab, xml } = this.props;

    const { lastXML } = this.getCached();

    this.props.onChanged(
      tab,
      {
        dirty: dirty || (lastXML ? (xml !== lastXML) : false)
      }
    );
  }

  handleContextMenu = (event, context) => {

    const {
      activeSheet
    } = this.getCached();

    const {
      onContextMenu
    } = this.props;

    if (typeof onContextMenu === 'function') {
      onContextMenu(event, activeSheet.type, context);
    }

  }

  triggerAction = async (action, options) => {

    const editor = this.editorRef.current;

    if (action === 'save') {
      const xml = await editor.getXML();

      this.setState({
        lastXML: xml
      });

      return xml;
    }

    return editor.triggerAction(action, options);
  }

  switchSheet = async (sheet) => {

    const {
      activeSheet
    } = this.getCached();

    if (sheet === activeSheet) {
      return;
    }

    if (sheet.provider === activeSheet.provider) {
      return this.setCached({
        activeSheet: sheet
      });
    }

    var xml = await this.editorRef.current.getXML();

    this.setCached({
      activeSheet: sheet,
      lastXML: xml
    });
  }

  getDefaultSheets = () => {
    const {
      providers
    } = this.props;

    return providers.map((provider) => {

      const {
        defaultName,
        type
      } = provider;

      return {
        id: type,
        name: defaultName,
        isDefault: true,
        provider,
        type
      };
    });
  }

  componentDidMount() {
    const {
      setCachedState
    } = this.props;

    let {
      sheets
    } = this.getCached();

    if (!sheets) {
      sheets = this.getDefaultSheets();

      setCachedState({
        sheets,
        activeSheet: sheets[0]
      });
    }

  }

  render() {

    let {
      activeSheet,
      sheets,
      lastXML
    } = this.getCached();

    let {
      id,
      xml
    } = this.props;

    if (!sheets) {
      sheets = this.getDefaultSheets();
    }

    if (!activeSheet) {
      activeSheet = sheets[0];
    }

    const Editor = activeSheet.provider.editor;

    return (
      <div className={ css.MultiSheetTab }>
        <TabContainer className="content tab">
          <Editor
            ref={ this.editorRef }
            id={ `${id}-${activeSheet.id}` }
            xml={ lastXML || xml }
            activeSheet={ activeSheet }
            onSheetsChanged={ this.sheetsChanged }
            onContextMenu={ this.handleContextMenu }
            onChanged={ this.handleChanged } />
        </TabContainer>

        <TabLinks
          className="secondary links"
          tabs={ sheets }
          activeTab={ activeSheet }
          onSelect={ this.switchSheet } />

      </div>
    );
  }

}


export default WithCache(WithCachedState(MultiSheetTab));