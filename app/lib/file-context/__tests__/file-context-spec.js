/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const path = require('path');

const FileContext = require('../file-context');

const { toFileUrl } = require('../util');

const { isDefined, omit } = require('min-dash');

const fooXML = readFile(path.resolve(__dirname, './fixtures/foo-process-application/foo.bpmn')),
      barXML = readFile(path.resolve(__dirname, './fixtures/foo-process-application/bar/bar.bpmn'));

const fixturesPath = path.resolve(__dirname, './fixtures');
const tmpPath = path.resolve(__dirname, './tmp');

describe('FileContext', function() {

  let fileContext,
      waitForEvent;

  beforeEach(function() {
    copyFiles(fixturesPath, tmpPath);

    fileContext = new FileContext(console);

    waitForEvent = createWaitForEvent(fileContext);
  });

  afterEach(function() {
    fileContext.close();

    deleteDirectory(tmpPath);
  });


  it('adding file', async function() {

    // given
    const filePath = path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn'),
          uri = toFileUrl(filePath);

    // when
    await waitForEvent(() => {
      fileContext.addFile(filePath);
    });

    // then
    expectItemsLength(fileContext, 1);

    const item = getItem(fileContext, uri);

    expect(item).to.exist;

    expect(item.uri).to.eql(uri);
    expect(item.file).to.exist;
    expect(item.file.contents).to.equal(fooXML);
    expect(item.metadata).to.exist;

    expectNoMessages(item);
  });


  it('adding file with explicit processor', async function() {

    // given
    const filePath = path.resolve(__dirname, './tmp/extensions/bpmn.unrecognized'),
          uri = toFileUrl(filePath);

    // when
    await waitForEvent(() => {
      fileContext.addFile(filePath, {
        processor: 'bpmn'
      });
    });

    // then
    expectItemsLength(fileContext, 1);

    const item = getItem(fileContext, uri);

    expect(item).to.exist;

    expect(item.uri).to.eql(uri);
    expect(item.file).to.exist;
    expect(item.file.contents).to.equal(fooXML);
    expect(item.metadata).to.exist;
    expect(item.metadata).eql({
      type: 'bpmn',
      processes: [
        {
          id: 'FooProcess',
          name: 'FooProcess'
        }
      ],
      linkedIds: [
        {
          type: 'bpmn',
          elementId: 'CallActivity_1',
          linkedId: 'BarProcess'
        }
      ]
    });
    expect(item.processor).to.eql('bpmn');

    expectNoMessages(item);
  });


  it('updating file', async function() {

    // given
    const filePath = path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn'),
          uri = toFileUrl(filePath);

    // when
    await waitForEvent(() => {
      fileContext.addFile(filePath);
    });

    // then
    expectItemsLength(fileContext, 1);

    let item = getItem(fileContext, uri);

    expect(item).to.exist;

    expect(item.uri).to.eql(uri);
    expect(item.file).to.exist;
    expect(item.file.contents).to.equal(fooXML);

    expectNoMessages(item);

    // when
    writeFile(filePath, barXML);

    await waitForEvent(() => {

      // without watcher we need to trigger fileUpdated manually
      fileContext.fileUpdated(uri);
    });

    // then
    item = getItem(fileContext, uri);

    expect(item).to.exist;

    expect(item.uri).to.eql(uri);
    expect(item.file).to.exist;
    expect(item.file.contents).to.equal(barXML);

    expectNoMessages(item);
  });


  it('removing file', async function() {

    // given
    const filePath = path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn');

    // when
    await waitForEvent(() => {
      fileContext.addFile(filePath);
    });

    // then
    expectItemsLength(fileContext, 1);

    // when
    fileContext.removeFile(filePath);

    // then
    expectItemsLength(fileContext, 0);
  });


  describe('watching', function() {

    it('should watch by default', function() {

      // then
      expect(fileContext._watcher).to.exist;
    });


    it('adding root', async function() {

      // given
      const directoryPath = path.resolve(__dirname, './tmp/foo-process-application');

      // when
      await waitForEvent(() => {
        fileContext.addRoot(directoryPath);
      }, 'watcher:ready');

      // then
      expectRootsLength(fileContext, 1);

      expectItemsLength(fileContext, 6);

      expect(getItem(fileContext, toFileUrl(path.resolve(__dirname, './tmp/foo-process-application/.process-application')))).to.exist;
      expect(getItem(fileContext, toFileUrl(path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn')))).to.exist;
      expect(getItem(fileContext, toFileUrl(path.resolve(__dirname, './tmp/foo-process-application/bar/bar.bpmn')))).to.exist;
      expect(getItem(fileContext, toFileUrl(path.resolve(__dirname, './tmp/foo-process-application/bar/baz/baz.dmn')))).to.exist;
      expect(getItem(fileContext, toFileUrl(path.resolve(__dirname, './tmp/foo-process-application/bar/baz/baz.form')))).to.exist;
      expect(getItem(fileContext, toFileUrl(path.resolve(__dirname, './tmp/foo-process-application/bar/baz/baz.rpa')))).to.exist;
    });


    it('removing root', async function() {

      // given
      const directoryPath = path.resolve(__dirname, './tmp/foo-process-application');

      // when
      await waitForEvent(() => {
        fileContext.addRoot(directoryPath);
      }, 'watcher:ready');

      // then
      expectRootsLength(fileContext, 1);
      expectItemsLength(fileContext, 6);

      // when
      fileContext.removeRoot(directoryPath);

      // then
      expectRootsLength(fileContext, 0);
      expectItemsLength(fileContext, 6);
    });


    it('adding file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/new.bpmn'),
            uri = toFileUrl(filePath);

      const directoryPath = path.resolve(__dirname, './tmp/foo-process-application');

      await waitForEvent(() => {
        fileContext.addRoot(directoryPath);
      }, 'watcher:ready');

      // when
      writeFile(filePath, fooXML);

      await waitFor(() => {
        return isDefined(getItem(fileContext, uri));
      });

      // then
      expect(getItem(fileContext, uri)).to.exist;
    });


    it('updating file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn'),
            uri = toFileUrl(filePath);

      const directoryPath = path.resolve(__dirname, './tmp/foo-process-application');

      // when
      await waitForEvent(() => {
        fileContext.addRoot(directoryPath);
      }, 'watcher:ready');

      // then
      let item = getItem(fileContext, uri);

      expect(item).to.exist;

      expect(item.uri).to.eql(uri);
      expect(item.file).to.exist;
      expect(item.file.contents).to.equal(fooXML);

      expectNoMessages(item);

      // when
      writeFile(filePath, barXML);

      await waitFor(() => {

        // with watcher we don't need to trigger fileUpdated manually
        return getItem(fileContext, uri).file.contents === barXML;
      });

      // then
      item = getItem(fileContext, uri);

      expect(item).to.exist;

      expect(item.uri).to.eql(uri);
      expect(item.file).to.exist;
      expect(item.file.contents).to.equal(barXML);

      expectNoMessages(item);
    });


    it('removing file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn');

      const directoryPath = path.resolve(__dirname, './tmp/foo-process-application');

      // when
      await waitForEvent(() => {
        fileContext.addRoot(directoryPath);
      }, 'watcher:ready');

      // then
      expect(getItem(fileContext, toFileUrl(filePath))).to.exist;

      // when
      fileContext.removeFile(filePath);

      // then
      expect(getItem(fileContext, toFileUrl(filePath))).not.to.exist;
    });

  });


  describe('error handling', function() {

    it('should NOT throw for unrecognized extension', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/extensions/bpmn.unrecognized');

      // when
      const item = await fileContext.addFile(filePath);

      // then
      expect(item).to.exist;
      expect(item.metadata).to.be.null;

      expectMessages(item, [
        {
          error: true,
          message: /No processor found/,
          source: 'process-error'
        }
      ]);
    });


    it('should NOT throw for no extension', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/extensions/no-extension');

      // when
      const item = await fileContext.addFile(filePath);

      // then
      expect(item).to.exist;
      expect(item.metadata).to.be.null;

      expectMessages(item, [
        {
          error: true,
          message: /No processor found/,
          source: 'process-error'
        }
      ]);
    });


    it('should NOT throw for empty BPMN', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/broken-files/empty.bpmn');

      // when
      const item = await fileContext.addFile(filePath);

      // then
      expect(item).to.exist;
      expect(item.metadata).to.eql({
        type: 'bpmn',
        processes: [],
        linkedIds: []
      });

      expectNoMessages(item);
    });


    it('should NOT throw for empty DMN', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/broken-files/empty.dmn');

      // when
      const item = await fileContext.addFile(filePath);

      // then
      expect(item).to.exist;
      expect(item.metadata).to.eql({
        type: 'dmn',
        decisions: [],
        linkedIds: []
      });

      expectNoMessages(item);
    });


    it('should NOT throw for empty form', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/broken-files/empty.form');

      // when
      const item = await fileContext.addFile(filePath);

      // then
      expect(item).to.exist;
      expect(item.metadata).to.eql({
        type: 'form',
        forms: [],
        linkedIds: []
      });

      expectNoMessages(item);
    });


    it('should NOT throw for null form', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/broken-files/form-null.form');

      // when
      const item = await fileContext.addFile(filePath);

      // then
      expect(item).to.exist;
      expect(item.metadata).be.null;

      expectMessages(item, [
        {
          error: true,
          message: /Failed to parse form file: Cannot/,
          source: 'process-error'
        }
      ]);
    });


    it('should NOT throw for empty RPA script', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/broken-files/empty.rpa');

      // when
      const item = await fileContext.addFile(filePath);

      // then
      expect(item).to.exist;
      expect(item.metadata).to.eql({
        type: 'rpa',
        scripts: [],
        linkedIds: []
      });

      expectNoMessages(item);
    });

  });


  describe('symlinks', function() {

    it('should not follow symlinks', async function() {

      // given
      const directoryPath = path.resolve(__dirname, './tmp/symlink');

      // when
      await waitForEvent(() => {
        fileContext.addRoot(directoryPath);
      }, 'watcher:ready');

      // then
      expectRootsLength(fileContext, 1);
      expectItemsLength(fileContext, 2);

      expect(getItem(fileContext, toFileUrl(path.resolve(__dirname, './tmp/symlink/.process-application')))).to.exist;
      expect(getItem(fileContext, toFileUrl(path.resolve(__dirname, './tmp/symlink/bar/empty.bpmn')))).to.exist;
    });
  });


  describe('processing', function() {

    it('BPMN file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn'),
            uri = toFileUrl(filePath);

      // when
      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      // then
      expectItemsLength(fileContext, 1);

      const item = getItem(fileContext, uri);

      expect(item).to.exist;

      expect(item.metadata).to.eql({
        'processes': [
          {
            'id': 'FooProcess',
            'name': 'FooProcess'
          }
        ],
        'linkedIds': [
          {
            'elementId': 'CallActivity_1',
            'linkedId': 'BarProcess',
            'type': 'bpmn'
          }
        ],
        'type': 'bpmn'
      });
    });


    it('DMN file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/bar/baz/baz.dmn'),
            uri = toFileUrl(filePath);

      // when
      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      // then
      expectItemsLength(fileContext, 1);

      const item = getItem(fileContext, uri);

      expect(item).to.exist;

      expect(item.metadata).to.eql({
        'decisions': [
          {
            'id': 'BarDecision',
            'name': 'BarDecision'
          },
          {
            'id': 'BazDecision',
            'name': 'BazDecision'
          },
          {
            'id': 'FooDecision',
            'name': 'FooDecision'
          },
        ],
        'linkedIds': [],
        'type': 'dmn'
      });
    });


    it('form file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/bar/baz/baz.form'),
            uri = toFileUrl(filePath);

      // when
      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      // then
      expectItemsLength(fileContext, 1);

      const item = getItem(fileContext, uri);

      expect(item).to.exist;

      expect(item.metadata).to.eql({
        'forms': [
          {
            'id': 'BazForm',
            'name': 'BazForm'
          }
        ],
        'linkedIds': [],
        'type': 'form'
      });
    });


    it('process application file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/.process-application'),
            uri = toFileUrl(filePath);

      // when
      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      // then
      expectItemsLength(fileContext, 1);

      const item = getItem(fileContext, uri);

      expect(item).to.exist;

      expect(item.metadata).to.eql({
        'type': 'processApplication'
      });
    });


    it('rpa file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/bar/baz/baz.rpa'),
            uri = toFileUrl(filePath);

      // when
      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      // then
      expectItemsLength(fileContext, 1);

      const item = getItem(fileContext, uri);

      expect(item).to.exist;

      expect(item.metadata).to.eql({
        'scripts': [
          {
            'id': 'RPAScript',
            'name': 'NamedScript'
          }
        ],
        'linkedIds': [],
        'type': 'rpa'
      });
    });

  });

});

