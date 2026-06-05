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

const { bootIndex, invoke, invokeSync } = require('./harness');


/**
 * Behavioral characterization of the REAL request-response / sync / push
 * handlers, driven through controlled service doubles.
 *
 * These assertions are the per-event behavioral oracle a Rust/Tauri backend
 * must satisfy: argument shapes, defaulting, path -> file-url conversion, the
 * `done`-popping convention, option pass-through, and the success/error
 * envelope content (independent of the wire serialization, which is covered by
 * renderer-protocol-spec.js).
 */
describe('ipc-contract - handler behavior', function() {

  let boot;

  beforeEach(function() {
    boot = bootIndex();
  });


  describe('filesystem', function() {

    it('file:read should delegate to file-system#readFile and resolve the file', async function() {

      // given
      const file = { path: '/a.bpmn', contents: '<xml/>' };
      boot.services.fileSystem.readFile.returns(file);

      // when
      const { donePromise } = invoke(boot.renderer, 'file:read', [ '/a.bpmn', { encoding: 'utf8' } ]);
      const [ err, result ] = await donePromise;

      // then
      expect(boot.services.fileSystem.readFile).to.have.been.calledWith('/a.bpmn', { encoding: 'utf8' });
      expect(err).to.equal(null);
      expect(result).to.equal(file);
    });


    it('file:read should reply with the error when readFile throws', async function() {

      // given
      const error = new Error('ENOENT');
      boot.services.fileSystem.readFile.throws(error);

      // when
      const { donePromise } = invoke(boot.renderer, 'file:read', [ '/missing', {} ]);
      const [ err, result ] = await donePromise;

      // then
      expect(err).to.equal(error);
      expect(result).to.equal(undefined);
    });


    it('file:write should delegate to writeFile and resolve the written file', async function() {

      // given
      const written = { path: '/a.bpmn', lastModified: 123 };
      boot.services.fileSystem.writeFile.returns(written);

      // when
      const { donePromise } = invoke(boot.renderer, 'file:write', [ '/a.bpmn', { contents: 'X' }, {} ]);
      const [ err, result ] = await donePromise;

      // then
      expect(boot.services.fileSystem.writeFile).to.have.been.calledWith('/a.bpmn', { contents: 'X' }, {});
      expect(err).to.equal(null);
      expect(result).to.equal(written);
    });


    it('file:read-stats should delegate to readFileStats', async function() {

      // given
      const refreshed = { path: '/a.bpmn', lastModified: 999 };
      boot.services.fileSystem.readFileStats.returns(refreshed);

      // when
      const { donePromise } = invoke(boot.renderer, 'file:read-stats', [ { path: '/a.bpmn' } ]);
      const [ err, result ] = await donePromise;

      // then
      expect(err).to.equal(null);
      expect(result).to.equal(refreshed);
    });

  });


  describe('config', function() {

    it('config:get should pop done and pass remaining args through', async function() {

      // given
      boot.services.config.get.returns('VALUE');

      // when
      const { donePromise } = invoke(boot.renderer, 'config:get', [ 'some.key', { default: 1 } ]);
      const [ err, result ] = await donePromise;

      // then
      expect(boot.services.config.get).to.have.been.calledWithExactly('some.key', { default: 1 });
      expect(err).to.equal(null);
      expect(result).to.equal('VALUE');
    });


    it('config:get should reply with the error when get throws', async function() {

      // given
      const error = new Error('bad config');
      boot.services.config.get.throws(error);

      // when
      const { donePromise } = invoke(boot.renderer, 'config:get', [ 'some.key' ]);
      const [ err ] = await donePromise;

      // then
      expect(err).to.equal(error);
    });


    it('config:set should pop done and forward key + value', async function() {

      // given
      boot.services.config.set.returns('STORED');

      // when
      const { donePromise } = invoke(boot.renderer, 'config:set', [ 'some.key', { a: 1 } ]);
      const [ err, result ] = await donePromise;

      // then
      expect(boot.services.config.set).to.have.been.calledWithExactly('some.key', { a: 1 });
      expect(err).to.equal(null);
      expect(result).to.equal('STORED');
    });

  });


  describe('dialogs', function() {

    it('dialog:open-files should set defaultPath from the active file', async function() {

      // given
      boot.services.dialog.showOpenDialog.resolves([ '/picked.bpmn' ]);

      // when
      const { donePromise } = invoke(boot.renderer, 'dialog:open-files', [
        { activeFile: { path: '/some/dir/current.bpmn' } }
      ]);
      const [ err, result ] = await donePromise;

      // then
      const passedOptions = boot.services.dialog.showOpenDialog.args[0][0];

      expect(passedOptions.defaultPath).to.equal(require('path').dirname('/some/dir/current.bpmn'));
      expect(err).to.equal(null);
      expect(result).to.eql([ '/picked.bpmn' ]);
    });


    it('dialog:save-file should set defaultPath from the file path', async function() {

      // given
      boot.services.dialog.showSaveDialog.resolves('/saved.bpmn');

      // when
      const { donePromise } = invoke(boot.renderer, 'dialog:save-file', [
        { file: { path: '/some/dir/current.bpmn' } }
      ]);
      const [ err, result ] = await donePromise;

      // then
      const passedOptions = boot.services.dialog.showSaveDialog.args[0][0];

      expect(passedOptions.defaultPath).to.equal(require('path').dirname('/some/dir/current.bpmn'));
      expect(err).to.equal(null);
      expect(result).to.equal('/saved.bpmn');
    });


    it('dialog:open-file-explorer should resolve undefined', async function() {

      // when
      const { donePromise } = invoke(boot.renderer, 'dialog:open-file-explorer', [ { path: '/x' } ]);
      const [ err, result ] = await donePromise;

      // then
      expect(boot.services.fileExplorerOpen).to.have.been.calledWith('/x');
      expect(err).to.equal(null);
      expect(result).to.equal(undefined);
    });

  });


  describe('clipboard', function() {

    it('system-clipboard:write-text should write text and resolve undefined', async function() {

      // when
      const { donePromise } = invoke(boot.renderer, 'system-clipboard:write-text', [ { text: 'hello' } ]);
      const [ err, result ] = await donePromise;

      // then
      expect(boot.services.clipboardWriteText).to.have.been.calledWith('hello');
      expect(err).to.equal(null);
      expect(result).to.equal(undefined);
    });

  });


  describe('file context', function() {

    it('file-context:add-root should delegate and resolve null', async function() {

      // when
      const { donePromise } = invoke(boot.renderer, 'file-context:add-root', [ { filePath: '/proj' } ]);
      const [ err ] = await donePromise;

      // then
      expect(boot.services.fileContext.addRoot).to.have.been.calledWith('/proj');
      expect(err).to.equal(null);
    });


    it('file-context:file-opened should convert the path to a file URL', async function() {

      // when
      const { donePromise } = invoke(boot.renderer, 'file-context:file-opened', [ '/proj/a.bpmn', { x: 1 } ]);
      await donePromise;

      // then
      const fileUrlArg = boot.services.fileContext.fileOpened.args[0][0];

      expect(fileUrlArg).to.match(/^file:\/\//);
      expect(fileUrlArg).to.contain('a.bpmn');
      expect(boot.services.fileContext.fileOpened.args[0][1]).to.eql({ x: 1 });
    });


    it('file-context:file-updated should convert the path to a file URL', async function() {

      // when
      const { donePromise } = invoke(boot.renderer, 'file-context:file-updated', [ '/proj/a.bpmn', {} ]);
      await donePromise;

      // then
      expect(boot.services.fileContext.fileUpdated.args[0][0]).to.match(/^file:\/\//);
    });

  });


  describe('zeebe', function() {

    const ZEEBE_OPS = [
      [ 'zeebe:checkConnection', 'checkConnection' ],
      [ 'zeebe:deploy', 'deploy' ],
      [ 'zeebe:startInstance', 'startInstance' ],
      [ 'zeebe:getGatewayVersion', 'getGatewayVersion' ],
      [ 'zeebe:searchProcessInstances', 'searchProcessInstances' ],
      [ 'zeebe:searchVariables', 'searchVariables' ],
      [ 'zeebe:searchIncidents', 'searchIncidents' ],
      [ 'zeebe:searchElementInstances', 'searchElementInstances' ],
      [ 'zeebe:searchJobs', 'searchJobs' ],
      [ 'zeebe:searchMessageSubscriptions', 'searchMessageSubscriptions' ],
      [ 'zeebe:searchUserTasks', 'searchUserTasks' ]
    ];

    ZEEBE_OPS.forEach(([ event, op ]) => {

      it(`${event} should pass options through and resolve the result`, async function() {

        // given
        const options = { endpoint: { url: 'grpc://localhost:26500' } };
        boot.services.zeebeAPI[op].resolves({ ok: true });

        // when
        const { donePromise } = invoke(boot.renderer, event, [ options ]);
        const [ err, result ] = await donePromise;

        // then
        expect(boot.services.zeebeAPI[op]).to.have.been.calledWithExactly(options);
        expect(err).to.equal(null);
        expect(result).to.eql({ ok: true });
      });


      it(`${event} should reply with the error on rejection`, async function() {

        // given
        const error = new Error('CONTACT_POINT_UNAVAILABLE');
        error.code = 14;
        boot.services.zeebeAPI[op].rejects(error);

        // when
        const { donePromise } = invoke(boot.renderer, event, [ {} ]);
        const [ err ] = await donePromise;

        // then
        expect(err).to.equal(error);
      });

    });

  });


  describe('fire-and-forget', function() {

    [ 'external:open-url', 'toggle-plugins', 'client:ready', 'client:templates-update' ].forEach(event => {

      it(`${event} should NOT reply (renderer promise stays pending)`, async function() {

        // when
        const args = event === 'external:open-url' ? [ { url: 'https://x' } ]
          : event === 'client:templates-update' ? [ { executionPlatform: 'Camunda Cloud', executionPlatformVersion: '8.6' } ]
            : [];

        const { returnValue, wasCalled } = invoke(boot.renderer, event, args);

        // let any synchronous/async handler body run
        await returnValue;

        // then
        expect(wasCalled(), `${event} unexpectedly replied`).to.be.false;
      });

    });


    it('external:open-url should open the url in the default browser', async function() {

      // when
      invoke(boot.renderer, 'external:open-url', [ { url: 'https://camunda.com' } ]);

      // then
      expect(boot.services.browserOpen).to.have.been.calledWith('https://camunda.com');
    });

  });


  describe('sync', function() {

    it('app:get-metadata should return version + name synchronously', function() {

      // when
      const metadata = invokeSync(boot.renderer, 'app:get-metadata');

      // then
      expect(metadata).to.have.property('version');
      expect(metadata).to.have.property('name', 'Camunda Modeler');
    });

  });

});
