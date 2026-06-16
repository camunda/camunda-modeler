/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const ENCODING_UTF8 = 'utf8';

/**
 * Encapsulates file-system persistence for <App>: reading, writing, exporting
 * tabs and migrating per-file configuration.
 *
 * Keeps the raw `fileSystem`/`config` interactions in one place, while tab
 * lifecycle orchestration (which tab, when, dialogs) remains in <App>.
 */
export default class FileManager {

  /**
   * @param {import('./App').App} app
   */
  constructor(app) {
    this._app = app;
  }

  /**
   * Read the files for the given paths, skipping any that fail to read.
   *
   * @param {Array<string>} filePaths
   *
   * @return {Promise<Array<File>>}
   */
  readFileList = async (filePaths) => {
    const readOperations = filePaths.map(this._app.readFileFromPath);

    const rawFiles = await Promise.all(readOperations);

    const files = rawFiles.filter(Boolean);

    return files;
  };

  /**
   * Read a single file from the given path.
   *
   * @param {string} filePath
   *
   * @return {Promise<File|undefined>}
   */
  readFileFromPath = async (filePath) => {
    const app = this._app;

    const fileSystem = app.getGlobal('fileSystem');

    const {
      tabsProvider
    } = app.props;

    const fileType = getFileTypeFromExtension(filePath);

    const provider = tabsProvider.getProvider(fileType);

    const encoding = provider.encoding ? provider.encoding : ENCODING_UTF8;

    let file = null;

    try {
      file = await fileSystem.readFile(filePath, {
        encoding
      });
    } catch (error) {
      if (error.code === 'EISDIR') {
        return app.handleError(new Error(`Cannot open directory: ${filePath}`));
      }

      app.handleError(error);
    }

    return file;
  };

  /**
   * Write the given tab contents to disk, migrating config on path change.
   *
   * @param {SaveFileOptions} options
   * @param {string} contents
   *
   * @return {Promise<File>} saved file.
   */
  saveTabAsFile = async (options, contents) => {
    const {
      encoding,
      originalFile,
      savePath,
      saveType
    } = options;

    const fileSystem = this._app.getGlobal('fileSystem');

    const file = await fileSystem.writeFile(savePath, {
      ...originalFile,
      contents
    }, {
      encoding,
      fileType: saveType
    });

    if (originalFile.path !== savePath) {
      await this._app.migrateConfigForFile(originalFile, file);
    }

    return file;
  };

  /**
   * Migrate configuration for file if file path changed and config exists.
   *
   * @param {File} oldFile - Old file with old path
   * @param {File} newFile - New file with new path
   */
  migrateConfigForFile = async (oldFile, newFile) => {
    if (!newFile?.path || !oldFile?.path) {
      return;
    }

    const config = this._app.getGlobal('config');

    const configForFile = await config.getForFile(oldFile);

    if (configForFile && Object.keys(configForFile).length > 0) {
      await config.setForFile(newFile, undefined, configForFile);
    }
  };

  /**
   * Export the active tab to the given export type.
   *
   * @param {object} options
   * @param {string} options.encoding
   * @param {string} options.exportPath
   * @param {string} options.exportType
   * @param {File} options.originalFile
   *
   * @return {Promise<File|undefined>}
   */
  exportAsFile = async (options) => {
    const {
      encoding,
      exportType,
      exportPath,
      originalFile
    } = options;

    const app = this._app;

    const fileSystem = app.getGlobal('fileSystem');

    try {
      const contents = await app.tabRef.current.triggerAction('export-as', {
        fileType: exportType
      });

      return fileSystem.writeFile(exportPath, {
        ...originalFile,
        contents
      }, {
        encoding,
        fileType: exportType
      });
    } catch (err) {
      app.logEntry(err.message, 'ERROR');
    }
  };
}


// helpers //////////

function getFileTypeFromExtension(filePath) {
  return filePath.split('.').pop();
}
