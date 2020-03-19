/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

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


export class MultiSheetTab extends CachedComponent {

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
      .sort((a, b) => a.order - b.order);

    if (newActiveSheet) {
      activeSheet = sheets.find(s => s.id === newActiveSheet.id);
    }

    this.setCached({
      sheets,
      activeSheet
    });
  }

  handleChanged = (newState = {}) => {
    const {
      onChanged
    } = this.props;

    const dirty = this.isDirty(newState);

    onChanged({
      ...newState,
      dirty
    });
  }

  handleError = (error) => {
    const {
      onError
    } = this.props;

    onError(error);
  }

  handleWarning = (warning) => {
    const {
      onWarning
    } = this.props;

    onWarning(warning);
  }

  /**
   * Check wether or not tab is dirty.
   *
   * @param {Object} state - Editor state.
   *
   * @returns {boolean}
   */
  isDirty(state = {}) {
    const { dirty } = state;

    if (dirty) {
      return true;
    }

    const { xml } = this.props;

    const { lastXML } = this.getCached();

    if (!lastXML) {
      return false;
    }

    return isXMLChange(lastXML, xml);
  }

  async showImportErrorDialog(error) {
    const {
      onAction,
      tab
    } = this.props;

    const {
      name,
      type
    } = tab;

    const { button } = await onAction('show-dialog', getErrorDialog({
      error,
      name,
      type
    }));

    if (button === 'ask-in-forum') {
      onAction('open-external-url', {
        url: 'https://forum.camunda.org/c/modeler'
      });
    }
  }

  handleImport = (error, warnings) => {

    if (warnings && warnings.length) {
      warnings.forEach(warning => {
        this.handleWarning(warning);
      });

      if (!error) {
        this.displayImportWarningsNotification(warnings);
      }
    }

    if (error) {
      this.openFallback();

      this.showImportErrorDialog(error);

      this.handleError(error);
    }
  }

  displayImportWarningsNotification(warnings) {
    this.props.onAction('display-notification', {
      type: 'warning',
      title: `Imported with ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`,
      content: 'See further details in the log.',
      duration: 0
    });
  }

  /**
   * Open fallback sheet if provided.
   */
  openFallback() {

    let {
      sheets
    } = this.getCached();

    if (!sheets) {
      sheets = this.getDefaultSheets();
    }

    const fallback = sheets.find(sheet => {
      const {
        provider
      } = sheet;

      return provider.isFallback;
    });

    if (fallback) {
      this.setCached({
        activeSheet: fallback
      });
    }
  }

  handleContentUpdated = xml => {
    this.setCached({
      lastXML: xml
    });
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

  handleLayoutChanged = (newLayout) => {
    const {
      onLayoutChanged
    } = this.props;

    onLayoutChanged(newLayout);
  }

  triggerAction = async (action, options) => {

    const editor = this.editorRef.current;

    if (action === 'save') {
      const xml = await editor.getXML();

      this.setCached({
        lastXML: xml
      });

      return xml;
    } else if (action === 'export-as') {
      const { fileType } = options;

      return await editor.exportAs(fileType);
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

    const xml = await this.editorRef.current.getXML();

    this.setCached({
      activeSheet: sheet,
      lastXML: xml
    });

    this.props.onAction('emit-event', {
      type: 'tab.activeSheetChanged',
      payload: { activeSheet: sheet }
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
    let { sheets } = this.getCached();

    if (!sheets) {
      sheets = this.getDefaultSheets();

      this.setCached({
        sheets,
        activeSheet: sheets[0]
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { xml } = this.props;

    if (isXMLChange(prevProps.xml, xml)) {
      this.setCached({
        lastXML: xml
      });
    }
  }

  isUnsaved = (tab) => {
    const { file } = tab;

    return file && !file.path;
  }

  onAction = (action, options) => {
    const {
      onAction,
      tab
    } = this.props;

    if (action === 'close-tab') {
      return onAction('close-tab', { tabId: tab.id });
    }

    return onAction(action, options);
  }

  render() {
    let {
      activeSheet,
      sheets,
      lastXML
    } = this.getCached();

    let {
      id,
      xml,
      layout,
      tab
    } = this.props;

    if (!sheets) {
      sheets = this.getDefaultSheets();
    }

    if (!activeSheet) {
      activeSheet = sheets[0];
    }

    const Editor = activeSheet.provider.editor;

    const isNew = this.isUnsaved(tab);

    return (
      <div className={ css.MultiSheetTab }>
        <TabContainer className="content tab">
          <Editor
            ref={ this.editorRef }
            id={ `${id}-${activeSheet.provider.type}` }
            xml={ lastXML || xml }
            isNew={ isNew }
            layout={ layout }
            activeSheet={ activeSheet }
            onSheetsChanged={ this.sheetsChanged }
            onContextMenu={ this.handleContextMenu }
            onAction={ this.onAction }
            onChanged={ this.handleChanged }
            onContentUpdated={ this.handleContentUpdated }
            onError={ this.handleError }
            onImport={ this.handleImport }
            onLayoutChanged={ this.handleLayoutChanged }
            onModal={ this.props.onModal }
            getConfig={ this.props.getConfig }
            setConfig={ this.props.setConfig }
            getPlugins={ this.props.getPlugins }
          />
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


// helper //////////

function getErrorDialog({
  error,
  name,
  type
}) {
  return {
    type: 'error',
    title: 'Import Error',
    message: 'Ooops!',
    buttons: [{
      id: 'close',
      label: 'Close'
    }, {
      id: 'ask-in-forum',
      label: 'Ask in Forum'
    }],
    detail: [
      error.message,
      '',
      'Do you believe "' + name + '" is valid ' + type.toUpperCase() + ' diagram?',
      '',
      'Post this error with your diagram in our forum for help.'
    ].join('\n')
  };
}

function isXMLChange(prevXML, xml) {
  return prevXML !== xml;
}
