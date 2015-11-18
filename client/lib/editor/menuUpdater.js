'use strict';

var forEach = require('lodash/collection/forEach'),
    flatten = require('lodash/array/flatten');

var browser = require('../util/browser');

var FILE_ID = 'file',
    EDIT_ID = 'edit',
    WINDOW_ID = 'window',
    UNDO_ID = 'undo',
    REDO_ID = 'redo',
    SAVE_ID = 'save',
    SELECTION_IDS = [
      'bpmn:directEditing',
      'bpmn:removeSelected',
    ],
    DMN_RULES = [
      'dmn:ruleAddAbove',
      'dmn:ruleAddBelow',
      'dmn:ruleClear',
      'dmn:ruleRemove',
    ],
    DMN_CLAUSES = [
      'dmn:clauseAdd',
      'dmn:clauseAddLeft',
      'dmn:clauseAddRight',
      'dmn:clauseRemove'
    ];


function history(canUndo, canRedo) {
  return [
    {
      id: UNDO_ID,
      data: {
        enabled: canUndo
      }
    },
    {
      id: REDO_ID,
      data: {
        enabled: canRedo
      }
    }
  ];
}

function saving(canSave) {
  return [
    {
      id: SAVE_ID,
      data: {
        enabled: canSave
      }
    }
  ];
}


function selection(enabled) {
  var selectionIds = [];

  if (typeof enabled === 'object') {
    forEach(DMN_RULES, function(id) {
      selectionIds.push({
        id: id,
        data: {
          enabled: enabled.rule
        }
      });
    });

    forEach(DMN_CLAUSES, function(id) {
      selectionIds.push({
        id: id,
        data: {
          enabled: enabled.input || enabled.output
        }
      });
    });
  } else {
    forEach(SELECTION_IDS, function(id) {
      selectionIds.push({
        id: id,
        data: {
          enabled: enabled
        }
      });
    });
  }

  return selectionIds;
}


function enableMenus() {
  var enabled = true;

  browser.updateMenus([
    {
      id: FILE_ID,
      data: {
        enabled: enabled,
        excludes: [ 'save' ]
      }
    },
    {
      id: EDIT_ID,
      data: {
        enabled: enabled,
        excludes: [ 'undo', 'redo' ].concat(SELECTION_IDS, DMN_RULES, DMN_CLAUSES)
      }
    },
    {
      id: WINDOW_ID,
      data: {
        enabled: enabled,
      }
    }
  ]);
}

module.exports.enableMenus = enableMenus;

function disableMenus() {
  var enabled = false;

  browser.updateMenus([
    {
      id: FILE_ID,
      data: {
        enabled: enabled,
        excludes: [ 'newFile', 'openFile', 'quit' ]
      }
    },
    {
      id: EDIT_ID,
      data: {
        enabled: enabled
      }
    },
    {
      id: WINDOW_ID,
      data: {
        enabled: enabled,
        excludes: [ 'reload', 'fullscreen', 'devTools' ]
      }
    }
  ]);
}

module.exports.disableMenus = disableMenus;


/*
  Here we standardize the payload for batch and single/multiple updates.
  So in the end what is sent looks like this:

  f.ex (Batch):
  [{
    id: WINDOW_ID,
    data: {
      enabled: enabled,
      excludes: [ 'reload', 'fullscreen', 'devTools' ]
    }
  }]

  f.ex (Single/Multiple):
  [{
    id: EDIT_ID,
    data: [
      {
        id: REMOVE_SELECTION_ID,
        data: {
          enabled: enabled
        }
      },
      {
        id: DIRECT_EDITING_ID,
        data: {
          enabled: enabled
        }
      }
    ]
  }]
*/
function update(notation, items) {
  var updateItems = {},
      menusUpdate = [];

  var menus = {
    saving: [ FILE_ID, saving ],
    history: [ EDIT_ID, history ],
    selection: [ EDIT_ID, selection ]
  };

  forEach(items, function(args, item) {
    var menu,
        fn;

    if (menus[item]) {
      menu = menus[item][0];
      fn = menus[item][1];

      if (!updateItems[menu]) {
        updateItems[menu] = [];
      }

      if (!Array.isArray(args)) {
        args = [ args ];
      }

      updateItems[menu].push(fn.apply(null, args));
    }
  });

  forEach(updateItems, function(menuItems, menu) {
    menusUpdate.push({
      id: menu,
      data: flatten(menuItems)
    });
  });

  browser.updateMenus(notation, menusUpdate);
}

module.exports.update = update;
