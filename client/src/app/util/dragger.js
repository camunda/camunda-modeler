import dragTabs from 'drag-tabs';

export function addDragger(node, options, onDrag) {
  const dragger = dragTabs(node, options);

  dragger.on('drag', onDrag);

  dragger.on('cancel', onDrag);

  return dragger;
}