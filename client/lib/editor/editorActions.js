'use strict';

var browser = require('../util/browser');

// TODO: Unregistering event

function EditorActions(editor) {

  browser.on('editor.actions', function(payload) {
    switch (payload.event) {
      // File
      case 'file.open':
        editor.openDiagram();
        break;
      case 'file.save':
        editor.save(payload.data.create);
        break;
      case 'file.add':
        editor.addDiagram(payload.data.diagram);
        break;

      case 'editor.new':
        editor.newDiagram();
        break;
      case 'editor.close':
        editor.closeDiagram(editor.currentDiagram);
        break;
      case 'editor.quit':
        editor.quit();
        break;

      // Edit
      case 'editor.spaceTool':
        editor.trigger('spaceTool');
        break;
      case 'editor.lassoTool':
        editor.trigger('lassoTool');
        break;
      case 'editor.directEditing':
        editor.trigger('directEditing');
        break;
      case 'editor.moveCanvas':
        editor.trigger('moveCanvas', payload.data);
        break;
      case 'editor.selectElements':
        editor.trigger('selectElements', payload.data);
        break;
      case 'editor.removeSelection':
        editor.trigger('removeSelection', payload.data);
        break;
      case 'editor.undo':
        editor.trigger('undo');
        break;
      case 'editor.redo':
        editor.trigger('redo');
        break;

      // Window
      case 'editor.stepZoom':
        editor.trigger('stepZoom', payload.data);
        break;
      case 'editor.zoom':
        editor.trigger('zoom', payload.data);
        break;
      default:
      return;
    }
  });
}

module.exports = EditorActions;
