/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { forEach } from 'min-dash';

export const FILTER_ALL_EXTENSIONS = {
  name: 'All Files',
  extensions: [ '*' ]
};

/**
 * Owns the native dialogs for <App>.
 *
 * Presents open, save and error dialogs through the platform `dialog` global
 * and drives the open-files flow.
 */
export default class DialogManager {

  /**
   * @param {import('./App').App} app
   */
  constructor(app) {
    this._app = app;
  }

  showOpenFilesDialog = async () => {
    const app = this._app;

    const dialog = app.getGlobal('dialog');

    const {
      tabsProvider
    } = app.props;

    const {
      activeTab
    } = app.state;

    const providers = tabsProvider.getProviders();

    const filters = getOpenFilesDialogFilters(providers);

    const filePaths = await dialog.showOpenFilesDialog({
      activeFile: activeTab.file,
      filters
    });

    if (!filePaths.length) {
      return;
    }

    const files = await app.readFileList(filePaths);

    await app.openFiles(files);
  };

  showCloseFileDialog(file) {
    const { name } = file;

    return this._app.getGlobal('dialog').showCloseFileDialog({ name });
  }

  showSaveFileDialog(file, options = {}) {
    const {
      filters,
      title
    } = options;

    return this._app.getGlobal('dialog').showSaveFileDialog({
      file,
      filters,
      title
    });
  }

  showSaveFileErrorDialog(options) {
    return this._app.getGlobal('dialog').showSaveFileErrorDialog(options);
  }

  /**
   * Asks the user whether to retry the save action.
   *
   * @param {Tab} tab
   * @param {Error} err
   * @param {Function} dialogHandler
   */
  async askForSaveRetry(tab, err, dialogHandler) {
    const { message } = err;

    const {
      name
    } = tab;

    return await this.showSaveFileErrorDialog(dialogHandler({
      message,
      name
    }));
  }
}


// helpers //////////

function getOpenFilesDialogFilters(providers) {
  const allSupportedFilter = {
    name: 'All Supported',
    extensions: []
  };

  const filtersByName = new Map();

  forEach(providers, provider => {
    const {
      extensions,
      name
    } = provider;

    if (!extensions) {
      return;
    }

    allSupportedFilter.extensions = [
      ...allSupportedFilter.extensions,
      ...extensions
    ];

    const existingFilter = filtersByName.get(name);

    if (existingFilter) {
      existingFilter.extensions = Array.from(new Set([
        ...existingFilter.extensions,
        ...extensions
      ]));
    } else {
      filtersByName.set(name, {
        name,
        extensions: [ ...extensions ]
      });
    }
  });

  // remove duplicates, sort alphabetically
  allSupportedFilter.extensions = allSupportedFilter.extensions
    .reduce((extensions, extension) => {
      if (extensions.includes(extension)) {
        return extensions;
      } else {
        return [
          ...extensions,
          extension
        ];
      }
    }, [])
    .sort();

  let filters = Array.from(filtersByName.values());

  // sort alphabetically
  filters = filters.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }

    if (a.name > b.name) {
      return 1;
    }

    return 0;
  });

  return [
    allSupportedFilter,
    ...filters,
    FILTER_ALL_EXTENSIONS
  ];
}
