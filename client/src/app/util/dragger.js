import dragTabs from 'drag-tabs';

const noop = () => {};

export function addDragger(node, options, onDrag, onStart=noop) {

  const dragger = dragTabs(node, options);

  dragger.on('drag', onDrag);
  dragger.on('start', onStart);

  dragger.on('cancel', onDrag);

  return dragger;
}