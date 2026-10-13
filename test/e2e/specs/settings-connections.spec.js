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

const { test, expect } = require('../harness/test');
const { copyFixture } = require('../harness/files');
const { SettingsPage } = require('../pages/SettingsPage');

const C8RUN = 'c8run (local)';

test.describe('settings - Camunda 8 connections', function() {

  test('lists the default connection', async function({ launch }) {
    const app = await launch();

    const settings = new SettingsPage(app);

    await settings.open();

    // the app migrates in its own local connection on first start
    await expect(settings.connection(C8RUN)).toBeVisible();
    await expect(settings.connection(C8RUN)).toContainText('http://localhost:8080/v2');
  });


  test('adds a connection', async function({ launch }) {
    const app = await launch();

    const settings = new SettingsPage(app);

    await settings.open();

    // when
    await settings.addConnection();

    await settings.fill('Name', 'Staging');
    await settings.choose('Camunda 8 Self-Managed');
    await settings.fill('Connection URL', 'http://localhost:1/v2');

    await settings.submit('Add');

    // then
    await expect(settings.connection('Staging')).toContainText('http://localhost:1/v2');

    const connections = await settings.savedConnections(
      connections => connections.some(connection => connection.name === 'Staging')
    );

    expect(connections.map(connection => connection.name)).toEqual([ C8RUN, 'Staging' ]);

    const staging = connections[1];

    expect(staging).toMatchObject({
      targetType: 'selfHosted',
      contactPoint: 'http://localhost:1/v2'
    });

    expect(staging.id).toBeTruthy();
    expect(staging.id).not.toEqual(connections[0].id);
  });


  test('edits a connection', async function({ launch }) {
    const app = await launch();

    const settings = new SettingsPage(app);

    await settings.open();

    const [ { id } ] = await settings.savedConnections(connections => connections.length === 1);

    // when
    await settings.editConnection(C8RUN);

    await settings.fill('Name', 'Local');

    await settings.submit('Save');

    // then
    await expect(settings.connection('Local')).toBeVisible();
    await expect(settings.connection(C8RUN)).toHaveCount(0);

    const connections = await settings.savedConnections(
      connections => connections.some(connection => connection.name === 'Local')
    );

    expect(connections).toHaveLength(1);
    expect(connections[0]).toMatchObject({
      name: 'Local',
      contactPoint: 'http://localhost:8080/v2'
    });

    // the connection keeps its identity, so files linked to it stay linked
    expect(connections[0].id).toEqual(id);
  });


  test('discards changes on cancel', async function({ launch }) {
    const app = await launch();

    const settings = new SettingsPage(app);

    await settings.open();

    // when
    await settings.editConnection(C8RUN);

    await settings.fill('Name', 'Discarded');

    await settings.cancel();

    // then
    await expect(settings.connection(C8RUN)).toBeVisible();
    await expect(settings.connection('Discarded')).toHaveCount(0);
  });


  test('removes a connection', async function({ launch }) {
    const app = await launch();

    const settings = new SettingsPage(app);

    await settings.open();

    // when
    await settings.removeConnection(C8RUN);

    // then
    await expect(settings.connection(C8RUN)).toHaveCount(0);
    await expect(settings.settings()).toContainText('No connections configured');

    await settings.savedConnections(connections => connections.length === 0);
  });


  test('checks a connection before it is saved', async function({ launch }) {
    const app = await launch();

    const settings = new SettingsPage(app);

    await settings.open();

    // when
    await settings.addConnection();

    await settings.choose('Camunda 8 Self-Managed');

    // then
    await expect(settings.connectionStatus()).toContainText('Connection configuration is invalid');

    // when
    await settings.fill('Connection URL', 'http://localhost:1/v2');

    // then
    // the check goes to the (unreachable) cluster, which takes a while to fail
    await expect(settings.connectionStatus()).toContainText(/cannot connect/i, { timeout: 30000 });
  });


  test('opens a connection from the status bar', async function({ launch, tmp }) {
    const file = await copyFixture('service-task.bpmn', tmp);

    const app = await launch({ openFile: file, connectToEngine: true });

    await app.page.waitForSelector('.djs-container');

    const settings = new SettingsPage(app);

    // when
    await app.page.getByTitle('Configure Camunda 8 connection').click();
    await app.page.getByRole('link', { name: 'Manage connections' }).click();

    // then
    await expect(settings.modal(`Edit ${ C8RUN }`)).toBeVisible();
    await expect(settings.connectionDialog().getByLabel('Name', { exact: true })).toHaveValue(C8RUN);
  });

});
