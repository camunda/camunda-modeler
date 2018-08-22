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

import {
  multiSheetContainer
} from './MultiSheetTab.less';


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

  dirtyChanged = (dirty) => {

    const { tab, xml } = this.props;

    const { lastXML } = this.getCached();

    this.props.onChanged(
      tab,
      {
        dirty: dirty || (lastXML ? (xml !== lastXML) : false)
      }
    );
  }

  triggerAction = (action, options) => {
    this.editorRef.current.triggerAction(action, options);
  }

  switchSheet = (sheet) => {

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

    this.editorRef.current.getXML((xml) => {
      this.setCached({
        activeSheet: sheet,
        lastXML: xml
      });
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

    console.log('%cMultiSheetTab#render', 'background: #52B415; color: white; padding: 2px 4px');

    return (
      <div className={ multiSheetContainer }>
        <TabContainer className="content tab">
          <Editor
            ref={ this.editorRef }
            id={ `${id}-${activeSheet.id}` }
            xml={ lastXML || xml }
            activeSheet={ activeSheet }
            onSheetsChanged={ this.sheetsChanged }
            dirtyChanged={ this.dirtyChanged } />
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