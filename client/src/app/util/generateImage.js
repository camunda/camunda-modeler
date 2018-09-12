import canvg from 'canvg-browser';

// list of defined encodings
const ENCODINGS = [
  'image/png',
  'image/jpeg'
];


export default function generateImage(type, svg) {
  const encoding = 'image/' + type;

  let context,
      canvas;

  if (ENCODINGS.indexOf(encoding) === -1) {
    throw new Error('<' + type + '> is an unknown type for converting svg to image');
  }

  canvas = document.createElement('canvas');

  canvg(canvas, svg);

  // make the background white for every format
  context = canvas.getContext('2d');

  context.globalCompositeOperation = 'destination-over';

  context.fillStyle = 'white';

  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(encoding);
}
