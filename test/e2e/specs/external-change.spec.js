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

const { test, expect } = require('../harness/test');
const { copyFixture, readFile } = require('../harness/files');

test.describe('external change detection', function() {

  test('should prompt to reload when the open file changes on disk', async function({ launch, tmp }) {

    // given an open diagram
    const file = await copyFixture('simple.bpmn', tmp);

    const app = await launch({ openFile: file });

    await app.page.waitForSelector('.djs-container');

    await app.recordDialogs();

    // when the file is changed by another program
    const xml = await readFile(file);

    await fs.writeFile(file, xml.replace('isExecutable="false"', 'isExecutable="true"'));

    // then, once the window regains focus, the app prompts to reload the
    // externally changed file. The watcher may not have picked up the change at
    // the first focus, so re-focus on each poll until the prompt appears.
    await expect.poll(async () => {
      await app.focusWindow();

      const calls = await app.dialogCalls();

      return calls.some(call => /changed externally/.test(call.message || ''));
    }, { timeout: 10000 }).toBe(true);
  });

});
