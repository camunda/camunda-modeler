/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');

const { expect } = require('@playwright/test');

/**
 * The settings modal and the Camunda 8 connections managed in it.
 *
 * Connections are listed by name; each entry offers Edit and Remove through
 * its options (`...`) menu. Adding and editing happens in a dialog on top of
 * the settings, which checks the connection before it is saved.
 */
class SettingsPage {

  /**
   * @param {import('../harness/electron-app').ElectronApp} app
   */
  constructor(app) {
    this.app = app;
    this.page = app.page;
  }

  /**
   * Open the settings via their keyboard shortcut.
   *
   * @return {Promise<void>}
   */
  async open() {
    await this.app.shortcut('CommandOrControl+,');

    await expect(this.settings()).toBeVisible();
  }

  /**
   * The settings modal.
   *
   * @return {import('@playwright/test').Locator}
   */
  settings() {
    return this.modal('Settings');
  }

  /**
   * The add / edit connection dialog.
   *
   * @return {import('@playwright/test').Locator}
   */
  connectionDialog() {
    return this.modal(/^(Add Camunda 8 connection|Edit .+)$/);
  }

  /**
   * A modal, located by its title.
   *
   * @param {string|RegExp} title
   *
   * @return {import('@playwright/test').Locator}
   */
  modal(title) {
    return this.page.getByRole('dialog').filter({
      has: this.page.getByRole('heading', { name: title, exact: true })
    });
  }

  /**
   * The list entry of a connection, located by its name.
   *
   * @param {string} name
   *
   * @return {import('@playwright/test').Locator}
   */
  connection(name) {
    return this.settings().getByRole('listitem').filter({
      has: this.page.getByRole('button', { name: `Options for ${ name }`, exact: true })
    });
  }

  /**
   * Open the dialog to add a connection.
   *
   * @return {Promise<void>}
   */
  async addConnection() {
    await this.settings().getByRole('button', { name: 'Add connection', exact: true }).click();

    await expect(this.connectionDialog()).toBeVisible();
  }

  /**
   * Open the dialog to edit a connection.
   *
   * @param {string} name
   *
   * @return {Promise<void>}
   */
  async editConnection(name) {
    await this.selectOption(name, 'Edit');

    await expect(this.connectionDialog()).toBeVisible();
  }

  /**
   * Remove a connection.
   *
   * @param {string} name
   *
   * @return {Promise<void>}
   */
  async removeConnection(name) {
    await this.selectOption(name, 'Remove');
  }

  /**
   * Select an entry of the options menu of a connection.
   *
   * @param {string} name
   * @param {string} option
   *
   * @return {Promise<void>}
   */
  async selectOption(name, option) {
    await this.settings().getByRole('button', { name: `Options for ${ name }`, exact: true }).click();

    await this.page.getByRole('menuitem', { name: option, exact: true }).click();
  }

  /**
   * Fill a text field of the connection dialog, located by its label.
   *
   * @param {string} label
   * @param {string} value
   *
   * @return {Promise<void>}
   */
  async fill(label, value) {
    await this.connectionDialog().getByLabel(label, { exact: true }).fill(value);
  }

  /**
   * Check a radio option of the connection dialog.
   *
   * The radio inputs are visually hidden behind their labels, so this clicks
   * the label.
   *
   * @param {string} label
   *
   * @return {Promise<void>}
   */
  async choose(label) {
    await this.connectionDialog().locator('label', { hasText: label }).click();
  }

  /**
   * The connection check status in the connection dialog.
   *
   * @return {import('@playwright/test').Locator}
   */
  connectionStatus() {
    return this.connectionDialog().getByRole('status');
  }

  /**
   * Submit the connection dialog by its submit button label (`Add` or `Save`).
   *
   * @param {string} label
   *
   * @return {Promise<void>}
   */
  async submit(label) {
    await this.connectionDialog().getByRole('button', { name: label, exact: true }).click();

    await expect(this.connectionDialog()).toBeHidden();
  }

  /**
   * Close the connection dialog without saving.
   *
   * @return {Promise<void>}
   */
  async cancel() {
    await this.connectionDialog().getByRole('button', { name: 'Cancel', exact: true }).click();

    await expect(this.connectionDialog()).toBeHidden();
  }

  /**
   * Wait until the connections are persisted to `settings.json`, and return them.
   *
   * Settings are saved with a debounce, so this polls until `predicate` holds.
   *
   * @param {(connections: Object[]) => boolean} predicate
   *
   * @return {Promise<Object[]>}
   */
  async savedConnections(predicate) {
    let connections;

    await expect.poll(async () => {
      connections = await this.readConnections();

      return connections !== null && predicate(connections);
    }).toBe(true);

    return connections;
  }

  /**
   * @return {Promise<Object[]|null>} saved connections, or `null` if none were saved (yet)
   */
  async readConnections() {
    try {
      const json = await fs.readFile(path.join(this.app.userDataDir, 'settings.json'), 'utf8');

      const connections = JSON.parse(json)['connectionManagerPlugin.c8connections'];

      return Array.isArray(connections) ? connections : null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = {
  SettingsPage
};
