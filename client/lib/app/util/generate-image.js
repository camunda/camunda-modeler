'use strict';

var canvg = require('canvg-client');

// list of defined encodings
var ENCODINGS = [ 'image/png', 'image/jpeg' ];


function generateImage(type, svg) {
  var encoding = 'image/' + type,
      canvas;

  if (ENCODINGS.indexOf(encoding) === -1) {
    throw new Error('<' + type + '> is an unknown type for converting svg to image');
  }

  canvas = document.createElement('canvas');

  canvg(canvas, svg);

  return canvas.toDataURL(encoding);
}

module.exports = generateImage;
