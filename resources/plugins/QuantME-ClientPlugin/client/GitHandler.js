/**
 * Copyright (c) 2020 Institute for the Architecture of Application System -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import Fetch from 'node-fetch';

export default class GitHandler {

  /**
   * Get the URLs to all folders in the given public repository
   *
   * @param userName the username or organisation name the repository belongs to
   * @param repoName the name of the repository
   */
  static async getFoldersInRepository(userName, repoName) {
    const directoryURLs = [];
    let response = await Fetch(`https://api.github.com/repos/${userName}/${repoName}/contents/?ref=HEAD`);
    const contents = await response.json();

    if (response.status !== 200) {
      throw 'Status code not equal to 200: ' + response.status;
    }

    for (let i = 0; i < contents.length; i++) {
      let item = contents[i];
      if (item.type === 'dir') {
        directoryURLs.push(item.url);
      }
    }
    return directoryURLs;
  }

  /**
   * Get the URLs to all files in the given folder of the github repository
   *
   * @param folderURL the URL to the folder in the github repository
   */
  static async getFilesInFolder(folderURL) {
    const fileURLs = [];
    let response = await Fetch(folderURL);
    const contents = await response.json();

    for (let i = 0; i < contents.length; i++) {
      let item = contents[i];
      if (item.type === 'file') {
        fileURLs.push({ name: item.name, download_url: item.download_url });
      }
    }
    return fileURLs;
  }

  /**
   * Retrieve the content of the file at the specified URL
   *
   * @param fileURL the URL to the file to retrieve
   * @returns the content of the given file
   */
  static async getFileContent(fileURL) {
    let response = await Fetch(fileURL);
    return await response.text();
  }
}
