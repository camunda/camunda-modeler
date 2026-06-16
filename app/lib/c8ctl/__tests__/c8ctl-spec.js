/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const os = require('os');
const fs = require('node:fs');
const path = require('node:path');

const C8ctl = require('..');
const { Config } = require('../core');
const { parseCommandLine } = require('../dispatch');


describe('c8ctl', function() {

  let tmpUserDir, tmpModelerDir;

  beforeEach(function() {
    tmpUserDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c8ctl-user-'));
    tmpModelerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c8ctl-modeler-'));
  });

  afterEach(function() {
    fs.rmSync(tmpUserDir, { recursive: true, force: true });
    fs.rmSync(tmpModelerDir, { recursive: true, force: true });
  });


  function writeProfiles(profiles) {
    fs.writeFileSync(path.join(tmpUserDir, 'profiles.json'), JSON.stringify(profiles));
  }

  function writeModelerConnections(connections) {
    fs.writeFileSync(
      path.join(tmpModelerDir, 'settings.json'),
      JSON.stringify({ 'connectionManagerPlugin.c8connections': connections })
    );
  }

  function createInstance(overrides = {}) {
    const config = new Config({
      userDataDir: tmpUserDir,
      modelerDataDir: tmpModelerDir
    });

    return new C8ctl({
      config,
      createCamundaClient: overrides.createCamundaClient
    });
  }


  describe('dispatch / parsing', function() {

    it('should parse verb, resource, flags and positionals', function() {

      // when
      const parsed = parseCommandLine('get process-instance 123');

      // then
      expect(parsed.verb).to.eql('get');
      expect(parsed.resource).to.eql('process-instance');
      expect(parsed.positionals).to.eql([ '123' ]);
    });


    it('should parse flags', function() {

      // when
      const parsed = parseCommandLine('list process-instance --limit 5');

      // then
      expect(parsed.verb).to.eql('list');
      expect(parsed.resource).to.eql('process-instance');
      expect(parsed.flags.limit).to.eql('5');
    });


    it('should resolve resource aliases', function() {

      // when
      const parsed = parseCommandLine('get pi 123');

      // then
      expect(parsed.verb).to.eql('get');
      expect(parsed.resource).to.eql('process-instance');
    });

  });


  describe('registry-driven help + completion', function() {

    it('should list only REST-backed commands plus profile read', function() {

      // given
      const c8ctl = createInstance();

      // when
      const commands = c8ctl.listCommands().map((entry) => entry.command);

      // then
      expect(commands).to.include('get topology');
      expect(commands).to.include('list profile');
      expect(commands).to.include('which profile');

      // no filesystem side-effect commands
      expect(commands).not.to.include('use config');
      expect(commands).not.to.include('add profile');
    });


    it('should prefix-complete commands', function() {

      // given
      const c8ctl = createInstance();

      // when
      const matches = c8ctl.complete('list ');

      // then
      expect(matches).to.include('list profile');
      expect(matches.every((m) => m.startsWith('list '))).to.be.true;
    });

  });


  describe('profile resolution (Modeler + c8ctl merge)', function() {

    it('should merge c8ctl profiles and Modeler connections', async function() {

      // given
      writeProfiles({
        profiles: [
          { name: 'prod', baseUrl: 'https://prod/v2' }
        ]
      });
      writeModelerConnections([
        { id: 'conn-1', name: 'Local', contactPoint: 'http://localhost:8080/v2' }
      ]);

      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('list profile');

      // then
      expect(result.isError).to.be.false;
      expect(result.output).to.contain('prod');
      expect(result.output).to.contain('modeler:Local');
    });

  });


  describe('command execution (mock SDK)', function() {

    it('should run get topology via injected client', async function() {

      // given
      writeProfiles({
        profiles: [
          { name: 'prod', baseUrl: 'https://prod/v2' }
        ]
      });

      const getTopology = () => Promise.resolve({
        brokers: [ { nodeId: 0, host: 'broker', port: 26501 } ],
        clusterSize: 1,
        gatewayVersion: '8.x'
      });

      const c8ctl = createInstance({
        createCamundaClient: () => ({ getTopology })
      });

      // when
      const result = await c8ctl.execute('get topology');

      // then
      expect(result.isError).to.be.false;
      expect(result.output).to.contain('broker');
    });


    it('should report an error for an unknown command', async function() {

      // given
      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('frobnicate everything');

      // then
      expect(result.isError).to.be.true;
    });

  });


  describe('prompt', function() {

    it('should show the default profile with a `*` marker', function() {

      // given
      writeModelerConnections([
        { id: 'b', name: 'c8run', contactPoint: 'http://localhost:8080' }
      ]);

      const c8ctl = createInstance();

      // then
      expect(c8ctl.getPrompt()).to.eql('c8run* | c8ctl >');
    });


    it('should show the selected profile without a marker', async function() {

      // given
      writeModelerConnections([
        { id: 'a', name: 'Remote', contactPoint: 'https://remote/v2' },
        { id: 'b', name: 'c8run', contactPoint: 'http://localhost:8080' }
      ]);

      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('use profile Remote');

      // then
      expect(c8ctl.getPrompt()).to.eql('Remote | c8ctl >');
      expect(result.prompt).to.eql('Remote | c8ctl >');
    });


    it('should fall back to the base prompt with no profiles', function() {

      // given
      const c8ctl = createInstance();

      // then
      expect(c8ctl.getPrompt()).to.eql('c8ctl >');
    });

  });


  describe('default profile (Modeler current/default)', function() {

    it('should default to the c8run connection when nothing is selected', async function() {

      // given — two Modeler connections, one is the local c8run default
      writeModelerConnections([
        { id: 'a', name: 'Remote', contactPoint: 'https://remote/v2' },
        { id: 'b', name: 'c8run', contactPoint: 'http://localhost:8080' }
      ]);

      const captured = {};
      const c8ctl = createInstance({
        createCamundaClient: (opts) => {
          captured.opts = opts;
          return { getTopology: () => Promise.resolve({ brokers: [] }) };
        }
      });

      // when
      const result = await c8ctl.execute('get topology');

      // then
      expect(result.isError).to.be.false;
      expect(captured.opts.config.CAMUNDA_REST_ADDRESS).to.contain('localhost:8080');
    });


    it('should mark the default connection in `which profile`', async function() {

      // given
      writeModelerConnections([
        { id: 'a', name: 'Remote', contactPoint: 'https://remote/v2' },
        { id: 'b', name: 'c8run', contactPoint: 'http://localhost:8080' }
      ]);

      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('which profile');

      // then
      expect(result.isError).to.be.false;
      expect(result.output).to.contain("Modeler's current connection");
      expect(result.output).to.contain('modeler:c8run');
    });


    it('should let an explicit selection override the default', async function() {

      // given
      writeModelerConnections([
        { id: 'a', name: 'Remote', contactPoint: 'https://remote/v2' },
        { id: 'b', name: 'c8run', contactPoint: 'http://localhost:8080' }
      ]);

      const c8ctl = createInstance();

      // when
      await c8ctl.execute('use profile Remote');
      const result = await c8ctl.execute('which profile');

      // then
      expect(result.output).to.contain('Active profile: modeler:Remote');
    });

  });


  describe('per-command help', function() {

    it('should show flags and usage for `help <verb> <resource>`', async function() {

      // given
      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('help create process-instance');

      // then
      expect(result.isError).to.be.false;
      expect(result.output).to.contain('Usage: create process-instance');
      expect(result.output).to.contain('--id <value>');
      expect(result.output).to.contain('(required)');
      expect(result.output).to.contain('--awaitCompletion');
    });


    it('should support `<command> --help`', async function() {

      // given
      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('get process-instance --help');

      // then
      expect(result.isError).to.be.false;
      expect(result.output).to.contain('Usage: get process-instance <key>');
      expect(result.output).to.contain('--variables');
    });


    it('should resolve aliases in help targets', async function() {

      // given
      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('help create pi');

      // then
      expect(result.isError).to.be.false;
      expect(result.output).to.contain('Usage: create process-instance');
      expect(result.output).to.contain('Aliases:');
    });


    it('should list resources for `help <verb>`', async function() {

      // given
      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('help list');

      // then
      expect(result.isError).to.be.false;
      expect(result.output).to.contain('Resources:');
      expect(result.output).to.contain('process-instance');
    });


    it('should error for an unknown help target', async function() {

      // given
      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('help frobnicate');

      // then
      expect(result.isError).to.be.true;
      expect(result.output).to.contain('Unknown command');
    });

  });


  describe('session state (in-memory, no FS side-effect)', function() {

    it('should set the active profile without writing to disk', async function() {

      // given
      writeProfiles({
        profiles: [
          { name: 'prod', baseUrl: 'https://prod/v2' },
          { name: 'dev', baseUrl: 'https://dev/v2' }
        ]
      });

      const c8ctl = createInstance();

      // when
      const result = await c8ctl.execute('use profile dev');

      // then
      expect(result.isError).to.be.false;
      expect(c8ctl.getSession().activeProfile).to.eql('dev');

      // profiles.json unchanged (no activeProfile persisted)
      const onDisk = JSON.parse(
        fs.readFileSync(path.join(tmpUserDir, 'profiles.json'), 'utf-8')
      );
      expect(onDisk.activeProfile).to.be.undefined;
    });

  });

});
