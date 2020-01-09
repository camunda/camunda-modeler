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

const INITIAL_SCALE = 3;
const FINAL_SCALE = 1;
const SCALE_STEP = 1;

const DATA_URL_REGEX = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/;


export default function generateImage(type, svg) {
  const encoding = 'image/' + type;

  if (ENCODINGS.indexOf(encoding) === -1) {
    throw new Error('<' + type + '> is an unknown type for converting svg to image');
  }

  const initialSVG = svg;

  let dataURL = '';

  for (let scale = INITIAL_SCALE; scale >= FINAL_SCALE; scale -= SCALE_STEP) {

    let canvas = document.createElement('canvas');

    svg = initialSVG.replace(/width="([^"]+)" height="([^"]+)"/, function(_, widthStr, heightStr) {
      return `width="${parseInt(widthStr, 10) * scale}" height="${parseInt(heightStr, 10) * scale}"`;
    });

    canvg(canvas, svg);

    // make the background white for every format
    let context = canvas.getContext('2d');

    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = 'white';

    context.fillRect(0, 0, canvas.width, canvas.height);

    dataURL = canvas.toDataURL(encoding);

    if (DATA_URL_REGEX.test(dataURL)) {
      return dataURL;
    }
  }

  throw new Error('Error happened generating image. Diagram size is too big.');
}
