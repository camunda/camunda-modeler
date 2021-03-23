/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const log = require('../../log')('app:qrm-manager');
const qrmHandler = require('./qrm-handler');

let QRMs = [];

module.exports.getQRMs = function() {
  log.info('Retrieving QRMs from backend. Number of QRMs: %i', QRMs.length);
  return QRMs;
};

module.exports.updateQRMs = async function() {
  log.info('Updating QRMs in backend.');
  try {
    QRMs = await qrmHandler.getCurrentQRMs();
    return QRMs;
  } catch (error) {
    log.error('Error while updating QRMs in backend: ', error);
    throw error;
  }
};
