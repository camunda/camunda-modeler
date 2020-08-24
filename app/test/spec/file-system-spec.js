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

const fs = require('fs'),
      os = require('os');

const {
  readFile,
  readFileStats,
  writeFile
} = require('../../lib/file-system');

const ENCODING_BASE64 = 'base64',
      ENCODING_UTF8 = 'utf8';

const PNG_BASE64_ENCODED = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAA';

const JPEG_BASE64_ENCODED = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';

let testFilePaths = [];


describe('FileSystem', function() {

  afterEach(function() {
    try {
      testFilePaths.forEach(testFilePath => {
        fs.unlinkSync(testFilePath);
      });

      testFilePaths = [];
    } catch (e) {
      console.log(e);
    }
  });


  describe('#readFile', function() {

    it('should read file (default encoding=utf8)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      writeFile(fooPath, { contents: 'foo' });

      // when
      const file = readFile(fooPath);

      // then
      expect(file.contents).to.eql('foo');
    });


    it('should read file (encoding=utf8)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      writeFile(fooPath, { contents: 'foo' }, {
        encoding: ENCODING_UTF8
      });

      // when
      const file = readFile(fooPath, {
        encoding: ENCODING_UTF8
      });

      // then
      expect(file.contents).to.eql('foo');
    });


    it('should read file (encoding=base64)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      writeFile(fooPath, { contents: PNG_BASE64_ENCODED }, {
        encoding: ENCODING_BASE64
      });

      // when
      const file = readFile(fooPath, {
        encoding: ENCODING_BASE64
      });

      // then
      expect(file.contents).to.match(/iVBOR/);
    });


    it('should read file (encoding=false)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      writeFile(fooPath, { contents: 'foo' });

      // when
      const file = readFile(fooPath, {
        encoding: false
      });

      // then
      expect(file.contents).to.eql(Buffer.from('foo'));
    });


    it('should throw an error', function() {

      // given
      const fooPath = 'foo';

      function read() {

        // when
        readFile(fooPath);
      }

      // then
      expect(read).to.throw();
    });

  });


  describe('#readFileStats', function() {

    it('lastModified', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      const file = writeFile(fooPath, { contents: 'foo' });

      // when
      const fileStats = readFileStats(file);

      // then
      expect(fileStats).to.have.property('lastModified').above(0);
    });


    it('lastModified = 0 (file not found)', function() {

      // given
      const file = { contents: 'foo' };

      // when
      const fileStats = readFileStats(file);

      // then
      expect(fileStats).to.have.property('lastModified').eql(0);
    });

  });


  describe('#writeFile', function() {

    it('should write file (default encoding=utf8)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      // when
      writeFile(fooPath, { contents: 'foo' });

      // then
      const file = readFile(fooPath);

      expect(file.contents).to.eql('foo');
    });


    it('should write file (encoding=UTF8)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      // when
      writeFile(fooPath, { contents: 'foo' }, {
        encoding: ENCODING_UTF8
      });

      // then
      const file = readFile(fooPath, {
        encoding: ENCODING_UTF8
      });

      expect(file.contents).to.eql('foo');
    });


    it('should write PNG file (encoding=BASE64)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      // when
      writeFile(fooPath, { contents: PNG_BASE64_ENCODED }, {
        encoding: ENCODING_BASE64
      });

      // then
      const file = readFile(fooPath, {
        encoding: ENCODING_BASE64
      });

      expect(file.contents).to.match(/iVBORw0KGgoAAAANSUhEUgAAADAA/);
    });


    it('should write JPEG file (encoding=BASE64)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      // when
      writeFile(fooPath, { contents: JPEG_BASE64_ENCODED }, {
        encoding: ENCODING_BASE64
      });

      // then
      const file = readFile(fooPath, {
        encoding: ENCODING_BASE64
      });

      expect(file.contents).to.match(/\/9j\/4AAQSkZJRgABAQAAAQABAAA/);
    });


    it('should ensure extension', function() {

      // given
      let fooPath = getTestFilePath('foo.file');

      // remove extension afterwards so fs.unlinkSync works
      fooPath = removeExtension(fooPath);

      // when
      const file = writeFile(fooPath, { contents: 'foo' }, {
        fileType: 'file'
      });

      // then
      expect(file.path).to.eql(`${fooPath}.file`);
    });


    it('set lastModified', function(done) {

      // given
      const fooPath = getTestFilePath('foo.file');

      const file = writeFile(fooPath, { contents: 'foo' });

      setTimeout(() => {

        // when
        const newFile = writeFile(fooPath, file);

        // then
        expect(newFile.lastModified).to.be.above(file.lastModified);

        done();
      }, 100);

    });


    it('should throw error', function() {

      // given
      const fooPath = 'foo/bar/baz.file';

      function writeFile() {

        // when
        writeFile(fooPath, { contents: 'foo' });
      }

      // then
      expect(writeFile).to.throw();
    });

  });

});

// helpers //////////

function getTestFilePath(fileName) {
  const testPath = `${ os.tmpdir() }/modeler_${ fileName }`;

  testFilePaths.push(testPath);

  return testPath;
}

function removeExtension(filePath) {
  const split = filePath.split('.');

  split.pop();

  return split.join('');
}