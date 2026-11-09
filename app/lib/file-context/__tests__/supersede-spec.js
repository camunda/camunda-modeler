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
