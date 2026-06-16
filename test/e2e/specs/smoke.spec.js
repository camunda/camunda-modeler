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

const path = require('path');

const { test, expect } = require('../harness/test');
const { copyFixture, readFile, expectFileExists } = require('../harness/files');

test.describe('smoke', function() {

  test('should open a BPMN diagram in a tab', async function({ launch, tmp }) {

    // given
    const input = await copyFixture('simple.bpmn', tmp, 'diagram.bpmn');

    // when
    const app = await launch({ openFile: input });

    // then
    await app.step('verify tab + canvas', async () => {
      await expect(app.page.locator('.tab__name', { hasText: 'diagram.bpmn' }).first())
        .toBeVisible();

      await expect(app.page.locator('.djs-container')).toBeVisible();
    });
  });


  test('should save the diagram to a new file via "Save File As..."', async function({ launch, tmp }) {

    // given
    const input = await copyFixture('simple.bpmn', tmp, 'input.bpmn');

    const app = await launch({ openFile: input });

    await app.page.waitForSelector('.djs-container');

    const output = path.join(tmp, 'output.bpmn');

    // when
    await app.step('save as new file', async () => {

      // the one seam: the native picker returns our target path
      await app.expectSaveDialog(output);

      await app.shortcut('CommandOrControl+Shift+S');
    });

    // then
    await app.step('verify tab renamed to new file', async () => {

      // the visible effect of "Save As": the active tab now shows output.bpmn
      await expect(app.page.locator('.tab__name', { hasText: 'output.bpmn' }).first())
        .toBeVisible();
    });

    await app.step('verify file written to disk', async () => {
      await expectFileExists(output);

      const xml = await readFile(output);

      expect(xml).toContain('<bpmn:definitions');
      expect(xml).toContain('Process_1');
    });
  });

});
