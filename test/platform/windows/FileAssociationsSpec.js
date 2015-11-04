'use strict';

var chai = require('chai'),
    expect = chai.expect;

var FileAssociations = require('../../../app/platform/windows/FileAssociations');


// only run these tests on windows
if (process.platform !== 'win32') {
  return;
}


var TEST_EXECUTABLE = 'C:\\bar\\foo.exe';

describe('app/platform/windows - FileAssociations', function() {

  afterEach(function() {
    FileAssociations.deregister();
  });


  it('should not exist, initially', function() {
    // assume
    expect(FileAssociations.query()).not.to.exist;
  });


  it('should add to registry', function() {
    var query;

    // when
    FileAssociations.register(TEST_EXECUTABLE);

    query = FileAssociations.query();

    // then
    expect(query).to.have.length(1);
    expect(query[0]).to.equal(TEST_EXECUTABLE);
  });


  it('should remove from registry', function() {

    // given
    FileAssociations.register(TEST_EXECUTABLE);

    // when
    FileAssociations.deregister();

    // then
    expect(FileAssociations.query()).to.not.exist;
  });

});