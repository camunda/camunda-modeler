/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* eslint-env browser */
/* global window */

'use strict';

/**
 * Probe renderer: drives a battery of values through the REAL `backend` IPC
 * bridge and records what the renderer actually observes after Electron's
 * structured-clone serialization. Results are reported to main for assertion.
 *
 * `describe`/`classify` mirror app/test/e2e/serialization/describe-value.js
 * (inlined because the renderer runs without `require`).
 */

(function() {

  function classify(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array) return 'uint8array';
    if (value instanceof Date) return 'date';
    if (value instanceof Error) return 'error';
    return typeof value;
  }

  function describe(value) {
    const type = classify(value);
    const description = { type };

    if (type === 'array') {
      description.length = value.length;
      description.items = value.map(describe);
      return description;
    }
    if (type === 'uint8array') {
      description.bytes = Array.from(value);
      return description;
    }
    if (type === 'date') {
      description.iso = value.toISOString();
      return description;
    }
    if (type === 'object') {
      description.keys = Object.keys(value).sort();
      description.values = {};
      description.keys.forEach(key => {
        description.values[key] = describe(value[key]);
      });
      return description;
    }
    if (type === 'string' || type === 'number' || type === 'boolean') {
      description.value = value;
    }
    return description;
  }

  async function run(backend, fixturePath) {
    const observations = {};

    // main -> renderer: utf8 file contents (expected: string)
    const utf8File = await backend.send('file:read', fixturePath, { encoding: 'utf8' });
    observations.readUtf8Contents = describe(utf8File.contents);
    observations.readFileKeys = Object.keys(utf8File).sort();

    // main -> renderer: binary file contents (Buffer in main -> ? in renderer)
    const binaryFile = await backend.send('file:read', fixturePath, { encoding: false });
    observations.readBinaryContents = describe(binaryFile.contents);

    // main -> renderer: file stats
    const stats = await backend.send('file:read-stats', utf8File);
    observations.lastModified = describe(stats.lastModified);

    // main -> renderer: error envelope (message/code + enumerable keys)
    try {
      await backend.send('file:read', fixturePath + '.does-not-exist', { encoding: 'utf8' });
      observations.readError = { type: 'no-error-thrown' };
    } catch (err) {
      observations.readError = {
        type: classify(err),
        message: err.message,
        code: err.code,
        keys: Object.keys(err).sort()
      };
    }

    // main -> renderer: crafted object with hard-to-serialize members
    const crafted = await backend.send('config:get', 'probe');
    observations.mainToRenderer = describe(crafted);

    // renderer -> main: send a crafted object; main describes what it received
    observations.rendererToMain = await backend.send('config:set', 'probe', {
      aString: 'text',
      aNumber: 42,
      aNull: null,
      anUndefined: undefined,
      aDate: new Date('2020-01-02T03:04:05.000Z'),
      aUint8Array: new Uint8Array([ 1, 2, 3 ]),
      nested: { inner: [ 1, undefined, 3 ] }
    });

    return observations;
  }

  try {
    const { backend } = window.getAppPreload();

    window.probe.onFixture(async (fixturePath) => {
      try {
        const observations = await run(backend, fixturePath);
        window.probe.report(observations);
      } catch (err) {
        window.probe.reportError((err && err.stack) || String(err));
      }
    });
  } catch (err) {
    window.probe.reportError((err && err.stack) || String(err));
  }

})();
