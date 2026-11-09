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
const sinon = require('sinon');
const os = require('os');
const path = require('path');

const FileContext = require('../file-context');

const camundaProjectProcessor = require('../processors/camundaProjectProcessor');

const { toFileUrl } = require('../util');


describe('FileContext - superseded processing', function() {

  let tmpPath;

  beforeEach(function() {
    tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'file-context-supersede-'));
  });

  afterEach(function() {
    fs.rmSync(tmpPath, { recursive: true, force: true });
  });


  it('should not let an outdated result override a newer one', async function() {

    // given
    const filePath = path.join(tmpPath, 'foo.slow');

    fs.writeFileSync(filePath, 'foo');

    const pending = [];

    const processor = {
      id: 'slow',
      extensions: [ '.slow' ],
      process: () => new Promise(resolve => pending.push(resolve))
    };

    const fileContext = new FileContext(console, { watch: false, processors: [ processor ] });

    // when
    const first = fileContext.addFile(filePath);
    const second = fileContext.addFile(filePath);

    await waitFor(() => pending.length === 2);

    // newer processing completes first, the outdated one after
    pending[1]({ result: 'new' });
    await second;

    pending[0]({ result: 'old' });
    await first;

    // then
    expect(fileContext._indexer.items.get(toFileUrl(filePath)).metadata).to.eql({ result: 'new' });
  });


  it('should not let an outdated failure override a newer result', async function() {

    // given
    const filePath = path.join(tmpPath, 'foo.slow');

    fs.writeFileSync(filePath, 'foo');

    const pending = [];

    const processor = {
      id: 'slow',
      extensions: [ '.slow' ],
      process: () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
    };

    const fileContext = new FileContext(console, { watch: false, processors: [ processor ] });

    // when
    const first = fileContext.addFile(filePath);
    const second = fileContext.addFile(filePath);

    await waitFor(() => pending.length === 2);

    pending[1].resolve({ result: 'new' });
    await second;

    pending[0].reject(new Error('outdated'));
    await first.catch(() => {});

    // then
    const item = fileContext._indexer.items.get(toFileUrl(filePath));

    expect(item.metadata).to.eql({ result: 'new' });
    expect(item.file.messages).to.be.empty;
  });


  it('should supersede in-flight project resolution (camunda.json)', async function() {

    // given
    const projectFilePath = path.join(tmpPath, 'camunda.json');

    fs.writeFileSync(projectFilePath, '{}');
    fs.writeFileSync(path.join(tmpPath, 'a.bpmn'), 'a');

    const item = { file: { path: projectFilePath } };

    // when
    const first = camundaProjectProcessor.process(item);
    const second = camundaProjectProcessor.process(item);

    // then
    let error;

    try {
      await first;
    } catch (err) {
      error = err;
    }

    expect(error, 'outdated resolution aborted').to.exist;
    expect(error.name).to.eql('AbortError');

    expect((await second).resources.selected).to.eql([ path.join(tmpPath, 'a.bpmn') ]);
  });

});


describe('FileContext - reset and project removal', function() {

  let tmpPath, fileContext;

  beforeEach(function() {
    tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'file-context-reset-'));

    fileContext = new FileContext(quietLogger(), { watch: false, processors: require('../processors') });
  });

  afterEach(async function() {
    await fileContext.close();

    fs.rmSync(tmpPath, { recursive: true, force: true });
  });

  function createProject(count) {
    for (let index = 0; index < count; index++) {
      writeFile(path.join(tmpPath, `resources/${ index % 10 }/${ index }.bpmn`), '');
    }

    const projectFilePath = path.join(tmpPath, 'camunda.json');

    writeFile(projectFilePath, JSON.stringify({ deployResources: [ 'resources/**' ] }));

    return projectFilePath;
  }


  it('should not index project resources after reset (reset during paused indexing pass)', async function() {

    // given
    // more selected resources than indexed before yielding to the event loop
    const projectFilePath = createProject(2100);

    let resetDone = false;

    fileContext.on('indexer:updated', (item) => {
      if (!resetDone && item.metadata && item.metadata.resources) {
        resetDone = true;

        // the indexing pass is paused at this point
        fileContext.reset();
      }
    });

    // when
    await fileContext.addFile(projectFilePath);

    await waitFor(() => resetDone);

    await settle();

    // then
    expect(fileContext._indexer.getItems()).to.be.empty;
  });


  it('should not report project resolved after reset (reset during in-flight resolution)', async function() {

    // given
    const projectFilePath = createProject(10);

    const updatedSpy = sinon.spy();

    // when
    const added = fileContext.addFile(projectFilePath);

    fileContext.reset();

    fileContext.on('indexer:updated', updatedSpy);

    await added.catch(() => {});

    await settle();

    // then
    expect(updatedSpy).not.to.have.been.called;
    expect(fileContext._indexer.getItems()).to.be.empty;
  });


  it('should not re-resolve projects after reset (pending refresh)', async function() {

    // given
    const refreshSpy = sinon.spy(fileContext, '_refreshProjects');

    fileContext.emit('watcher:fs-change', toFileUrl(path.join(tmpPath, 'a.bpmn')));

    // when
    fileContext.reset();

    await new Promise(resolve => setTimeout(resolve, 400));

    // then
    expect(refreshSpy).not.to.have.been.called;
  });


  it('should stop indexing resources of a removed project', async function() {

    // given
    const projectFilePath = createProject(5);

    await fileContext.addFile(projectFilePath);

    await waitFor(() => fileContext._indexer.getItems().length === 6);

    // when
    fileContext.removeFile(projectFilePath);

    // then
    expect(fileContext._indexer.getItems()).to.be.empty;
  });

});


