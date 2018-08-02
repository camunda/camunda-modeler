'use strict';

var generateImage = require('app/util/generate-image');

var exampleSVG = require('test/fixtures/diagram.svg');


describe('generateImage', function() {

  it('should generate a PNG from SVG', function() {
    // when
    var imageData = generateImage('png', exampleSVG);

    // then
    expect(imageData).to.match(/data:image\/png;base64,iVBOR/);
  });


  it('should generate a JPEG from SVG', function() {
    // when
    var imageData = generateImage('jpeg', exampleSVG);

    // then
    expect(imageData).to.match(/data:image\/jpeg;base64,\/9j\/4AA/);
  });


  it('should throw error on undefined image type', function() {
    // when
    function foo() {
      generateImage('foo', exampleSVG);
    }

    expect(foo).to.throw(/<foo> is an unknown type for converting svg to image/);
  });

});
