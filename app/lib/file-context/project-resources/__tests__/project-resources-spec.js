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

const {
  MODE_C8IGNORE,
  MODE_DEPLOY_RESOURCES,
  resolveProjectResources
} = require('..');

const { couldMatchBelow } = require('../patterns');


/**
 * Specification: https://github.com/camunda/product-hub/issues/3888,
 * section "Resource selection and matching" and "Validation and feedback".
 */
describe('project-resources', function() {

  let projectPath;

  beforeEach(function() {
    projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'project-resources-'));
  });

  afterEach(function() {
    fs.rmSync(projectPath, { recursive: true, force: true });
  });

  function resolve(descriptor, files, options = {}) {
    for (const file of files) {
      writeFile(path.join(projectPath, file), file);
    }

    if (options.c8ignore !== undefined) {
      writeFile(path.join(projectPath, '.c8ignore'), options.c8ignore);
    }

    const projectFile = options.projectFile || 'camunda.json';

    const projectFilePath = path.join(projectPath, projectFile);

    writeFile(projectFilePath, typeof descriptor === 'string' ? descriptor : JSON.stringify(descriptor));

    const resources = resolveProjectResources(projectFilePath);

    return {
      ...resources,
      selected: resources.selected.map(filePath => toRelative(projectPath, filePath))
    };
  }


  describe('worked example', function() {

    it('should select resources/** and target/classes/**, exclude drafts except keep.bpmn, include resources/.prompt.md, exclude resources/.env, node_modules/, .git/ and root README', function() {

      // when
      const { error, mode, selected } = resolve({
        deployResources: [
          'resources/**',
          'target/classes/**',
          '!target/classes/drafts/**',
          'target/classes/drafts/keep.bpmn',
          'resources/.prompt.md'
        ]
      }, [
        'README.md',
        'resources/order.bpmn',
        'resources/agent/task.md',
        'resources/.prompt.md',
        'resources/.env',
        'target/classes/generated.form',
        'target/classes/drafts/draft.bpmn',
        'target/classes/drafts/keep.bpmn',
        'node_modules/pkg/index.bpmn',
        '.git/config'
      ]);

      // then
      expect(error).not.to.exist;
      expect(mode).to.eql(MODE_DEPLOY_RESOURCES);
      expect(selected).to.eql([
        'resources/.prompt.md',
        'resources/agent/task.md',
        'resources/order.bpmn',
        'target/classes/drafts/keep.bpmn',
        'target/classes/generated.form'
      ]);
    });

  });


  describe('deployResources', function() {

    it('"is an optional top-level array of glob strings in camunda.json" (absent => default scan)', function() {

      // when
      const { mode, selected } = resolve({}, [ 'a.bpmn', 'notes.md' ]);

      // then
      expect(mode).to.eql(MODE_C8IGNORE);
      expect(selected).to.eql([ 'a.bpmn' ]);
    });


    it('"Allowlist: when present, selection starts empty"', function() {

      // when
      const { selected } = resolve({ deployResources: [ 'a.bpmn' ] }, [ 'a.bpmn', 'b.bpmn', 'c.dmn' ]);

      // then
      expect(selected).to.eql([ 'a.bpmn' ]);
    });


    it('"Positive patterns include, ! patterns exclude; the last matching pattern wins per file"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ '*.bpmn', '!a.bpmn', '!b.bpmn', 'b.bpmn' ]
      }, [ 'a.bpmn', 'b.bpmn', 'c.bpmn' ]);

      // then
      expect(selected).to.eql([ 'b.bpmn', 'c.bpmn' ]);
    });


    it('"The default extension scan ... do(es) not apply" (any file type selectable)', function() {

      // when
      const { selected } = resolve({
        deployResources: [ 'resources/**' ]
      }, [ 'resources/prompt.md', 'resources/script.js', 'resources/data.json', 'resources/noextension', 'a.bpmn' ]);

      // then
      expect(selected).to.eql([
        'resources/data.json',
        'resources/noextension',
        'resources/prompt.md',
        'resources/script.js'
      ]);
    });


    it('".c8ignore do(es) not apply" when deployResources is present', function() {

      // when
      const { selected } = resolve({
        deployResources: [ 'resources/**' ]
      }, [ 'resources/a.bpmn' ], { c8ignore: 'resources/\n*.bpmn\n' });

      // then
      expect(selected).to.eql([ 'resources/a.bpmn' ]);
    });


    it('"Defaults: node_modules/, target/, .git/, and the project-root camunda.json remain excluded"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ 'resources/**', '!nothing' ]
      }, [ 'resources/a.bpmn', 'node_modules/a.bpmn', 'target/a.bpmn', '.git/a.bpmn' ]);

      // then
      expect(selected).to.eql([ 'resources/a.bpmn' ]);
    });


    it('"... unless a matching positive pattern overrides them"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ 'node_modules/pkg/**', 'target/classes/**', 'camunda.json' ]
      }, [ 'node_modules/pkg/a.bpmn', 'target/classes/b.bpmn', 'target/c.bpmn' ]);

      // then
      expect(selected).to.eql([ 'camunda.json', 'node_modules/pkg/a.bpmn', 'target/classes/b.bpmn' ]);
    });


    it('"Other control files (.c8ignore, .process-application) are ... covered by the hidden-file rule"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ '**/*' ]
      }, [ 'a.bpmn', '.process-application' ], { c8ignore: '' });

      // then
      expect(selected).not.to.include('.c8ignore');
      expect(selected).not.to.include('.process-application');
    });


    it('"Hidden files: wildcard patterns never select files whose name starts with ."', function() {

      // when
      const { selected } = resolve({
        deployResources: [ '**/*', 'resources/*', 'resources/**', '**/*.bpmn' ]
      }, [ 'resources/a.bpmn', 'resources/.env', 'resources/.draft.bpmn', '.env' ]);

      // then
      expect(selected).to.eql([ 'camunda.json', 'resources/a.bpmn' ]);
    });


    it('"A pattern naming the dot-prefixed file explicitly (e.g. resources/.prompt.md) selects it"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ 'resources/.prompt.md' ]
      }, [ 'resources/.prompt.md', 'resources/.env' ]);

      // then
      expect(selected).to.eql([ 'resources/.prompt.md' ]);
    });


    it('"Hidden directories are traversed normally"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ '.config/**', '.github/workflows/build.bpmn' ]
      }, [ '.config/a.bpmn', '.github/workflows/build.bpmn', '.github/other.bpmn' ]);

      // then
      expect(selected).to.eql([ '.config/a.bpmn', '.github/workflows/build.bpmn' ]);
    });


    it('"Descendant re-inclusion: positive patterns select descendants directly, without parent-unignore ceremony"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ 'a/b/c/d.bpmn' ]
      }, [ 'a/b/c/d.bpmn', 'a/b/e.bpmn' ]);

      // then
      expect(selected).to.eql([ 'a/b/c/d.bpmn' ]);
    });


    it('"a later positive pattern restores a file below an earlier excluded directory"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ 'resources/**', '!resources/drafts/', 'resources/drafts/keep.bpmn' ]
      }, [ 'resources/a.bpmn', 'resources/drafts/b.bpmn', 'resources/drafts/keep.bpmn' ]);

      // then
      expect(selected).to.eql([ 'resources/a.bpmn', 'resources/drafts/keep.bpmn' ]);
    });


    it('"Discovery must not prune directories in a way that defeats this"', function() {

      // when
      const { selected } = resolve({
        deployResources: [ '!deep/', '**/keep.bpmn' ]
      }, [ 'deep/er/still/keep.bpmn', 'deep/er/other.bpmn', 'node_modules/x/keep.bpmn' ]);

      // then
      expect(selected).to.eql([ 'deep/er/still/keep.bpmn', 'node_modules/x/keep.bpmn' ]);
    });


    it('"Containment: ... absolute paths ... are invalid"', function() {

      for (const pattern of [ '/a.bpmn', '!/a.bpmn', 'C:/a.bpmn', 'c:\\a.bpmn', '\\\\server\\a.bpmn' ]) {

        // when
        const { error, selected } = resolve({ deployResources: [ 'a.bpmn', pattern ] }, [ 'a.bpmn' ]);

        // then
        expect(error, pattern).to.match(/must be relative to the project root/);
        expect(selected).to.be.empty;
      }
    });


    it('"Containment: ... `..` (is) invalid"', function() {

      for (const pattern of [ '../a.bpmn', 'resources/../a.bpmn', '!../a.bpmn', 'resources/..' ]) {

        // when
        const { error, selected } = resolve({ deployResources: [ 'a.bpmn', pattern ] }, [ 'a.bpmn' ]);

        // then
        expect(error, pattern).to.match(/must not contain "\.\."/);
        expect(selected).to.be.empty;
      }
    });


    it('"Symlink handling and duplicate detection follow c8ctl\'s existing discovery (realpath-based)"', function() {

      // given
      writeFile(path.join(projectPath, 'resources/a.bpmn'), 'a');
      symlink.call(this, path.join(projectPath, 'resources'), path.join(projectPath, 'linked'), 'dir');
      symlink.call(this, path.join(projectPath, 'resources/a.bpmn'), path.join(projectPath, 'link.bpmn'), 'file');

      // when
      const { selected } = resolve({ deployResources: [ '**/*.bpmn' ] }, []);

      // then
      // the file is selected once, by the first path discovered
      expect(selected).to.eql([ 'link.bpmn' ]);
    });


    it('should evaluate each path of a directory reachable through a symbolic link and its real path', function() {

      // given
      writeFile(path.join(projectPath, 'z-real/prompt.md'), 'prompt');
      writeFile(path.join(projectPath, 'z-real/keep.bpmn'), 'keep');
      symlink.call(this, path.join(projectPath, 'z-real'), path.join(projectPath, 'a-alias'), 'dir');

      // when
      const { selected } = resolve({ deployResources: [ 'a-alias/prompt.md', 'z-real/keep.bpmn' ] }, []);

      // then
      expect(selected).to.eql([ 'a-alias/prompt.md', 'z-real/keep.bpmn' ]);
    });


    it('should select a file reachable through several paths by the first path in sorted order', function() {

      // given
      writeFile(path.join(projectPath, 'a/x.bpmn'), 'x');
      symlink.call(this, path.join(projectPath, 'a/x.bpmn'), path.join(projectPath, 'b.bpmn'), 'file');

      // when
      const { selected } = resolve({ deployResources: [ '**/*.bpmn' ] }, []);

      // then
      expect(selected).to.eql([ 'a/x.bpmn' ]);
    });


    it('should validate patterns with trailing whitespace trimmed', function() {

      // when
      const { error, errorType } = resolve({ deployResources: [ 'resources/**', 'resources/.. ' ] }, [ 'resources/a.bpmn' ]);

      // then
      expect(errorType).to.eql('invalid-config');
      expect(error).to.match(/must not contain "\.\."/);
    });


    it('should select through repeated separators and "." segments', function() {

      // when
      const { selected } = resolve({
        deployResources: [ 'resources//sub/*.bpmn', 'other/./sub/*.form' ]
      }, [ 'resources/sub/a.bpmn', 'other/sub/b.form', 'resources/c.bpmn' ]);

      // then
      expect(selected).to.eql([ 'other/sub/b.form', 'resources/sub/a.bpmn' ]);
    });


    it('should follow symbolic links to directories', function() {

      // given
      const outsidePath = fs.mkdtempSync(path.join(os.tmpdir(), 'project-resources-outside-'));

      writeFile(path.join(outsidePath, 'shared.bpmn'), 'shared');
      symlink.call(this, outsidePath, path.join(projectPath, 'shared'), 'dir');

      // when
      const { selected } = resolve({ deployResources: [ 'shared/**' ] }, []);

      // then
      expect(selected).to.eql([ 'shared/shared.bpmn' ]);

      fs.rmSync(outsidePath, { recursive: true, force: true });
    });


    it('should not loop on symbolic link cycles', function() {

      // given
      writeFile(path.join(projectPath, 'a/a.bpmn'), 'a');
      symlink.call(this, path.join(projectPath, 'a'), path.join(projectPath, 'a/self'), 'dir');

      // when
      const { selected } = resolve({ deployResources: [ '**/*.bpmn' ] }, []);

      // then
      expect(selected).to.eql([ 'a/a.bpmn' ]);
    });


    it('should ignore broken symbolic links', function() {

      // given
      symlink.call(this, path.join(projectPath, 'missing.bpmn'), path.join(projectPath, 'broken.bpmn'), 'file');

      // when
      const { selected } = resolve({ deployResources: [ '*.bpmn' ] }, [ 'a.bpmn' ]);

      // then
      expect(selected).to.eql([ 'a.bpmn' ]);
    });

  });


  describe('validation', function() {

    it('"Invalid field type ...: error, no deployment"', function() {

      for (const deployResources of [ 'resources/**', null, {}, 42, true ]) {

        // when
        const { error, selected } = resolve({ deployResources }, [ 'a.bpmn' ]);

        // then
        expect(error, JSON.stringify(deployResources)).to.match(/`deployResources` must be an array of glob patterns/);
        expect(selected).to.be.empty;
      }
    });


    it('"Invalid ... entries ...: error, no deployment"', function() {

      for (const entry of [ 42, null, {}, [], '', '   ', '!', '# comment' ]) {

        // when
        const { error, selected } = resolve({ deployResources: [ 'a.bpmn', entry ] }, [ 'a.bpmn' ]);

        // then
        expect(error, JSON.stringify(entry)).to.match(/`deployResources\[1\]`/);
        expect(selected).to.be.empty;
      }
    });


    it('"invalid patterns: error, no deployment"', function() {

      // when
      const { error, selected } = resolve({ deployResources: [ '../outside/**' ] }, [ 'a.bpmn' ]);

      // then
      expect(error).to.match(/`deployResources\[0\]` must not contain "\.\."/);
      expect(selected).to.be.empty;
    });


    it('"Empty final selection: error, no deployment"', function() {

      // when
      const { error, selected } = resolve({ deployResources: [ 'nothing/**' ] }, [ 'a.bpmn' ]);

      // then
      expect(error).to.match(/No deployable files found/);
      expect(selected).to.be.empty;
    });


    it('"Empty final selection: error" (deployResources absent)', function() {

      // when
      const { error, selected } = resolve({}, [ 'notes.md' ]);

      // then
      expect(error).to.match(/No deployable files found/);
      expect(selected).to.be.empty;
    });


    it('"A pattern matching no files: silently ignored"', function() {

      // when
      const { error, selected } = resolve({
        deployResources: [ 'a.bpmn', 'nothing/**', '!nothing.bpmn' ]
      }, [ 'a.bpmn' ]);

      // then
      expect(error).not.to.exist;
      expect(selected).to.eql([ 'a.bpmn' ]);
    });


    it('should error on unreadable camunda.json (permissions), not fall back to the default scan', function() {

      // assume
      if (process.platform === 'win32' || process.getuid?.() === 0) {
        return this.skip();
      }

      // given
      writeFile(path.join(projectPath, 'a.bpmn'), 'a');
      writeFile(path.join(projectPath, 'excluded.bpmn'), 'excluded');

      const projectFilePath = path.join(projectPath, 'camunda.json');

      writeFile(projectFilePath, JSON.stringify({ deployResources: [ 'a.bpmn' ] }));
      fs.chmodSync(projectFilePath, 0o000);

      // when
      const { error, errorType, selected } = resolveProjectResources(projectFilePath);

      // then
      expect(errorType).to.eql('invalid-config');
      expect(error).to.match(/Failed to read camunda.json/);
      expect(selected).to.be.empty;
    });


    it('should error on camunda.json being a directory, not fall back to the default scan', function() {

      // given
      writeFile(path.join(projectPath, 'a.bpmn'), 'a');

      const projectFilePath = path.join(projectPath, 'camunda.json');

      fs.mkdirSync(projectFilePath);

      // when
      const { error, errorType, selected } = resolveProjectResources(projectFilePath);

      // then
      expect(errorType).to.eql('invalid-config');
      expect(error).to.match(/Failed to read camunda.json/);
      expect(selected).to.be.empty;
    });


    it('should error on camunda.json removed (e.g. during atomic save), not fall back to the default scan', function() {

      // given
      writeFile(path.join(projectPath, 'a.bpmn'), 'a');

      // when
      const { error, errorType, selected } = resolveProjectResources(path.join(projectPath, 'camunda.json'));

      // then
      expect(errorType).to.eql('invalid-config');
      expect(error).to.match(/Failed to read camunda.json/);
      expect(selected).to.be.empty;
    });


    it('should error on partially written camunda.json', function() {

      // when
      const { errorType, selected } = resolve('{ "deployResources": [ "a.bpmn"', [ 'a.bpmn', 'excluded.bpmn' ]);

      // then
      expect(errorType).to.eql('invalid-config');
      expect(selected).to.be.empty;
    });


    it('should read camunda.json with byte order mark (UTF-8, UTF-16LE), as c8ctl', function() {

      // given
      writeFile(path.join(projectPath, 'a.bpmn'), 'a');
      writeFile(path.join(projectPath, 'b.bpmn'), 'b');

      const projectFilePath = path.join(projectPath, 'camunda.json');

      const json = JSON.stringify({ deployResources: [ 'a.bpmn' ] });

      for (const buffer of [
        Buffer.concat([ Buffer.from([ 0xef, 0xbb, 0xbf ]), Buffer.from(json, 'utf8') ]),
        Buffer.concat([ Buffer.from([ 0xff, 0xfe ]), Buffer.from(json, 'utf16le') ])
      ]) {
        fs.writeFileSync(projectFilePath, buffer);

        // when
        const { error, selected } = resolveProjectResources(projectFilePath);

        // then
        expect(error).not.to.exist;
        expect(selected.map(filePath => toRelative(projectPath, filePath))).to.eql([ 'a.bpmn' ]);
      }
    });


    it('should error on invalid camunda.json', function() {

      // when
      const { error, selected } = resolve('{ "deployResources": [ ', [ 'a.bpmn' ]);

      // then
      expect(error).to.match(/Invalid camunda.json/);
      expect(selected).to.be.empty;
    });


    it('should error on camunda.json not being an object', function() {

      // when
      const { error } = resolve('[ "a.bpmn" ]', [ 'a.bpmn' ]);

      // then
      expect(error).to.match(/Invalid camunda.json: must contain a JSON object/);
    });


    it('should treat empty camunda.json as {}', function() {

      // when
      const { error, selected } = resolve('', [ 'a.bpmn' ]);

      // then
      expect(error).not.to.exist;
      expect(selected).to.eql([ 'a.bpmn' ]);
    });

  });


  describe('.c8ignore (deployResources absent)', function() {

    it('"the existing scan rules apply" (BPMN, DMN, form and RPA files, no hidden files)', function() {

      // when
      const { selected } = resolve({}, [
        'a.bpmn',
        'b.dmn',
        'c.form',
        'd.rpa',
        'notes.md',
        'script.js',
        '.hidden.bpmn',
        'sub/e.bpmn'
      ]);

      // then
      expect(selected).to.eql([ 'a.bpmn', 'b.dmn', 'c.form', 'd.rpa', 'sub/e.bpmn' ]);
    });


    it('"filtered by .c8ignore (default directory exclusions ...)"', function() {

      // when
      const { selected } = resolve({}, [
        'a.bpmn',
        'node_modules/b.bpmn',
        'target/c.bpmn',
        'sub/target/d.bpmn',
        '.git/e.bpmn'
      ]);

      // then
      expect(selected).to.eql([ 'a.bpmn' ]);
    });


    it('"filtered by .c8ignore (... ordered rules ...)"', function() {

      // when
      const { selected } = resolve({}, [
        'a.bpmn',
        'keep.bpmn',
        'sub/keep.bpmn',
        'c.dmn'
      ], { c8ignore: '# drafts\n*.bpmn\n!keep.bpmn\n' });

      // then
      expect(selected).to.eql([ 'c.dmn', 'keep.bpmn', 'sub/keep.bpmn' ]);
    });


    it('"filtered by .c8ignore (... excluded-parent restriction)"', function() {

      // when
      const { selected } = resolve({}, [
        'a.bpmn',
        'drafts/b.bpmn',
        'drafts/keep.bpmn'
      ], { c8ignore: 'drafts/\n!drafts/keep.bpmn\n' });

      // then
      expect(selected).to.eql([ 'a.bpmn' ]);
    });


    it('should fail on unreadable .c8ignore (directory), not deploy files meant to be excluded', function() {

      // given
      fs.mkdirSync(path.join(projectPath, '.c8ignore'));

      // when
      const { error, errorType, selected } = resolve({}, [ 'a.bpmn', 'drafts/b.bpmn' ]);

      // then
      expect(errorType).to.eql('invalid-config');
      expect(error).to.match(/Failed to read .c8ignore/);
      expect(selected).to.be.empty;
    });


    it('should fail on unreadable .c8ignore (permissions)', function() {

      // assume
      if (process.platform === 'win32' || process.getuid?.() === 0) {
        return this.skip();
      }

      // given
      writeFile(path.join(projectPath, '.c8ignore'), 'drafts/\n');
      fs.chmodSync(path.join(projectPath, '.c8ignore'), 0o000);

      // when
      const { error, errorType } = resolve({}, [ 'a.bpmn', 'drafts/b.bpmn' ]);

      // then
      expect(errorType).to.eql('invalid-config');
      expect(error).to.match(/Failed to read .c8ignore/);
    });


    it('should not read .c8ignore with deployResources (unreadable .c8ignore)', function() {

      // given
      fs.mkdirSync(path.join(projectPath, '.c8ignore'));

      // when
      const { error, selected } = resolve({ deployResources: [ '*.bpmn' ] }, [ 'a.bpmn' ]);

      // then
      expect(error).not.to.exist;
      expect(selected).to.eql([ 'a.bpmn' ]);
    });


    it('should apply .c8ignore to legacy projects (.process-application)', function() {

      // when
      const { mode, selected } = resolve('', [
        'a.bpmn',
        'b.bpmn',
        'target/c.bpmn'
      ], { c8ignore: 'b.bpmn\n', projectFile: '.process-application' });

      // then
      expect(mode).to.eql(MODE_C8IGNORE);
      expect(selected).to.eql([ 'a.bpmn' ]);
    });


    it('should NOT read deployResources from legacy project file', function() {

      // when
      const { mode, selected } = resolve({
        deployResources: [ 'notes.md' ]
      }, [ 'a.bpmn', 'notes.md' ], { projectFile: '.process-application' });

      // then
      expect(mode).to.eql(MODE_C8IGNORE);
      expect(selected).to.eql([ 'a.bpmn' ]);
    });

  });


  describe('nested projects', function() {

    it('"a nested camunda.json does not exclude that folder from the parent\'s selection"', function() {

      // given
      writeFile(path.join(projectPath, 'nested/camunda.json'), '{}');

      // when
      const withDeployResources = resolve({ deployResources: [ '**/*.bpmn' ] }, [ 'a.bpmn', 'nested/b.bpmn' ]);

      const withoutDeployResources = resolve({}, []);

      // then
      expect(withDeployResources.selected).to.eql([ 'a.bpmn', 'nested/b.bpmn' ]);
      expect(withoutDeployResources.selected).to.eql([ 'a.bpmn', 'nested/b.bpmn' ]);
    });

  });


  describe('couldMatchBelow', function() {

    it('should prune only directories nothing can be selected from', function() {
      expect(couldMatchBelow('resources/*', 'resources')).to.be.true;
      expect(couldMatchBelow('resources/*', 'node_modules')).to.be.false;
      expect(couldMatchBelow('resources/*', 'resources/sub')).to.be.false;
      expect(couldMatchBelow('**/keep.bpmn', 'node_modules/x')).to.be.true;
      expect(couldMatchBelow('**/keep.bpmn', '.git')).to.be.false;
      expect(couldMatchBelow('.git/**', '.git')).to.be.true;
      expect(couldMatchBelow('a/b', 'a/b')).to.be.false;
      expect(couldMatchBelow('a/b/**', 'a/b')).to.be.true;
      expect(couldMatchBelow('{a,b}/c', 'x')).to.be.true;
      expect(couldMatchBelow('resources//sub/*.bpmn', 'resources/sub')).to.be.true;
      expect(couldMatchBelow('resources/./sub/*.bpmn', 'resources/sub')).to.be.true;
      expect(couldMatchBelow('./resources/*', 'resources')).to.be.true;
    });

  });

});


// helpers //////////

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

/**
 * Create a symbolic link, a junction for directories on Windows; skip the
 * test where file links require privileges (Windows).
 *
 * @this {Mocha.Context}
 */
function symlink(target, linkPath, type) {
  const isWindows = process.platform === 'win32';

  try {
    fs.symlinkSync(target, linkPath, isWindows && type === 'dir' ? 'junction' : type);
  } catch (error) {
    if (isWindows && error.code === 'EPERM') {
      return this.skip();
    }

    throw error;
  }
}

function toRelative(projectPath, filePath) {
  return path.relative(projectPath, filePath).split(path.sep).join('/');
}
