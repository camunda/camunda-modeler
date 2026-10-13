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

const { test, expect } = require('../../harness/test');
const { SettingsPage } = require('../../pages/SettingsPage');

test.describe('connection settings', function() {

  test('checks a connection against the cluster', async function({ launch }) {
    const app = await launch({ connectToEngine: true });

    const settings = new SettingsPage(app);

    await settings.open();

    // when
    await settings.editConnection('c8run (local)');

    // then
    // a round trip to the gateway, slow enough on a cold app and cluster to
    // need a timeout of its own
    await expect(settings.connectionStatus()).toContainText('Connected', { timeout: 30000 });

    // when
    await settings.fill('Connection URL', 'http://localhost:1/v2');

    // then
    await expect(settings.connectionStatus()).toContainText(/cannot connect/i, { timeout: 30000 });
  });

});
