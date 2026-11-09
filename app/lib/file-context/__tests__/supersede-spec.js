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


function waitFor(fn) {
  return new Promise(resolve => {
    const check = () => (fn() ? resolve() : setImmediate(check));

    check();
  });
}
