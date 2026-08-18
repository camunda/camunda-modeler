/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const Config = require('..');

const fs = require('fs');
const os = require('os');
const path = require('path');

const sinon = require('sinon');
const { expect } = require('chai');

describe('Config', function() {

  describe('default', function() {

    let file;

    beforeEach(function() {
      file = fs.readFileSync(getAbsolutePath('fixtures/config.json'), { encoding: 'utf8' });
    });

    afterEach(function() {
      fs.writeFileSync(getAbsolutePath('fixtures/config.json'), file, { encoding: 'utf8' });

      sinon.restore();
    });


    describe('#get', function() {

      it('should get', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        const value = config.get('foo');

        // then
        expect(value).to.equal(42);
      });


      it('should get all', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        const value = config.get();

        // then
        expect(value).to.eql({
          foo: 42
        });
      });


      it('should return null', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        const value = config.get('bar');

        // then
        expect(value).to.eql(null);
      });


      it('should return default value', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        const value = config.get('bar', 42);

        // then
        expect(value).to.eql(42);
      });


      it('should read from cache on subsequent gets', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        const readFileSpy = sinon.spy(fs, 'readFileSync');

        // when
        config.get('foo');
        config.get('foo');
        config.get('foo');

        // then
        expect(readFileSpy).to.have.been.calledOnce;
      });


      it('should NOT throw if cannot read config', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures/broken/config')
        });

        // when
        const value = config.get('editor.privacyPreferences');

        // then
        expect(value).to.eql(null);
      });
    });


    describe('#set', function() {

      it('should set', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        // when
        config.set('foo', false);

        // then
        const value = config.get('foo');

        expect(value).to.equal(false);
      });


      it('should update cache on set', function() {

        // given
        const config = new Config({
          userPath: getAbsolutePath('fixtures')
        });

        const readFileSpy = sinon.spy(fs, 'readFileSync');

        // when
        config.set('bar', 'baz');

        readFileSpy.resetHistory();

        const value = config.get('bar');

        // then
        expect(value).to.equal('baz');
        expect(readFileSpy).to.not.have.been.called;
      });

    });

  });

  describe('<bpmn.elementTemplates>', function() {

    it('should get', function() {

      // given
      const file = {
        path: getAbsolutePath('fixtures/project/bar.bpmn')
      };

      const config = new Config({
        resourcesPaths: [
          getAbsolutePath('fixtures/ok')
        ],
        userPath: 'foo'
      });

      // when
      const templates = config.get('bpmn.elementTemplates', file);

      // then
      expect(templates).to.eql([
        { id: 'com.foo.Bar' }, // local
        { id: 'com.foo.Bar', FOO: 'BAR' }, // global
        { id: 'single', FOO: 'BAR' } // global
      ]);
    });


    it('should NOT throw if new file', function() {

      // given
      const file = {
        path: null
      };

      const config = new Config({
        resourcesPaths: [
          getAbsolutePath('fixtures/ok')
        ],
        userPath: 'foo'
      });

      // when
      const templates = config.get('bpmn.elementTemplates', file);

      // then
      expect(templates).to.eql([
        { id: 'com.foo.Bar', FOO: 'BAR' },
        { id: 'single', FOO: 'BAR' }
      ]);
    });


    it('should throw if JSON#parse errors', function() {

      // given
      const file = null;

      const config = new Config({
        resourcesPaths: [
          getAbsolutePath('fixtures/broken')
        ],
        userPath: 'foo'
      });

      // when
      expect(() => config.get('bpmn.elementTemplates', file))
        .to.throw(/template .* parse error: Unexpected token 'I', "I AM NOT JSON!"*/);
    });


    it('should not get if path is ignored', function() {

      // given
      const file = {
        path: getAbsolutePath('fixtures/project/bar.bpmn')
      };

      const config = new Config({
        resourcesPaths: [
          getAbsolutePath('fixtures/ok')
        ],
        userPath: 'foo',
        ignoredPaths: [
          getAbsolutePath('fixtures/ok/element-templates/list.json')
        ]
      });

      // when
      const templates = config.get('bpmn.elementTemplates', file);

      // then
      expect(templates).to.eql([
        { id: 'com.foo.Bar' }, // local
        { id: 'single', FOO: 'BAR' } // global
      ]);
    });


    it('should reuse cached templates when files are unchanged', function() {

      // given
      const file = {
        path: getAbsolutePath('fixtures/project/bar.bpmn')
      };

      const config = new Config({
        resourcesPaths: [
          getAbsolutePath('fixtures/ok')
        ],
        userPath: 'foo'
      });

      const readFileSync = sinon.spy(fs, 'readFileSync');

      const templateReadCount = () => readFileSync.getCalls().filter(
        call => call.args[0].includes('element-templates')
      ).length;

      try {

        // when
        config.get('bpmn.elementTemplates', file);

        const readsAfterFirst = templateReadCount();

        config.get('bpmn.elementTemplates', file);

        const readsAfterSecond = templateReadCount();

        // then
        // the second get reuses the cache, adding no template file reads
        expect(readsAfterFirst).to.be.above(0);
        expect(readsAfterSecond).to.equal(readsAfterFirst);
      } finally {
        readFileSync.restore();
      }
    });


    it('should re-read a template when its file changes', function() {

      // given
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'element-templates-'));
      const templatesDir = path.join(tmpDir, 'element-templates');

      fs.mkdirSync(templatesDir);

      const templatePath = path.join(templatesDir, 'list.json');

      fs.writeFileSync(templatePath, JSON.stringify([ { id: 'A' } ]));

      const config = new Config({
        resourcesPaths: [ tmpDir ],
        userPath: 'foo'
      });

      try {

        // when
        const first = config.get('bpmn.elementTemplates', null);

        // change the file, forcing a different modification time
        fs.writeFileSync(templatePath, JSON.stringify([ { id: 'B' } ]));
        fs.utimesSync(templatePath, new Date(), new Date(Date.now() + 1000));

        const second = config.get('bpmn.elementTemplates', null);

        // then
        expect(first).to.eql([ { id: 'A' } ]);
        expect(second).to.eql([ { id: 'B' } ]);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });


    it('should skip a file that vanished between globbing and stat', function() {

      // given
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'element-templates-'));
      const templatesDir = path.join(tmpDir, 'element-templates');

      fs.mkdirSync(templatesDir);

      const keptPath = path.join(templatesDir, 'kept.json');
      const vanishedPath = path.join(templatesDir, 'vanished.json');

      fs.writeFileSync(keptPath, JSON.stringify([ { id: 'kept' } ]));
      fs.writeFileSync(vanishedPath, JSON.stringify([ { id: 'vanished' } ]));

      const config = new Config({
        resourcesPaths: [ tmpDir ],
        userPath: 'foo'
      });

      // globbing returns POSIX-style paths (forward slashes) on all platforms,
      // so normalize before comparing to the native `path.join` result
      const toPosix = p => p.split(path.sep).join(path.posix.sep);

      // simulate the file disappearing after it was globbed
      const statSync = sinon.stub(fs, 'statSync').callsFake(function(target, ...args) {
        if (toPosix(target) === toPosix(vanishedPath)) {
          const error = new Error('ENOENT');

          error.code = 'ENOENT';

          throw error;
        }

        return statSync.wrappedMethod.call(fs, target, ...args);
      });

      try {

        // when
        const templates = config.get('bpmn.elementTemplates', null);

        // then
        // the vanished file is skipped, not surfaced as an error, and the
        // remaining templates are still returned
        expect(templates).to.eql([ { id: 'kept' } ]);
      } finally {
        statSync.restore();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });


    it('should not evict another scope\'s cached templates', function() {

      // given
      // two independent "projects", each with its own local
      // `.camunda/element-templates`; local dirs are derived from
      // `parents(path.dirname(file.path))`, so the templates must live under
      // `<project>/.camunda/element-templates`
      const projectA = fs.mkdtempSync(path.join(os.tmpdir(), 'element-templates-a-'));
      const projectB = fs.mkdtempSync(path.join(os.tmpdir(), 'element-templates-b-'));

      const templateA = path.join(projectA, '.camunda', 'element-templates', 'a.json');
      const templateB = path.join(projectB, '.camunda', 'element-templates', 'b.json');

      fs.mkdirSync(path.dirname(templateA), { recursive: true });
      fs.mkdirSync(path.dirname(templateB), { recursive: true });

      fs.writeFileSync(templateA, JSON.stringify([ { id: 'A' } ]));
      fs.writeFileSync(templateB, JSON.stringify([ { id: 'B' } ]));

      const fileA = { path: path.join(projectA, 'a.bpmn') };
      const fileB = { path: path.join(projectB, 'b.bpmn') };

      const config = new Config({
        resourcesPaths: [],
        userPath: 'foo'
      });

      const readFileSync = sinon.spy(fs, 'readFileSync');

      // globbing returns POSIX-style paths (forward slashes) on all platforms,
      // so normalize before comparing to the native `path.join` result
      const toPosix = p => p.split(path.sep).join(path.posix.sep);

      const templateAReadCount = () => readFileSync.getCalls().filter(
        call => toPosix(String(call.args[0])) === toPosix(templateA)
      ).length;

      try {

        // when
        config.get('bpmn.elementTemplates', fileA);

        const readsAfterA = templateAReadCount();

        // switching to another project must not evict project A's scope cache
        config.get('bpmn.elementTemplates', fileB);

        config.get('bpmn.elementTemplates', fileA);

        const readsAfterReturn = templateAReadCount();

        // then
        // project A's template was read once and is still cached after the
        // intervening `get` for project B - it is not re-read on return
        expect(readsAfterA).to.equal(1);
        expect(readsAfterReturn).to.equal(1);
      } finally {
        readFileSync.restore();
        fs.rmSync(projectA, { recursive: true, force: true });
        fs.rmSync(projectB, { recursive: true, force: true });
      }
    });

  });


  describe('<editor.id>', function() {

    it('should get if file exists', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/ok/uuid/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

      // when
      const uuid = config.get('editor.id');

      // then
      expect(uuid).to.be.eql('51e50852-53b3-462a-801b-40e98d7c32fd');
    });


    it('should get consistent values', function() {

      // given
      const absolutePath = getAbsolutePath('fixtures/ok/uuid/');

      let uuids = [];

      // when
      for (let i = 0; i < 2; i ++) {
        let config = new Config({
          userPath: absolutePath
        });

        config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

        uuids.push(config.get('editor.id'));
      }

      // then
      expect(isValidUUID(uuids[0])).to.be.true;
      expect(isValidUUID(uuids[1])).to.be.true;
      expect(uuids[0]).to.be.eql(uuids[1]);
    });


    it('should get if file does not exist', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('non_existing_path/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

      // when
      const uuid = config.get('editor.id');

      // then
      expect(isValidUUID(uuid)).to.be.true;
    });


    it('should get if uuid malformed inside file', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/broken/uuid/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

      // when
      const uuid = config.get('editor.id');

      // then
      expect(isValidUUID(uuid)).to.be.true;
    });


    it('should store new id', function() {

      // given
      const saveIDSpy = sinon.spy();
      const config = new Config({
        userPath: getAbsolutePath('non_existing_path/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id'], saveIDSpy);

      // when
      const uuid = config.get('editor.id');

      // then
      expect(saveIDSpy).to.have.been.calledOnceWith(uuid);
    });


    it('should cache', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/ok/uuid/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id']);

      // when
      config.get('editor.id');

      // then
      expect(config._providers['editor.id']._cachedUUID).to.be.eql('51e50852-53b3-462a-801b-40e98d7c32fd');
    });


    it('should not store if cached', function() {

      // given
      const saveIDSpy = sinon.spy();
      const config = new Config({
        userPath: getAbsolutePath('non_existing_path/')
      });

      config._providers['editor.id'] = mockUUIDStorageFunction(config._providers['editor.id'], saveIDSpy);

      // when
      config.get('editor.id');
      config.get('editor.id');

      // then
      expect(saveIDSpy).to.have.been.calledOnce;
    });
  });


  describe('<os.info>', function() {

    it('should return correct values', function() {

      // given
      const config = new Config({
        userPath: 'test'
      });
      const os = require('os');

      // when
      const osInfo = config.get('os.info');

      // then
      expect(osInfo.platform).to.be.eql(os.platform());
      expect(osInfo.release).to.be.eql(os.release());
    });
  });


  describe('<settings>', function() {

    let file;

    beforeEach(function() {
      file = fs.readFileSync(getAbsolutePath('fixtures/ok/settings/settings.json'), { encoding: 'utf8' });
    });

    afterEach(function() {
      fs.writeFileSync(getAbsolutePath('fixtures/ok/settings/settings.json'), file, { encoding: 'utf8' });
    });


    it('should get', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/ok/settings')
      });

      // when
      const settings = config.get('settings');

      // then
      expect(settings).to.eql({
        'test.setting': 'value'
      });
    });


    it('should get empty object if file does not exist', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures')
      });

      // when
      const settings = config.get('settings');

      // then
      expect(settings).to.eql({ });
    });


    it('should get empty object if file is broken', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/broken/settings')
      });

      // when
      const settings = config.get('settings');

      // then
      expect(settings).to.eql({ });
    });


    it('should set', function() {

      // given
      const config = new Config({
        userPath: getAbsolutePath('fixtures/ok/settings')
      });

      // assume
      let settings = config.get('settings');
      expect(settings).to.eql({
        'test.setting': 'value'
      });

      // when
      const values = {
        'test.setting': 'newValue'
      };
      config.set('settings', values);

      // then
      settings = config.get('settings');

      expect(settings).to.eql({
        'test.setting': 'newValue'
      });
    });

  });
});


// helpers ///////////////////

function getAbsolutePath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

function isValidUUID(testedUUID) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return !!testedUUID.match(uuidPattern);
}

function mockUUIDStorageFunction(uuidProvider, saveIDSpy) {
  uuidProvider.generateUUIDAndStore = () => {
    var uuid = uuidProvider.generateUUID();
    if (saveIDSpy) {
      saveIDSpy(uuid);
    }
    return uuid;
  };
  return uuidProvider;
}