describe('FileContext - project error state', function() {

  let tmpPath, fileContext, projectFilePath, vendoredPath, linkedPath, outsidePath;

  beforeEach(async function() {
    tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'file-context-error-'));
    outsidePath = fs.mkdtempSync(path.join(os.tmpdir(), 'file-context-error-outside-'));

    fileContext = new FileContext(quietLogger(), { watch: false, processors: require('../processors') });

    // diagrams the watcher does not discover, indexed explicitly
    vendoredPath = path.join(tmpPath, 'node_modules/pkg/vendored.bpmn');
    writeFile(vendoredPath, '');

    writeFile(path.join(outsidePath, 'linked.bpmn'), '');
    fs.symlinkSync(outsidePath, path.join(tmpPath, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    linkedPath = path.join(tmpPath, 'linked/linked.bpmn');

    writeFile(path.join(tmpPath, 'main.bpmn'), '');

    projectFilePath = path.join(tmpPath, 'camunda.json');

    writeFile(projectFilePath, JSON.stringify({ deployResources: [ 'main.bpmn', 'node_modules/pkg/**', 'linked/**' ] }));

    await fileContext.addFile(projectFilePath);

    await waitFor(() => getItem(vendoredPath) && getItem(linkedPath));

    // configuration becomes invalid
    writeFile(projectFilePath, JSON.stringify({ deployResources: 42 }));

    await fileContext.addFile(projectFilePath);
  });

  afterEach(async function() {
    await fileContext.close();

    fs.rmSync(tmpPath, { recursive: true, force: true });
    fs.rmSync(outsidePath, { recursive: true, force: true });
  });

  function getItem(filePath) {
    return fileContext._indexer.items.get(toFileUrl(filePath));
  }

  function expectError() {
    const { resources } = getItem(projectFilePath).metadata;

    expect(resources.errorType).to.eql('invalid-config');
    expect(resources.error).to.match(/must be an array/);
    expect(resources.selected).to.be.empty;
  }


  it('should keep error, dropping explicitly indexed resources', async function() {

    // when
    await settle();

    // then
    expectError();

    expect(getItem(vendoredPath)).not.to.exist;
    expect(getItem(linkedPath)).not.to.exist;
  });


  it('should keep error when re-indexing files below node_modules or behind directory links (e.g. opened)', async function() {

    // when
    await fileContext.fileOpened(toFileUrl(vendoredPath));
    await fileContext.fileOpened(toFileUrl(linkedPath));

    await settle();

    // then
    expectError();
  });


  it('should keep error on explicit indexing pass', async function() {

    // when
    await fileContext._indexProjectResources();

    await settle();

    // then
    expectError();
  });


  it('should keep error on re-resolution', async function() {

    // when
    await fileContext.addFile(projectFilePath);

    fileContext.emit('watcher:fs-change', toFileUrl(path.join(tmpPath, 'other.bpmn')));

    await new Promise(resolve => setTimeout(resolve, 400));

    // then
    expectError();
  });


  it('should not let an outdated successful resolution override a newer error', async function() {

    // given
    writeFile(projectFilePath, JSON.stringify({ deployResources: [ 'main.bpmn', 'node_modules/pkg/**', 'linked/**' ] }));

    const outdated = fileContext.addFile(projectFilePath);

    // when
    writeFile(projectFilePath, JSON.stringify({ deployResources: 42 }));

    const latest = fileContext.addFile(projectFilePath);

    await Promise.all([ outdated, latest ].map(promise => promise.catch(() => {})));

    await settle();

    // then
    expectError();
  });


  it('should not let a delayed outdated success override a newer error (nor index its resources)', async function() {

    // given
    const pending = [];

    const processor = {
      id: 'camundaProject',
      extensions: [],
      fileNames: [ 'camunda.json' ],
      process: () => new Promise(resolve => pending.push(resolve))
    };

    const otherContext = new FileContext(quietLogger(), { watch: false, processors: [ processor, ...require('../processors').filter(p => p.id !== 'camundaProject') ] });

    try {
      const outdated = otherContext.addFile(projectFilePath);
      const latest = otherContext.addFile(projectFilePath);

      await waitFor(() => pending.length === 2);

      // when
      // newer resolution fails, the outdated success arrives after it
      pending[1]({
        type: 'camundaProject',
        resources: { mode: 'deployResources', selected: [], error: 'invalid', errorType: 'invalid-config' }
      });
      await latest;

      pending[0]({
        type: 'camundaProject',
        resources: { mode: 'deployResources', selected: [ vendoredPath, linkedPath ], error: null }
      });
      await outdated;

      await settle();

      // then
      const items = otherContext._indexer.items;

      expect(items.get(toFileUrl(projectFilePath)).metadata.resources.errorType).to.eql('invalid-config');
      expect(items.get(toFileUrl(vendoredPath))).not.to.exist;
      expect(items.get(toFileUrl(linkedPath))).not.to.exist;
    } finally {
      await otherContext.close();
    }
  });


  it('should replace error with newer successful resolution', async function() {

    // when
    writeFile(projectFilePath, JSON.stringify({ deployResources: [ 'main.bpmn', 'node_modules/pkg/**' ] }));

    await fileContext.addFile(projectFilePath);

    await waitFor(() => getItem(vendoredPath));

    // then
    expect(getItem(projectFilePath).metadata.resources.error).to.be.null;
  });

});


function quietLogger() {
  return { info() {}, warn() {}, error() {} };
}

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

/**
 * Let pending work (yields, timers of the debounced refresh) run.
 */
function settle() {
  return new Promise(resolve => setTimeout(resolve, 100));
}

function waitFor(fn) {
  return new Promise(resolve => {
    const check = () => (fn() ? resolve() : setImmediate(check));

    check();
  });
}
