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

const { expect } = require('@playwright/test');

const OPERATE_LINK = 'Open in Camunda Operate';

/**
 * The status bar deployment and start-instance controls, their overlays, and the
 * notifications they produce.
 *
 * The process application variants are separate controls, not modes of the same
 * one: their fills declare `replaces="deployment"` / `replaces="start-instance"`,
 * so exactly one of each pair is mounted depending on whether the active file
 * belongs to a process application.
 */
class DeploymentPage {

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Open the deployment overlay for a single file.
   *
   * @return {Promise<void>}
   */
  async openDeployment() {
    await this.page.getByTitle('Open file deployment').click();
  }

  /**
   * Open the deployment overlay for a process application.
   *
   * @return {Promise<void>}
   */
  async openProcessApplicationDeployment() {
    await this.page.getByTitle('Open process application deployment').click();
  }

  /**
   * Open the start instance overlay for a single file.
   *
   * @return {Promise<void>}
   */
  async openStartInstance() {
    await this.page.getByTitle('Open start instance').click();
  }

  /**
   * Open the start instance overlay for a process application.
   *
   * @return {Promise<void>}
   */
  async openProcessApplicationStartInstance() {
    await this.page.getByTitle('Open process application start instance').click();
  }

  /**
   * Wait until the overlay reports how many resources it will deploy.
   *
   * The count comes from the file context indexer, which populates
   * asynchronously after the app opens a file — not from the open tabs. Gating
   * on the rendered count is what keeps a process application deployment from
   * racing the indexer and shipping only the active file.
   *
   * @param {number} count
   *
   * @return {Promise<void>}
   */
  async expectResourceCount(count) {
    await expect(
      this.page.getByText(`${ count } ${ count === 1 ? 'file' : 'files' } will be deployed`)
    ).toBeVisible();
  }

  /**
   * Submit an overlay by its submit button label, once the app has a connection
   * to submit against.
   *
   * @param {string} label
   *
   * @return {Promise<void>}
   */
  async submit(label) {
    await this.expectConnected();

    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  /**
   * Wait until the status bar reports a successful connection check.
   *
   * Gating on that positive state rather than on the absence of the overlay's
   * "Could not establish connection" feedback: the feedback is equally absent
   * before the check has run at all, so waiting for it to be hidden passes
   * immediately and submits while the connection is still unresolved. Getting
   * there means migrating in the `c8run (local)` connection and a round trip to
   * the gateway, which is slow enough on a cold app and cluster to need a
   * timeout of its own.
   *
   * @return {Promise<void>}
   */
  async expectConnected() {
    await expect(
      this.page.getByTitle('Configure Camunda 8 connection').getByLabel('Success')
    ).toBeVisible({ timeout: 30000 });
  }

  /**
   * A notification, located by its title.
   *
   * @param {string} title
   *
   * @return {import('@playwright/test').Locator}
   */
  notification(title) {
    return this.page.getByRole('status').filter({
      has: this.page.getByRole('heading', { name: title, exact: true })
    });
  }

  /**
   * The `Open in Camunda Operate` link of the notification titled `title`.
   *
   * The link is built from the deployment response the gateway returned, so its
   * query carries the deployed process id and version — asserting on it proves
   * the app got a real deployment record back, not merely that it did not throw.
   *
   * @param {string} title
   *
   * @return {import('@playwright/test').Locator}
   */
  operateLink(title) {
    return this.notification(title).getByRole('link', { name: OPERATE_LINK });
  }

  /**
   * Query parameters of the Operate link of the notification titled `title`.
   *
   * @param {string} title
   *
   * @return {Promise<URLSearchParams>}
   */
  async operateLinkParams(title) {
    const href = await this.operateLink(title).getAttribute('href');

    return new URL(href).searchParams;
  }
}

module.exports = {
  DeploymentPage
};
