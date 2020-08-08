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

    for (let i = 0; i < contents.length; i++) {
      let item = contents[i];
      if (item.type === 'dir') {
        directoryURLs.push(item.url);
      }
    }
    return directoryURLs;
  }
}
