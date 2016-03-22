'use strict';

var fs = require('fs'),
    os = require('os');

var FileSystem = require('../../lib/file-system');

var BASE64_ENCODED =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNby' +
      'blAAAADElEQVQImWNgoBMAAABpAAFEI8ARAAAAAElFTkSuQmCC';

var TEST_FILE_PATH = os.tmpdir() + '/camunda-modeler.fs.test';


describe('FileSystem', function() {

  var fileSystem;

  beforeEach(function() {
    fileSystem = new FileSystem({
      dialog: {}
    });
  });

  after(function() {
    try {
      fs.unlinkSync(TEST_FILE_PATH);
    } catch (e) { /** YEA */ }
  });


  it('should write BASE64 encoded file', function() {

    var file = {
      contents: BASE64_ENCODED
    };

    // when
    fileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = fileSystem.readFile(TEST_FILE_PATH, 'base64');

    // then
    expect(readFile.contents).to.match(/iVBOR/);
  });


  it('should write UTF8 encoded file', function() {

    var file = {
      contents: 'FOO BAR'
    };

    // when
    fileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = fileSystem.readFile(TEST_FILE_PATH);

    // then
    expect(readFile.contents).to.eql('FOO BAR');
  });


  it('should strip whitespace in read file', function() {

    var file = {
      contents: '  FOO BAR  \r\n\n'
    };

    // when
    fileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = fileSystem.readFile(TEST_FILE_PATH);

    // then
    expect(readFile.contents).to.eql('FOO BAR');
  });


  describe('should set last modified property', function() {

    it('on read', function() {
      // given
      var file = {
        contents: 'FOO BAR'
      };

      file = fileSystem.writeFile(TEST_FILE_PATH, file);
      // HFS+ tracks seconds only
      file.lastModified -= 1000;

      // when
      var updatedFile = fileSystem.readFile(TEST_FILE_PATH);

      // then
      expect(updatedFile.lastModified).to.be.above(file.lastModified);
    });


    it('on write', function() {
      // given
      var file = {
        contents: 'FOO BAR',
        // HFS+ tracks seconds only
        lastModified: new Date().getTime() - 1000
      };

      // when
      var newFile = fileSystem.writeFile(TEST_FILE_PATH, file);

      // then
      expect(newFile.lastModified).to.be.above(file.lastModified);
    });

  });


  describe('readFileStats', function() {

    it('should set last modified property on existing file', function() {
      // given
      var file = {
        path: TEST_FILE_PATH
      };

      // when
      var statsFile = fileSystem.readFileStats(file);

      // then
      expect(statsFile).to.have.property('lastModified').above(0);
    });


    it('should set last modified property to "0" if file is not accesible', function() {
      // given
      var file = {
        path: TEST_FILE_PATH + '.does-not-exist.xml'
      };

      // when
      var statsFile = fileSystem.readFileStats(file);

      // then
      expect(statsFile).to.have.property('lastModified').eql(0);
    });

  });

});
