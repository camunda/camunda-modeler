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

import GitHandler from './GitHandler';

export default class QRMHandler {

  /**
   * Get the currently defined QRMs form the repository
   *
   * @param userName the Github username to which the QRM repository belongs
   * @param repoName the Github repository name to load the QRMs from
   * @returns {Promise<[QRM]>} an array with the current QRMs
   */
  static async getCurrentQRMs(userName, repoName) {

    // get all folders of the defined QRM repository which could contain a QRM
    let folders = await GitHandler.getFoldersInRepository(userName, repoName);
    console.log('Found %i folders with QRM candidates!', folders.length);

    // filter invalid folders and retrieve QRMs
    let QRMs = [];
    for (let i = 0; i < folders.length; i++) {
      let qrm = await this.getQRM(userName, repoName, folders[i]);
      if (qrm != null) {
        QRMs.push(qrm);
      } else {
        console.log('Folder %s does not contain a valid QRM!', folders[i]);
      }
    }

    return QRMs;
  }

  /**
   * Check whether the QRM at the given URL is valid and return it or otherwise null
   *
   * @param userName the Github username to which the QRM repository belongs
   * @param repoName the Github repository name to load the QRMs from
   * @param qrmUrl
   * @returns {Promise<QRM>} the QRM if it is valid or null otherwise
   */
  static async getQRM(userName, repoName, qrmUrl) {

    // TODO: check if folder contains detector and replacement fragment and download them
    return null;
  }
}
