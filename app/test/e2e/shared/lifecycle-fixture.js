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

/**
 * Single source of truth for the file-lifecycle fixture.
 *
 * Shared by the Node side (spec writes the fixture, suite asserts on it) and
 * flows to the browser journey via the IPC fixture payload (so the renderer
 * never hard-codes the edit markers). A future Tauri driver reuses all of it
 * unchanged.
 */

const MARKER_FROM = 'ORIGINAL';
const MARKER_TO = 'EDITED';

const ORIGINAL_CONTENTS = `<?xml version="1.0"?>\n<definitions>${MARKER_FROM}</definitions>\n`;
const EXPECTED_EDITED_CONTENTS = `<?xml version="1.0"?>\n<definitions>${MARKER_TO}</definitions>\n`;

const FIXTURE_NAME = 'diagram.bpmn';
const SAVED_NAME = 'diagram.saved.bpmn';

module.exports = {
  MARKER_FROM,
  MARKER_TO,
  ORIGINAL_CONTENTS,
  EXPECTED_EDITED_CONTENTS,
  FIXTURE_NAME,
  SAVED_NAME
};