function createWaitForEvent(fileContext) {
  return function waitForEvent(fn, event = 'workqueue:empty') {
    return new Promise((resolve) => {
      fileContext.on(event, resolve);

      fn();
    });
  };
}

function waitFor(fn) {
  return new Promise((resolve) => {

    // set up interval to check condition every 100ms and resolve once condition is met
    const interval = setInterval(() => {
      if (fn()) {
        clearInterval(interval);

        resolve();
      }
    }, 100);
  });
};

function expectRootsLength(fileContext, length) {
  expect(fileContext._indexer.getRoots()).to.have.length(length);
}

function expectItemsLength(fileContext, length) {
  expect(fileContext._indexer.getItems()).to.have.length(length);
}

function getItem(fileContext, uri) {
  return fileContext._indexer.items.get(uri);
}

function expectMessages(item, messages) {
  expect(item.file.messages).to.have.length(messages.length);

  messages.forEach((message, index) => {
    const itemMessage = item.file.messages[ index ];

    expect(itemMessage).to.include(omit(message, 'message'));

    expect(itemMessage.message).to.match(message.message);
  });
}

function expectNoMessages(item) {
  expect(item.file.messages).to.have.length(0);
}

function copyFiles(fixturesPath, tmpPath) {
  fs.mkdirSync(tmpPath, { recursive: true });

  fs.cpSync(fixturesPath, tmpPath, {
    recursive: true,
    dereference: true,
    filter: (src, dest) => {
      const stats = fs.lstatSync(src);

      return !stats.isSymbolicLink();
    }
  });
}

function deleteDirectory(tmpPath) {
  fs.rmdirSync(tmpPath, { recursive: true });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, contents) {
  fs.writeFileSync(filePath, contents, 'utf8');
}
