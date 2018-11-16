function getCopyPasteEntries({
  copy,
  paste
}) {
  return [{
    label: 'Copy',
    accelerator: 'CommandOrControl+C',
    enabled: copy,
    action: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CommandOrControl+V',
    enabled: paste,
    action: 'paste'
  }];
}

export default function getBpmnContextMenu(state) {
  return getCopyPasteEntries(state);
}
