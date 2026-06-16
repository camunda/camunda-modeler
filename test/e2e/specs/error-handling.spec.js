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

test.describe('error handling', function() {

  test('should report an Import Error when opening a broken diagram', async function({ launch, tmp }) {

    // given a broken diagram and a running app
    const broken = await copyFixture('broken.bpmn', tmp);

    const app = await launch({});

    await app.page.waitForSelector('.tabs');

    // record dialogs (auto-answered) and make Open return the broken file
    await app.recordDialogs();
    await app.expectOpenDialog([ broken ]);

    // when opening it
    await app.shortcut('CommandOrControl+O');

    // then the app surfaces the failure via a native "Import Error" message box
    await expect.poll(async () => {
      const calls = await app.dialogCalls();

      return calls.some(call =>
        call.name === 'showMessageBox' && /Import Error/.test(`${ call.message } ${ call.title }`)
      );
    }, { timeout: 10000 }).toBe(true);
  });

});
