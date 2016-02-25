'use strict';

var fs = require('fs'),
    os = require('os');

var FileSystem = require('../../lib/FileSystem');

var BASE64_ENCODED =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNby' +
      'blAAAADElEQVQImWNgoBMAAABpAAFEI8ARAAAAAElFTkSuQmCC';

var TEST_FILE_PATH = os.tmpdir() + '/camunda-modeler.fs.test';


describe('FileSystem', function() {

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
    FileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = FileSystem.readFile(TEST_FILE_PATH, 'base64');

    // then
    expect(readFile.contents).to.match(/iVBOR/);
  });


  it('should write UTF8 encoded file', function() {

    var file = {
      contents: 'FOO BAR'
    };

    // when
    FileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = FileSystem.readFile(TEST_FILE_PATH);

    // then
    expect(readFile.contents).to.eql('FOO BAR');
  });


  it('should strip whitespace in read file', function() {

    var file = {
      contents: '  FOO BAR  \r\n\n'
    };

    // when
    FileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = FileSystem.readFile(TEST_FILE_PATH);

    // then
    expect(readFile.contents).to.eql('FOO BAR');
  });

});
