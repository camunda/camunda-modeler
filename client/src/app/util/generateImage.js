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

export default async function generateImage(type, svg) {
  const encoding = 'image/' + type;

  if (ENCODINGS.indexOf(encoding) === -1) {
    throw new Error('<' + type + '> is an unknown type for converting svg to image');
  }

  const dataUrl = asDataURL(svg);
  const image = await loadImage(dataUrl);
  const {
    height,
    width
  } = getSize(svg);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);

  // make the background white for every format
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(encoding, 1.0);
}

function asDataURL(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function loadImage(url) {
  const img = new Image();
  img.src = url;
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => {
      const error = new Error('Error happened generating image.');

      reject(error);
    };
    img.src = url;
  });
}

function getSize(svg) {
  const match = /width="(?<width>[^"]+)" height="(?<height>[^"]+)"/.exec(svg);
  const width = parseInt(match.groups.width, 10),
        height = parseInt(match.groups.height, 10);

  return { width, height };
}
