/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Remotes from './mocks/Remotes';

describe('integration', function() {

  it('should reimport after external change', async function() {

    // given
    const remotes = new Remotes();

    const globals = remotes.getGlobals();

    const {
      dialog,
      fileSystem
    } = globals;

    const { app } = createApp({
      globals
    });

    const file1 = createFile('1.bpmn', 'foo', 'foo', 0),
          file2 = createFile('2.bpmn', 'foobar');

    remotes.stub([
      [ fileSystem, 'readFileStats', fileStatsResponse({ lastModified: 100 }) ],
      [ dialog, 'showDialog', showDialogResponse('ok') ],
      [ fileSystem, 'readFile', readFileResponse({ contents: 'bar' }) ]
    ]);

    // when
    const openedTabs = await app.openFiles([ file1, file2 ]);

    // then
    remotes.expectAndReset();
  });

});


function fileStatsResponse() {}

function showDialogResponse(response) {
  return async function() {
    Promise.resolve(response);
  };
}

function readFileResponse() {}

function createApp() {}
function createFile() {}