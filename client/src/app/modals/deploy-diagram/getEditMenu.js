export default function getEditMenu(enabled) {
  return [
    [
      {
        role: 'undo',
        enabled
      },
      {
        role: 'redo',
        enabled
      },
    ],
    [
      {
        role: 'copy',
        enabled
      },
      {
        role: 'cut',
        enabled
      },
      {
        role: 'paste',
        enabled
      },
      {
        role: 'selectAll',
        enabled
      }
    ]
  ];
}
