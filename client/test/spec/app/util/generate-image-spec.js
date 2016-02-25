'use strict';

var generateImage = require('app/util/generate-image');

var exampleSVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">',
  '<rect x="50" y="20" width="150" height="100" style="fill:blue;stroke:pink;stroke-width:5;fill-opacity:0.1;stroke-opacity:0.9" />',
  '</svg>'
].join('');


describe('generateImage', function () {

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
