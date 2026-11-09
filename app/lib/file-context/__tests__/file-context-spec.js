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


  describe('reset', function() {

    it('should remove all indexed items', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn');

      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      expectItemsLength(fileContext, 1);

      // when
      fileContext.reset();

      // then
      expectItemsLength(fileContext, 0);
    });


    it('should remove all roots', async function() {

      // given
      const directoryPath = path.resolve(__dirname, './tmp/foo-process-application');

      await waitForEvent(() => {
        fileContext.addRoot(directoryPath);
      }, 'watcher:ready');

      expectRootsLength(fileContext, 1);

      // when
      fileContext.reset();

      // then
      expectRootsLength(fileContext, 0);
      expectItemsLength(fileContext, 0);
    });


    it('should allow re-adding a file after reset', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/foo-process-application/foo.bpmn'),
            uri = toFileUrl(filePath);

      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      fileContext.reset();

      // when
      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      // then
      expectItemsLength(fileContext, 1);
      expect(getItem(fileContext, uri)).to.exist;
    });

  });


  describe('project resources', function() {

    it('should resolve file saved into project without file system event', async function() {

      // given
      fileContext.close();

      fileContext = new FileContext(console, { watch: false, processors: require('../processors') });

      waitForEvent = createWaitForEvent(fileContext);

      const projectPath = path.resolve(__dirname, './tmp/foo-process-application');

      const projectFileUri = toFileUrl(path.join(projectPath, '.process-application'));

      await waitForEvent(() => {
        fileContext.addFile(path.join(projectPath, '.process-application'));
      });

      const newPath = path.join(projectPath, 'new.bpmn');

      writeFile(newPath, fooXML);

      // when
      fileContext.fileOpened(toFileUrl(newPath));

      // then
      await waitFor(() => getItem(fileContext, projectFileUri).metadata.resources.selected.includes(newPath));
    });

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


    it('adding Camunda project root', async function() {

      // given
      const directoryPath = path.resolve(__dirname, './tmp/camunda-project');

      // when
      await waitForEvent(() => {
        fileContext.addRoot(directoryPath);
      }, 'watcher:ready');

      // then
      expectRootsLength(fileContext, 1);
      expectItemsLength(fileContext, 1);

      expect(getItem(fileContext, toFileUrl(path.resolve(directoryPath, 'camunda.json')))).to.exist;
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



    describe('project resources', function() {

      const projectPath = path.resolve(__dirname, './tmp/foo-process-application');

      const projectFileUri = toFileUrl(path.join(projectPath, '.process-application'));

      function getSelected() {
        const item = getItem(fileContext, projectFileUri);

        return item && item.metadata && item.metadata.resources.selected.map(
          filePath => path.relative(projectPath, filePath).split(path.sep).join('/')
        );
      }

      beforeEach(async function() {
        await waitForEvent(() => {
          fileContext.addRoot(projectPath);
        }, 'watcher:ready');

        await waitFor(() => getSelected());
      });


      it('should refresh live on file added (Desktop Modeler: "membership changes from file ... edits refresh the resource index")', async function() {

        // assume
        expect(getSelected()).to.eql([ 'bar/bar.bpmn', 'bar/baz/baz.dmn', 'bar/baz/baz.form', 'bar/baz/baz.rpa', 'foo.bpmn' ]);

        // when
        writeFile(path.join(projectPath, 'new.bpmn'), fooXML);

        // then
        await waitFor(() => getSelected().includes('new.bpmn'));
      });


      it('should refresh live on file removed', async function() {

        // when
        fs.unlinkSync(path.join(projectPath, 'foo.bpmn'));

        // then
        await waitFor(() => !getSelected().includes('foo.bpmn'));
      });


      it('should refresh live on file outside of default scan added (deployResources)', async function() {

        // given
        writeFile(path.join(projectPath, 'camunda.json'), JSON.stringify({ deployResources: [ '**/*.md' ] }));

        writeFile(path.join(projectPath, 'a.md'), 'a');

        const camundaJsonUri = toFileUrl(path.join(projectPath, 'camunda.json'));

        const getDeployResourcesSelected = () => {
          const item = getItem(fileContext, camundaJsonUri);

          return item && item.metadata && item.metadata.resources.selected.map(filePath => path.basename(filePath));
        };

        await waitFor(() => (getDeployResourcesSelected() || []).includes('a.md'));

        // when
        writeFile(path.join(projectPath, 'bar/b.md'), 'b');

        // then
        await waitFor(() => getDeployResourcesSelected().includes('b.md'));
      });


      it('should refresh live on .c8ignore change (Desktop Modeler: "... or descriptor edits refresh ...")', async function() {

        // when
        writeFile(path.join(projectPath, '.c8ignore'), 'bar/\n');

        // then
        await waitFor(() => getSelected().length === 1);

        expect(getSelected()).to.eql([ 'foo.bpmn' ]);

        // when
        writeFile(path.join(projectPath, '.c8ignore'), '*.bpmn\n');

        // then
        await waitFor(() => !getSelected().includes('foo.bpmn'));

        expect(getSelected()).to.eql([ 'bar/baz/baz.dmn', 'bar/baz/baz.form', 'bar/baz/baz.rpa' ]);
      });


      it('should index selected resources the watcher does not discover (node_modules, directory links)', async function() {

        // given
        const vendoredPath = path.join(projectPath, 'node_modules/pkg/vendored.bpmn');

        const outsidePath = path.resolve(__dirname, './tmp/outside');

        fs.mkdirSync(path.dirname(vendoredPath), { recursive: true });
        writeFile(vendoredPath, fooXML);

        fs.mkdirSync(outsidePath, { recursive: true });
        writeFile(path.join(outsidePath, 'linked.bpmn'), barXML);
        fs.symlinkSync(outsidePath, path.join(projectPath, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');

        const linkedPath = path.join(projectPath, 'linked/linked.bpmn');

        const camundaJsonPath = path.join(projectPath, 'camunda.json');

        // when
        writeFile(camundaJsonPath, JSON.stringify({ deployResources: [ 'foo.bpmn', 'node_modules/pkg/**', 'linked/**' ] }));

        // then
        await waitFor(() => getItem(fileContext, toFileUrl(vendoredPath)) && getItem(fileContext, toFileUrl(linkedPath)));

        expect(getItem(fileContext, toFileUrl(vendoredPath)).metadata.processes).to.have.length(1);

        // when
        writeFile(camundaJsonPath, JSON.stringify({ deployResources: [ 'foo.bpmn' ] }));

        // then
        await waitFor(() => !getItem(fileContext, toFileUrl(vendoredPath)) && !getItem(fileContext, toFileUrl(linkedPath)));

        // watched files stay indexed
        expect(getItem(fileContext, toFileUrl(path.join(projectPath, 'bar/bar.bpmn')))).to.exist;
      });


      it('should refresh live to an error on .c8ignore becoming unreadable', async function() {

        // when
        fs.mkdirSync(path.join(projectPath, '.c8ignore'));
        writeFile(path.join(projectPath, '.c8ignore/placeholder.txt'), '');

        // then
        await waitFor(() => getItem(fileContext, projectFileUri).metadata.resources.error);

        expect(getItem(fileContext, projectFileUri).metadata.resources).to.include({
          errorType: 'invalid-config'
        });
        expect(getSelected()).to.be.empty;
      });


      it('should refresh live on camunda.json change', async function() {

        // given
        const filePath = path.join(projectPath, 'camunda.json');

        const uri = toFileUrl(filePath);

        writeFile(filePath, JSON.stringify({ deployResources: [ 'foo.bpmn' ] }));

        await waitFor(() => getItem(fileContext, uri)?.metadata?.resources.selected.length === 1);

        // when
        writeFile(filePath, JSON.stringify({ deployResources: [ 'bar/bar.*' ] }));

        // then
        await waitFor(() => getItem(fileContext, uri).metadata.resources.selected.length === 2);

        expect(getItem(fileContext, uri).metadata.resources.selected).to.eql([
          path.join(projectPath, 'bar/bar.bpmn'),
          path.join(projectPath, 'bar/bar.txt')
        ]);

        // when
        writeFile(filePath, JSON.stringify({ deployResources: 'invalid' }));

        // then
        await waitFor(() => getItem(fileContext, uri).metadata.resources.error);

        expect(getItem(fileContext, uri).metadata.resources.error).to.match(/must be an array/);
      });

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


    it('Camunda project file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/camunda-project/camunda.json'),
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
        type: 'camundaProject',
        resources: {
          mode: 'c8ignore',
          selected: [],
          error: 'No deployable files found in the project.',
          errorType: 'empty-selection'
        }
      });
    });


    it('Camunda project file with deployResources', async function() {

      // given
      const projectPath = path.resolve(__dirname, './tmp/foo-process-application');

      const filePath = path.join(projectPath, 'camunda.json'),
            uri = toFileUrl(filePath);

      writeFile(filePath, JSON.stringify({ deployResources: [ 'bar/**', '!bar/baz/' ] }));

      // when
      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      // then
      const item = getItem(fileContext, uri);

      expect(item.metadata).to.eql({
        type: 'camundaProject',
        resources: {
          mode: 'deployResources',
          selected: [
            path.join(projectPath, 'bar/bar.bpmn'),
            path.join(projectPath, 'bar/bar.txt')
          ],
          error: null
        }
      });
    });


    it('legacy Camunda project file', async function() {

      // given
      const filePath = path.resolve(__dirname, './tmp/extensions/.process-application'),
            uri = toFileUrl(filePath);

      // when
      await waitForEvent(() => {
        fileContext.addFile(filePath);
      });

      // then
      const item = getItem(fileContext, uri);

      expect(item).to.exist;
      expect(item.metadata).to.include({
        type: 'camundaProject'
      });
      expect(item.metadata.resources).to.include({
        mode: 'c8ignore'
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
  return /** @type {Promise<void>} */(new Promise((resolve) => {

    // set up interval to check condition every 100ms and resolve once condition is met
    const interval = setInterval(() => {
      if (fn()) {
        clearInterval(interval);

        resolve();
      }
    }, 100);
  }));
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
  fs.rmSync(tmpPath, { recursive: true, force: true });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, contents) {
  fs.writeFileSync(filePath, contents, 'utf8');
}
