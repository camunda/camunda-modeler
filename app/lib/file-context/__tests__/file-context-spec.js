/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const path = require('path');

const FileContext = require('../file-context');

const { toFileUrl } = require('../util');

describe('FileContext', function() {

  let fileContext, waitFor;

  beforeEach(function() {
    fileContext = new FileContext(console);

    waitFor = createWaitFor(fileContext);
  });

  afterEach(function() {
    return fileContext.close();
  });


  it('should watch by default', function() {

    // then
    expect(fileContext._watcher).to.exist;
  });


  it('adding file', async function() {

    // given
    const filePath = path.resolve(__dirname, './fixtures/foo-process-application/foo.bpmn');

    // when
    await waitFor(() => {
      fileContext.addFile(filePath);
    });

    // then
    expectItems(fileContext, [
      {
        uri: toFileUrl(path.resolve(__dirname, './fixtures/foo-process-application/foo.bpmn')),
        localValue: undefined
      }
    ]);
  });


  it('adding file with local value', async function() {

    // given
    const filePath = path.resolve(__dirname, './fixtures/foo-process-application/foo.bpmn');

    // when
    await waitFor(() => {
      fileContext.addFile(filePath, 'foo');
    });

    // then
    expectItems(fileContext, [
      {
        uri: toFileUrl(path.resolve(__dirname, './fixtures/foo-process-application/foo.bpmn')),
        localValue: 'foo'
      }
    ]);
  });


  it('removing file', async function() {

    // given
    const filePath = path.resolve(__dirname, './fixtures/foo-process-application/foo.bpmn');

    // when
    await waitFor(() => {
      fileContext.addFile(filePath);
    });

    // then
    expectItems(fileContext, [
      {
        uri: toFileUrl(path.resolve(__dirname, './fixtures/foo-process-application/foo.bpmn')),
        localValue: undefined
      }
    ]);

    // when
    fileContext.removeFile(filePath);

    // then
    expectItems(fileContext, []);
  });


  it('adding root', async function() {

    // given
    const directoryPath = path.resolve(__dirname, './fixtures/foo-process-application');

    // when
    await waitFor(() => {
      fileContext.addRoot(directoryPath);
    }, 'watcher:ready');

    // then
    expect(fileContext._indexer.getRoots()).to.have.length(1);

    expectItems(fileContext, [
      {
        uri: toFileUrl(path.resolve(__dirname, './fixtures/foo-process-application/.process-application'))
      },
      {
        uri: toFileUrl(path.resolve(__dirname, './fixtures/foo-process-application/foo.bpmn'))
      },
      {
        uri: toFileUrl(path.resolve(__dirname, './fixtures/foo-process-application/bar/bar.bpmn'))
      },
      {
        uri: toFileUrl(path.resolve(__dirname, './fixtures/foo-process-application/bar/baz/baz.dmn'))
      },
      {
        uri: toFileUrl(path.resolve(__dirname, './fixtures/foo-process-application/bar/baz/baz.form'))
      }
    ]);
  });


  it('removing root', async function() {

    // given
    const directoryPath = path.resolve(__dirname, './fixtures/foo-process-application');

    // when
    await waitFor(() => {
      fileContext.addRoot(directoryPath);
    }, 'watcher:ready');

    // then
    expect(fileContext._indexer.getRoots()).to.have.length(1);
    expect(fileContext._indexer.getItems()).to.have.length(5);

    // when
    fileContext.removeRoot(directoryPath);

    // then
    expect(fileContext._indexer.getRoots()).to.have.length(0);
    expect(fileContext._indexer.getItems()).to.have.length(5);
  });

});

function createWaitFor(fileContext) {
  return function waitFor(fn, event = 'workqueue:empty') {
    return new Promise((resolve) => {
      fileContext.on(event, resolve);

      fn();
    });
  };
}

function expectItems(fileContext, expected) {
  const items = fileContext._indexer.getItems();

  console.log('items', items.map(({ uri }) => uri));

  expect(items).to.have.length(expected.length);

  expected.forEach((expectedItem, index) => {
    const item = items[ index ];

    expect(item).to.include(expectedItem);
  });
}