module.exports = {
  __init__: [  'paletteProvider', 'contextPadProvider', 'replaceMenuProvider' ],
  paletteProvider: [ 'type', require('./CustomPalette') ],
  replaceMenuProvider: [ 'type', require('./CustomReplaceMenuProvider') ],
  contextPadProvider: [ 'type', require('./CustomContextPadProvider') ]
};
