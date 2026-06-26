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

const os = require('os');
const path = require('path');
const fs = require('fs/promises');

const { test, expect } = require('../harness/test');
const { launch } = require('../harness/electron-app');
const { copyFixture, expectFileExists } = require('../harness/files');
const { normalizeSvg } = require('../harness/svg');

// the app exports BPMN diagrams as these image types (BpmnEditor EXPORT_AS)
const FORMATS = [ 'svg', 'png', 'jpeg' ];

test.describe('BPMN export', function() {

  let app, tmp;

  test.beforeAll(async function() {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cm-e2e-tmp-'));

    const input = await copyFixture('simple.bpmn', tmp, 'diagram.bpmn');

    app = await launch({ openFile: input });

    await app.page.waitForSelector('.djs-container');
  });

  test.beforeEach(() => app.startTracing());

  test.afterEach(async function() {
    const testInfo = test.info();

    if (testInfo.status !== testInfo.expectedStatus || process.env.E2E_TRACE === '1') {
      const tracePath = testInfo.outputPath('trace.zip');

      await app.stopTracing(tracePath);

      await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' });
    } else {
      await app.stopTracing();
    }
  });

  test.afterAll(async function() {
    await app.close();

    await fs.rm(tmp, { recursive: true, force: true });
  });

  for (const format of FORMATS) {

    test(`should export the diagram as ${ format.toUpperCase() }`, async function() {

      const output = path.join(tmp, `diagram.${ format }`);

      // when
      await app.step(`export as ${ format }`, async () => {

        // the export type is derived from the file extension we return
        await app.expectSaveDialog(output);

        await app.shortcut('CommandOrControl+Shift+E');
      });

      // then
      await app.step('compare exported image with baseline', async () => {
        await expectFileExists(output);

        const exported = await fs.readFile(output);

        // SVG carries volatile generated ids; raster formats compare pixel-wise
        const actual = format === 'svg' ? normalizeSvg(exported) : exported;

        expect(actual).toMatchSnapshot(`simple.${ format }`);
      });
    });
  }

});
