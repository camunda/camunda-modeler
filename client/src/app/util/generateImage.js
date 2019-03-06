/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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