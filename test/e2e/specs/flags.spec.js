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

test.describe('flags', function() {

  test('should disable DMN when launched with --disable-dmn', async function({ launch }) {

    // when launched with the flag
    const app = await launch({ args: [ '--disable-dmn=true' ] });

    // then the "New File" menu no longer offers DMN, but still offers BPMN
    const labels = await app.menuLabels();

    expect(labels.some(label => /DMN diagram/.test(label))).toBe(false);
    expect(labels.some(label => /BPMN diagram/.test(label))).toBe(true);
  });

});
