/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import canvg from 'canvg-browser';

// list of defined encodings
const ENCODINGS = [
  'image/png',
  'image/jpeg'
];

const SCALE = 3;

export default function generateImage(type, svg) {
  const encoding = 'image/' + type;

  let context,
      canvas;

  if (ENCODINGS.indexOf(encoding) === -1) {
    throw new Error('<' + type + '> is an unknown type for converting svg to image');
  }

  canvas = document.createElement('canvas');


  svg = svg.replace(/width="([^"]+)" height="([^"]+)"/, function(_, widthStr, heightStr) {
    return `width="${parseInt(widthStr, 10) * SCALE}" height="${parseInt(heightStr, 10) * SCALE}"`;
  });

  canvg(canvas, svg);

  // make the background white for every format
  context = canvas.getContext('2d');

  context.globalCompositeOperation = 'destination-over';

  context.fillStyle = 'white';

  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(encoding);
}