/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';

import sinon from 'sinon';

import FeelPlayground, { MAX_CONTEXT_SIZE } from '../FeelPlayground';


const FILE = { path: '/tmp/diagram.bpmn' };


describe('FeelPlayground', function() {

  it('should restore context for file', async function() {

    // given
    const config = createConfig({
      version: 1,
      contexts: {
        'Task_1#expression': '{ "amount": 42 }'
      }
    });
    const feelPlayground = new FeelPlayground(config);

    // when
    await feelPlayground.setFile(FILE);

    // then
    expect(feelPlayground.getContext('Task_1#expression')).to.equal('{ "amount": 42 }');
  });


  it('should not write back restored contexts', async function() {

    // given
    const config = createConfig({
      version: 1,
      contexts: {
        'Task_1#expression': '{ "amount": 42 }'
      }
    });
    const feelPlayground = new FeelPlayground(config);

    // when
    await feelPlayground.setFile(FILE);

    // then
    expect(config.setForFile).not.to.have.been.called;
  });


  it('should ignore persisted contexts of unsupported version', async function() {

    // given
    const config = createConfig({
      version: 2,
      contexts: {
        'Task_1#expression': '{ "amount": 42 }'
      }
    });
    const feelPlayground = new FeelPlayground(config);

    // when
    await feelPlayground.setFile(FILE);

    // then
    expect(feelPlayground.getContext('Task_1#expression')).not.to.exist;
  });


  it('should persist context for file', async function() {

    // given
    const config = createConfig();
    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile(FILE);

    feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }');

    // when
    await feelPlayground.saveContexts();

    // then
    expect(config.setForFile).to.have.been.calledOnce;
    expect(config.setForFile.firstCall.args[0]).to.equal(FILE);
    expect(config.setForFile.firstCall.args[1]).to.equal('feelPlayground');
    expect(config.setForFile.firstCall.args[2]).to.eql({
      version: 1,
      contexts: {
        'Task_1#expression': '{ "amount": 42 }'
      }
    });
  });


  it('should not persist while editing', async function() {

    // given
    const config = createConfig();
    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile(FILE);

    // when
    feelPlayground.setContext('Task_1#expression', '{ "amount": 4');
    feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }');

    // then
    expect(config.setForFile).not.to.have.been.called;
  });


  it('should not persist unchanged contexts twice', async function() {

    // given
    const config = createConfig();
    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile(FILE);

    feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }');
    await feelPlayground.saveContexts();

    // when
    await feelPlayground.saveContexts();

    // then
    expect(config.setForFile).to.have.been.calledOnce;
  });


  it('should prefer context changed while restoring', async function() {

    // given
    let resolveConfig;
    const config = createConfig(new Promise(resolve => {
      resolveConfig = resolve;
    }));
    const feelPlayground = new FeelPlayground(config);
    const restoring = feelPlayground.setFile(FILE);

    // when
    feelPlayground.setContext('Task_1#expression', '{ "local": true }');
    resolveConfig({
      version: 1,
      contexts: {
        'Task_1#expression': '{ "persisted": true }'
      }
    });
    await restoring;

    // then
    expect(feelPlayground.getContext('Task_1#expression')).to.equal('{ "local": true }');
  });


  it('should keep unsaved context in memory', async function() {

    // given
    const config = createConfig();
    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile({});

    // when
    feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }');
    await feelPlayground.saveContexts();

    // then
    expect(feelPlayground.getContext('Task_1#expression')).to.equal('{ "amount": 42 }');
    expect(config.setForFile).not.to.have.been.called;
  });


  it('should persist unsaved context after first save', async function() {

    // given
    const config = createConfig();
    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile({});
    feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }');

    // when
    await feelPlayground.setFile(FILE);

    // then
    expect(config.setForFile).to.have.been.calledOnce;
    expect(config.setForFile.firstCall.args[2].contexts).to.eql({
      'Task_1#expression': '{ "amount": 42 }'
    });
  });


  it('should not persist oversized context', async function() {

    // given
    const config = createConfig();
    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile(FILE);

    feelPlayground.setContext('Task_1#expression', 'x'.repeat(MAX_CONTEXT_SIZE + 1));

    // when
    await feelPlayground.saveContexts();

    // then
    expect(feelPlayground.getContext('Task_1#expression')).to.have.length(MAX_CONTEXT_SIZE + 1);
    expect(config.setForFile.firstCall.args[2].contexts).to.be.empty;
  });


  it('should persist context changed while saving', async function() {

    // given
    let finishSave;

    const config = createConfig();

    config.setForFile.onFirstCall().returns(new Promise(resolve => {
      finishSave = resolve;
    }));

    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile(FILE);

    feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }');

    const saving = feelPlayground.saveContexts();

    // when
    feelPlayground.setContext('Task_1#expression', '{ "amount": 43 }');

    finishSave();
    await saving;

    await feelPlayground.saveContexts();

    // then
    expect(config.setForFile).to.have.been.calledTwice;
    expect(config.setForFile.secondCall.args[2].contexts).to.eql({
      'Task_1#expression': '{ "amount": 43 }'
    });
  });


  it('should not fail if persisting fails', async function() {

    // given
    const config = createConfig();
    config.setForFile.rejects(new Error('nope'));

    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile(FILE);

    feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }');

    // when
    await feelPlayground.saveContexts();

    // then
    expect(feelPlayground.getContext('Task_1#expression')).to.equal('{ "amount": 42 }');
  });


  it('should retry persisting after failure', async function() {

    // given
    const config = createConfig();
    config.setForFile.onFirstCall().rejects(new Error('nope'));

    const feelPlayground = new FeelPlayground(config);
    await feelPlayground.setFile(FILE);

    feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }');
    await feelPlayground.saveContexts();

    // when
    await feelPlayground.saveContexts();

    // then
    expect(config.setForFile).to.have.been.calledTwice;
  });

});


function createConfig(value = null) {
  return {
    getForFile: sinon.stub().resolves(value),
    setForFile: sinon.stub().resolves()
  };
}
