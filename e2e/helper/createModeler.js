/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const fkill = require('fkill');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const Application = require('spectron').Application;

const platform = os.platform();

const { applicationPaths } = require('./applicationPaths');

const applicationPath = applicationPaths[ platform ];

if (!applicationPath) {
  throw new Error(`Platform ${ platform } not supported`);
}

class Modeler {
  constructor(diagramPaths = []) {

    this._tmpDiagramPaths = copyDiagrams(diagramPaths);

    this._tmpUserDataPath = copyUserData();

    this.app = new Application({
      path: path.join(__dirname, '../../dist', applicationPath),
      args: [
        ...this._tmpDiagramPaths,
        '--dangerously-enable-node-integration',
        '--disable-remote-interaction'
      ],
      chromeDriverArgs: [
        `--user-data-dir=${ this._tmpUserDataPath }`
      ],
      webdriverOptions: {
        deprecationWarnings: false
      }
    });
  }

  async open() {
    await this.app.start();

    await this.app.client.waitUntilWindowLoaded();
  }

  async close() {
    await this.app.stop();

    await killModelerInstances();

    cleanUpDiagrams(this._tmpDiagramPaths);

    cleanUpUserData(this._tmpUserDataPath);
  }

  async click(selector) {
    await this.app.client.click(selector);
  }

  async doubleClick(selector) {
    await this.app.client.doubleClick(selector);
  }

  async keys(keys) {
    await this.app.client.keys(keys);
  }

  async get(selector) {
    return await this.app.client.$(selector);
  }

  async getText(selector) {
    return await this.app.client.getText(selector);
  }

  async auditA11y(options) {
    return await this.app.client.auditAccessibility(options);
  }
}

/**
 * Create and return a Camunda Modeler instance.
 *
 * @param {Array<string>} diagramPaths
 *
 * @returns {Object}
 */
async function createModeler(diagramPaths = []) {
  await killModelerInstances();

  const modeler = new Modeler(diagramPaths);

  await modeler.open();

  return modeler;
}

module.exports = createModeler;


// helpers //////////

function cleanUpDiagrams(tmpDiagramPaths = []) {
  tmpDiagramPaths.forEach(tmpDiagramPath => {
    fs.unlinkSync(tmpDiagramPath);
  });
}

function cleanUpUserData(tmpUserDataPath) {
  rimraf.sync(tmpUserDataPath);
}

function copyDiagrams(diagramPaths = []) {
  return diagramPaths.map(diagramPath => {
    mkdirp.sync(path.join(__dirname, '../tmp'));

    const tmpDiagramPath = path.join(__dirname, '../tmp', path.basename(diagramPath));

    fs.copyFileSync(diagramPath, tmpDiagramPath);

    return tmpDiagramPath;
  });
}

function copyUserData() {
  const userDataConfigPath = path.join(__dirname, '../fixtures/user-data/config.json'),
        tmpUserDataConfigPath = path.join(__dirname, '../tmp/user-data/config.json');

  mkdirp.sync(path.join(__dirname, '../tmp/user-data'));

  fs.copyFileSync(userDataConfigPath, tmpUserDataConfigPath);

  return path.dirname(tmpUserDataConfigPath);
}

async function killModelerInstances() {
  try {
    await fkill('Camunda Modeler', { silent: true });
  } catch (err) {
    console.error(err);
  }
}