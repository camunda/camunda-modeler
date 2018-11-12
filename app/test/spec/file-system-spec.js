'use strict';

const fs = require('fs'),
      os = require('os');

const FileSystem = require('../../lib/file-system');

const ENCODING_BASE64 = 'base64',
      ENCODING_UTF8 = 'utf8';

const BASE64_ENCODED =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII=';

let testFilePaths = [];


describe('FileSystem', function() {

  let fileSystem;

  beforeEach(function() {
    fileSystem = new FileSystem({
      dialog: {}
    });
  });

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


  describe('#openFiles', function() {

    it('should open single file', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      fileSystem.writeFile(fooPath, { contents: 'foo' });

      // when
      const files = fileSystem.openFiles(fooPath);

      // expect
      expect(files).to.have.length(1);
      expect(files[0].contents).to.equal('foo');
    });


    it('should open multiple files', function() {

      // given
      const fooPath = getTestFilePath('foo.file'),
            barPath = getTestFilePath('bar.file');

      fileSystem.writeFile(fooPath, { contents: 'foo' });
      fileSystem.writeFile(barPath, { contents: 'bar' });

      // when
      const files = fileSystem.openFiles([
        fooPath,
        barPath
      ]);

      // expect
      expect(files).to.have.length(2);
      expect(files[0].contents).to.equal('foo');
      expect(files[1].contents).to.equal('bar');
    });


    it('should NOT open file', function() {

      // given
      const fooPath = getTestFilePath('foo.file'),
            barPath = 'bar';

      fileSystem.writeFile(fooPath, { contents: 'foo' });

      // when
      const files = fileSystem.openFiles([
        fooPath,
        barPath
      ]);

      // expect
      expect(files).to.have.length(1);
      expect(files[0].contents).to.equal('foo');
    });

  });


  describe('#saveFile', function() {

    it('should save file', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      fileSystem.saveFile(fooPath, { contents: 'foo' });

      // when
      const file = fileSystem.readFile(fooPath);

      // then
      expect(file.contents).to.eql('foo');
    });

  });


  describe('#readFile', function() {

    it('should read file (default encoding=utf8)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      fileSystem.writeFile(fooPath, { contents: 'foo' });

      // when
      const file = fileSystem.readFile(fooPath);

      // then
      expect(file.contents).to.eql('foo');
    });


    it('should read file (encoding=utf8)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      fileSystem.writeFile(fooPath, { contents: 'foo' }, {
        encoding: ENCODING_UTF8
      });

      // when
      const file = fileSystem.readFile(fooPath, {
        encoding: ENCODING_UTF8
      });

      // then
      expect(file.contents).to.eql('foo');
    });


    it('should read file (encoding=base64)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      fileSystem.writeFile(fooPath, { contents: BASE64_ENCODED }, {
        encoding: ENCODING_BASE64
      });

      // when
      const file = fileSystem.readFile(fooPath, {
        encoding: ENCODING_BASE64
      });

      // then
      expect(file.contents).to.match(/iVBOR/);
    });

  });


  describe('#readFileStats', function() {

    it('lastModified', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      const file = fileSystem.writeFile(fooPath, { contents: 'foo' });

      // when
      const fileStats = fileSystem.readFileStats(file);

      // then
      expect(fileStats).to.have.property('lastModified').above(0);
    });


    it('lastModified = 0 (file not found)', function() {

      // given
      const file = { contents: 'foo' };

      // when
      const fileStats = fileSystem.readFileStats(file);

      // then
      expect(fileStats).to.have.property('lastModified').eql(0);
    });

  });


  describe('#writeFile', function() {

    it('should write file (default encoding=utf8)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      // when
      fileSystem.writeFile(fooPath, { contents: 'foo' });

      // then
      const file = fileSystem.readFile(fooPath);

      expect(file.contents).to.eql('foo');
    });


    it('should write file (encoding=UTF8)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      // when
      fileSystem.writeFile(fooPath, { contents: 'foo' }, {
        encoding: ENCODING_UTF8
      });

      // then
      const file = fileSystem.readFile(fooPath, {
        encoding: ENCODING_UTF8
      });

      expect(file.contents).to.eql('foo');
    });


    it('should write file (encoding=BASE64)', function() {

      // given
      const fooPath = getTestFilePath('foo.file');

      // when
      fileSystem.writeFile(fooPath, { contents: BASE64_ENCODED }, {
        encoding: ENCODING_BASE64
      });

      // then
      const file = fileSystem.readFile(fooPath, {
        encoding: ENCODING_BASE64
      });

      expect(file.contents).to.match(/iVBOR/);
    });


    it('should ensure extension', function() {

      // given
      let fooPath = getTestFilePath('foo.file');

      // remove extension afterwards so fs.unlinkSync works
      fooPath = removeExtension(fooPath);

      // when
      const file = fileSystem.writeFile(fooPath, { contents: 'foo' }, {
        fileType: 'file'
      });

      // then
      expect(file.path).to.eql(`${fooPath}.file`);
    });


    it('set lastModified', function(done) {

      // given
      const fooPath = getTestFilePath('foo.file');

      const file = fileSystem.writeFile(fooPath, { contents: 'foo' });

      setTimeout(() => {

        // when
        const newFile = fileSystem.writeFile(fooPath, file);

        // then
        expect(newFile.lastModified).to.be.above(file.lastModified);

        done();
      }, 100);

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