/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

// list of defined encodings
const ENCODINGS = [
  'image/png',
  'image/jpeg'
];

const INITIAL_SCALE = 3;
const FINAL_SCALE = 1;
const SCALE_STEP = 1;

const DATA_URL_REGEX = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/;


export default async function generateImage(type, svg) {
  const encoding = 'image/' + type;

  if (ENCODINGS.indexOf(encoding) === -1) {
    throw new Error('<' + type + '> is an unknown type for converting svg to image');
  }

  const initialSVG = svg;

  let dataURL = '';

  // we try with different scales, to eventually end up with an image
  // size that we can generate
  for (let scale = INITIAL_SCALE; scale >= FINAL_SCALE; scale -= SCALE_STEP) {
    let canvas = document.createElement('canvas');

    svg = initialSVG.replace(
      /width="([^"]+)" height="([^"]+)"/,
      (_, widthStr, heightStr) =>
        `width="${parseInt(widthStr, 10) * scale}" height="${parseInt(heightStr, 10) * scale}"`
    );

    const ctx = canvas.getContext('2d');

    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

    const img = new Image();
    img.decoding = 'async';
    img.src = svgDataUrl;
    await img.decode();

    // Size canvas to rendered SVG dimensions
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    // Draw the SVG
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // White background (put under the drawing)
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    dataURL = canvas.toDataURL(encoding);

    if (!DATA_URL_REGEX.test(dataURL)) {
      throw new Error('Invalid data URL');
    }

    return dataURL;
  }

  throw new Error('Error happened generating image. Diagram size is too big.');
}
