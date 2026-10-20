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

const fs = require('fs');
const os = require('os');
const path = require('path');

const { getDeploymentFiles } = require('..');


describe('camunda-project', function() {

  let projectDirectory,
      projectFilePath;

  beforeEach(function() {
    projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'camunda-project-'));

    projectFilePath = path.join(projectDirectory, 'camunda.json');

    writeFile('camunda.json', '{}');
  });

  afterEach(function() {
    fs.rmSync(projectDirectory, { recursive: true, force: true });
  });


  describe('#getDeploymentFiles', function() {

    it('should find files in resources directory', async function() {

      // given
      writeFile('resources/sum.js');
      writeFile('resources/scripts/transform.py');
      writeFile('scripts/other.js');

      // when
      const { resources } = await getDeploymentFiles(projectFilePath);

      // then
      expect(resources).to.eql([
        resolve('resources/scripts/transform.py'),
        resolve('resources/sum.js')
      ]);
    });


    it('should find nothing without resources directory', async function() {

      // when
      const { resources } = await getDeploymentFiles(projectFilePath);

      // then
      expect(resources).to.be.empty;
    });


    it('should not find hidden files', async function() {

      // given
      writeFile('resources/.DS_Store');
      writeFile('resources/.cache/sum.js');
      writeFile('resources/sum.js');

      // when
      const { resources } = await getDeploymentFiles(projectFilePath);

      // then
      expect(resources).to.eql([
        resolve('resources/sum.js')
      ]);
    });


    it('should not find files in node_modules, target and .git', async function() {

      // given
      writeFile('resources/node_modules/lodash/index.js');
      writeFile('resources/target/sum.class');
      writeFile('resources/sum.js');

      // when
      const { resources } = await getDeploymentFiles(projectFilePath);

      // then
      expect(resources).to.eql([
        resolve('resources/sum.js')
      ]);
    });


    it('should not follow symbolic links', async function() {

      // given
      const outsideDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'outside-'));

      fs.writeFileSync(path.join(outsideDirectory, 'secret.txt'), '');

      writeFile('resources/sum.js');

      try {
        fs.symlinkSync(outsideDirectory, resolve('resources/linked-directory'), 'dir');
        fs.symlinkSync(path.join(outsideDirectory, 'secret.txt'), resolve('resources/linked-file.txt'));
      } catch (err) {

        // creating symbolic links may require privileges on Windows
        fs.rmSync(outsideDirectory, { recursive: true, force: true });

        this.skip();
      }

      // when
      const { resources } = await getDeploymentFiles(projectFilePath);

      fs.rmSync(outsideDirectory, { recursive: true, force: true });

      // then
      expect(resources).to.eql([
        resolve('resources/sum.js')
      ]);
    });


    describe('.c8ignore', function() {

      it('should ignore resources', async function() {

        // given
        writeFile('.c8ignore', [
          '# tests',
          '*.test.js',
          'fixtures/'
        ].join('\n'));

        writeFile('resources/sum.js');
        writeFile('resources/sum.test.js');
        writeFile('resources/fixtures/input.json');

        // when
        const { resources } = await getDeploymentFiles(projectFilePath);

        // then
        expect(resources).to.eql([
          resolve('resources/sum.js')
        ]);
      });


      it('should ignore project files', async function() {

        // given
        writeFile('.c8ignore', 'wip-*.bpmn');

        const filePaths = [
          resolve('process.bpmn'),
          resolve('wip-process.bpmn'),
          resolve('forms/wip-form.form')
        ];

        // when
        const { files } = await getDeploymentFiles(projectFilePath, filePaths);

        // then
        expect(files).to.eql([
          resolve('process.bpmn'),
          resolve('forms/wip-form.form')
        ]);
      });


      it('should match paths relative to the project directory', async function() {

        // given
        writeFile('.c8ignore', '/resources/legacy/');

        writeFile('resources/legacy/sum.js');
        writeFile('resources/scripts/legacy/sum.js');

        // when
        const { resources } = await getDeploymentFiles(projectFilePath);

        // then
        expect(resources).to.eql([
          resolve('resources/scripts/legacy/sum.js')
        ]);
      });


      it('should re-include negated files', async function() {

        // given
        writeFile('.c8ignore', [
          '*.json',
          '!config.json'
        ].join('\n'));

        writeFile('resources/config.json');
        writeFile('resources/data.json');

        // when
        const { resources } = await getDeploymentFiles(projectFilePath);

        // then
        expect(resources).to.eql([
          resolve('resources/config.json')
        ]);
      });

    });


    it('should not return project files as resources', async function() {

      // given
      writeFile('resources/process.bpmn');
      writeFile('resources/sum.js');

      const filePaths = [
        resolve('resources/process.bpmn')
      ];

      // when
      const { files, resources } = await getDeploymentFiles(projectFilePath, filePaths);

      // then
      expect(files).to.eql([
        resolve('resources/process.bpmn')
      ]);

      expect(resources).to.eql([
        resolve('resources/sum.js')
      ]);
    });


    it('should not return files outside the project', async function() {

      // given
      const filePaths = [
        resolve('process.bpmn'),
        path.join(os.tmpdir(), 'other.bpmn')
      ];

      // when
      const { files } = await getDeploymentFiles(projectFilePath, filePaths);

      // then
      expect(files).to.eql([
        resolve('process.bpmn')
      ]);
    });

  });


  // helpers //////////

  function resolve(relativePath) {
    return path.join(projectDirectory, ...relativePath.split('/'));
  }

  function writeFile(relativePath, contents = '') {
    const filePath = resolve(relativePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    fs.writeFileSync(filePath, contents);
  }

});
