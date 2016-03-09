'use strict';

var merge = require('lodash/object/merge'),
    bind = require('lodash/function/bind'),
    assign = require('lodash/object/assign'),
    find = require('lodash/collection/find'),
    filter = require('lodash/collection/filter'),
    map = require('lodash/collection/map'),
    debounce = require('lodash/function/debounce');

var inherits = require('inherits');

var BaseComponent = require('base/component'),
    MenuBar = require('base/components/menu-bar'),
    Tabbed = require('base/components/tabbed');

var MultiButton = require('base/components/buttons/multi-button'),
    Button = require('base/components/buttons/button'),
    Separator = require('base/components/buttons/separator');

var BpmnProvider = require('./tabs/bpmn/provider'),
    DmnProvider = require('./tabs/dmn/provider');

var EmptyTab = require('./tabs/empty-tab');

var Footer = require('./footer');

var ensureOpts = require('util/ensure-opts'),
    series = require('util/async/series'),
    isUnsaved = require('util/file/is-unsaved'),
    parseFileType = require('./util/parse-file-type'),
    namespace = require('./util/namespace'),
    fileDrop = require('./util/dom/file-drop');

var debug = require('debug')('app');


/**
 * The main application entry point
 */
function App(options) {

  ensureOpts([
    'logger',
    'events',
    'dialog',
    'fileSystem'
  ], options);

  BaseComponent.call(this, options);


  this.layout = {
    propertiesPanel: {
      open: false,
      width: 250
    },
    log: {
      open: false,
      height: 150
    }
  };

  var EXPORT_BUTTONS = {
    png: {
      id: 'png',
      action: this.compose('triggerAction', 'export-tab', { type: 'png' }),
      label: 'Export as PNG',
      icon: 'icon-picture',
      primary: true
    },
    jpeg: {
      id: 'jpeg',
      action: this.compose('triggerAction', 'export-tab', { type: 'jpeg' }),
      label: 'Export as JPEG'
    },
    svg: {
      id: 'svg',
      action: this.compose('triggerAction', 'export-tab', { type: 'svg' }),
      label: 'Export as SVG'
    }
  };

  this.menuEntries = [
    MultiButton({
      id: 'create',
      choices: [
        {
          id: 'create-bpmn-diagram',
          action: this.compose('triggerAction', 'create-bpmn-diagram'),
          label: 'Create new BPMN Diagram',
          icon: 'icon-new',
          primary: true
        },
        {
          id: 'create-dmn-diagram',
          action: this.compose('triggerAction', 'create-dmn-diagram'),
          label: 'Create new DMN Table'
        }
      ]
    }),
    Button({
      id: 'open',
      icon: 'icon-open',
      label: 'Open a Diagram',
      action: this.compose('triggerAction', 'open-diagram')
    }),
    Separator(),
    Button({
      id: 'save',
      icon: 'icon-save-normal',
      label: 'Save Diagram',
      action: this.compose('triggerAction', 'save')
    }),
    Button({
      id: 'save-as',
      icon: 'icon-save-as',
      label: 'Save Diagram as...',
      action: this.compose('triggerAction', 'save-as')
    }),
    Separator(),
    Button({
      id: 'undo',
      icon: 'icon-undo',
      label: 'Undo',
      action: this.compose('triggerAction', 'undo'),
      disabled: true
    }),
    Button({
      id: 'redo',
      icon: 'icon-redo',
      label: 'Redo',
      action: this.compose('triggerAction', 'redo'),
      disabled: true
    }),
    Separator(),
    MultiButton({
      id: 'export-as',
      disabled: true,
      choices: map(EXPORT_BUTTONS, function(btn) {
        return btn;
      })
    })
  ];

  this.tabs = [
    EmptyTab({
      id: 'empty-tab',
      label: '+',
      title: 'Create new Diagram',
      action: this.compose('triggerAction', 'create-bpmn-diagram'),
      closable: false,
      app: this,
      events: this.events
    })
  ];

  this.activeTab = this.tabs[0];


  this.events.on('workspace:changed', debounce(() => {
    this.persistWorkspace(function(err) {
      debug('workspace persisted?', err);
    });
  }, 100));


  this.events.on('tools:state-changed', (tab, newState) => {

    var button;

    if (this.activeTab !== tab) {
      debug('Warning: state updated on incative tab! This should never happen!');
      return;
    }

    // update undo/redo/export based on state
    [ 'undo', 'redo' ].forEach((key) => {
      this.updateMenuEntry(key, !newState[key]);
    });

    debug('tools:state-changed', newState);

    // update export button state
    button = find(this.menuEntries, { id: 'export-as' });

    button.choices = (newState['exportAs'] || []).map((type) => {
      return EXPORT_BUTTONS[type];
    });

    if (button.choices.length) {
      button.disabled = false;
      button.choices[0] = assign({}, button.choices[0], { icon: 'icon-picture', primary: true });
    } else {
      button.disabled = true;
      button.choices[0] = { icon: 'icon-picture', primary: true, label: 'Export as Image' };
    }

    // save and saveAs buttons
    // should work all the time as long as the
    // tab provides a save action
    [ 'save', 'save-as' ].forEach((key) => {
      var enabled = 'save' in newState;

      this.updateMenuEntry(key, !enabled);
    });

    this.events.emit('changed');
  });

  this.events.on('log:toggle', (options) => {

    var open = options && options.open;

    if (typeof open === 'undefined') {
      open = !(this.layout.log && this.layout.log.open);
    }

    this.events.emit('layout:update', {
      log: {
        open: open
      }
    });
  });

  this.logger.on('changed', this.events.composeEmitter('changed'));

  this.events.on('layout:update', newLayout => {
    this.layout = merge(this.layout, newLayout);

    this.events.emit('changed');
  });

  ///////// public API yea! //////////////////////////////////////

  /**
   * Listen to an app event
   *
   * @param {String} event
   * @param {Function} callbackFn
   */
  this.on = bind(this.events.on, this.events);

  /**
   * Emit an event via the app
   *
   * @param {String} event
   * @param {Object...} additionalArgs
   */
  this.emit = bind(this.events.emit, this.events);


  // bootstrap support for diagram files

  this.tabProviders = [
    this.createComponent(BpmnProvider, { app: this }),
    this.createComponent(DmnProvider, { app: this })
  ];
}

inherits(App, BaseComponent);

module.exports = App;


App.prototype.render = function() {
  var html =
    <div className="app" onDragover={ fileDrop(this.compose('filesDropped')) }>
      <MenuBar entries={ this.menuEntries } />
      <Tabbed
        className="main"
        tabs={ this.tabs }
        active={ this.activeTab }
        onSelect={ this.compose('selectTab') }
        onClose={ this.compose('closeTab') } />
      <Footer
        layout={ this.layout }
        log={ this.logger }
        events={ this.events } />
    </div>;

  return html;
};

/**
 * Create new application component with wired globals.
 *
 * @param {Function} Component constructor
 * @param {Object} [options]
 *
 * @return {Object} component instance
 */
App.prototype.createComponent = function(Component, options) {

  var actualOptions = assign(options || {}, {
    events: this.events,
    layout: this.layout,
    logger: this.logger,
    dialog: this.dialog
  });

  return new Component(actualOptions);
};

/**
 * Open a new tab based on a file chosen by the user.
 */
App.prototype.openDiagram = function() {

  var dialog = this.dialog;

  dialog.open((err, files) => {
    if (err) {
      dialog.openError(err, function() {
        debug('open-diagram canceled: %s', err);
      });

      return;
    }

    if (!files) {
      debug('open-diagram canceled: no file');

      return;
    }

    series(files, (file, done) => {
      var type = parseFileType(file);

      if (!type) {
        dialog.unrecognizedFileError(file, function(err) {
          debug('open-diagram canceled: unrecognized file type', file);

          return done(err);
        });

      } else {
        if (namespace.hasActivitiURL(file.contents)) {

          dialog.convertNamespace((err, answer) => {
            if (err) {
              debug('open-diagram error: %s', err);

              return done(err);
            }

            if (isCancel(answer)) {
              return done(null);
            }

            if (answer === 'yes') {
              file.contents = namespace.replace(file.contents);
            }

            done(null, assign(file, { fileType: type }));
          });
        } else {
          done(null, assign(file, { fileType: type }));
        }
      }
    }, (err, diagramFiles) => {
      if (err) {
        return debug('open-diagram canceled: %s', err);
      }

      diagramFiles = filter(diagramFiles, (file) => {
        return !!file;
      });

      this.openTabs(diagramFiles);
    });
  });
};

App.prototype.triggerAction = function(action, options) {

  debug('trigger-action', action, options);

  var activeTab = this.activeTab;

  if (action === 'create-bpmn-diagram') {
    return this.createDiagram('bpmn');
  }

  if (action === 'create-dmn-diagram') {
    return this.createDiagram('dmn');
  }

  if (action === 'open-diagram') {
    return this.openDiagram();
  }

  if (action === 'save-all') {
    return this.saveAllTabs();
  }

  if (action === 'quit') {
    return this.quit();
  }

  if (activeTab) {

    if (action === 'close-active-tab') {
      if (activeTab.closable) {
        this.closeTab(this.activeTab);
      }
    }

    // handle special actions
    if (action === 'save' && activeTab.save) {
      return this.saveTab(activeTab);
    }

    if (action === 'save-as' && activeTab.save) {
      return this.saveTab(activeTab, { saveAs: true });
    }

    if (action === 'export-tab' && activeTab.exportAs) {
      return this.exportTab(activeTab, options.type);
    }

    // forward other actions to active tab
    activeTab.triggerAction(action, options);
  }
};

/**
 * Create diagram of the specific type.
 *
 * @param {String} type
 * @return {Tab} created diagram tab
 */
App.prototype.createDiagram = function(type) {
  var tabProvider = this._findTabProvider(type);

  var file = tabProvider.createNewFile();

  return this.openTab(file);
};


/**
 * Open tabs for the given files and make sure an appropriate
 * tab is selected and tabs are not opened twice.
 *
 * This method does not do any validation on the file internals
 * and assumes the creation of tabs for given files does not fail
 * (tabs should be robust and handle opening errors internally).
 *
 * @param {Array<FileDescriptor>} files
 * @return {Array<Tab>} return the opened tabs
 */
App.prototype.openTabs = function(files) {

  if (!Array.isArray(files)) {
    throw new Error('expected Array<FileDescriptor> argument');
  }

  if (!files.length) {
    return;
  }

  var openedTabs = files.map((file) => {

    // make sure we do not double open tabs
    // for the same file
    return this.findTab(file) || this._createTab(file);
  });

  // select the last opened tab
  this.selectTab(openedTabs[openedTabs.length - 1]);

  return openedTabs;
};

/**
 * Open a single tab.
 *
 * @param {FileDescriptor} file
 * @return {Tab} the opened tab
 */
App.prototype.openTab = function(file) {
  return this.openTabs([ file ])[0];
};

/**
 * Create a new tab from the given file and add it
 * to the application.
 *
 * @param {FileDescriptor} file
 * @param {Object} options
 */
App.prototype._createTab = function(file, options) {
  var tabProvider = this._findTabProvider(file.fileType);

  return this._addTab(tabProvider.createTab(file));
};


/**
 * Save all open tabs
 */
App.prototype.saveAllTabs = function() {

  debug('saving all open tabs');

  var activeTab = this.activeTab;

  series(this.tabs, (tab, done) => {
    if (!tab.save || !tab.dirty) {
      // skipping tabs that cannot save or are dirty
      return done(null);
    }

    this.selectTab(tab);

    this.saveTab(tab, function(err, savedFile) {

      if (err || !savedFile) {
        return done(err || userCanceled());
      }

      return done(null, savedFile);
    });
  }, (err) => {
    if (err) {
      return debug('save all canceled', err);
    }

    debug('save all finished');

    // restore active tab
    this.selectTab(activeTab);
  });
};

/**
 * Export the given tab with an image type.
 *
 * @param {Tab} tab
 * @param {String} [type]
 * @param {Function} [done]
 */
App.prototype.exportTab = function(tab, type, done) {
  if (!tab) {
    throw new Error('need tab to save');
  }

  if (!tab.save) {
    throw new Error('tab cannot #save');
  }

  done = done || function(err, savedFile) {
    if (err) {
      debug('export error: %s', err);
    } else if (!savedFile) {
      debug('export user canceled');
    } else {
      debug('exported %s \n%s', tab.id, savedFile.contents);
    }
  };

  tab.exportAs(type, (err, file) => {
    if (err) {
      return done(err);
    }

    this.saveFile(file, true, done);
  });
};

/**
 * Find the open tab for the given file, if any.
 *
 * @param {FileDescriptor} file
 * @return {Tab}
 */
App.prototype.findTab = function(file) {

  if (isUnsaved(file)) {
    return null;
  }

  return find(this.tabs, function(t) {
    var tabPath = (t.file ? t.file.path : null);
    return file.path === tabPath;
  });
};

/**
 * Find a tab provider for the given file type.
 *
 * @param {String} fileType
 *
 * @return {TabProvider}
 */
App.prototype._findTabProvider = function(fileType) {

  var tabProvider = find(this.tabProviders, function(provider) {
    return provider.canCreate(fileType);
  });

  if (!tabProvider) {
    throw noTabProvider(fileType);
  }

  return tabProvider;
};

/**
 * Save the given tab with optional new name and
 * path (passed via options).
 *
 * The saved file is passed as the second argument to the
 * provided callback, unless the user canceled the save operation.
 *
 * @param {Tab} tab
 * @param {Object} [options]
 * @param {Function} [done] invoked with (err, savedFile)
 */
App.prototype.saveTab = function(tab, options, done) {

  var dialog = this.dialog;

  if (!tab) {
    throw new Error('need tab to save');
  }

  if (typeof options === 'function') {
    done = options;
    options = undefined;
  }

  done = done || function(err) {
    if (err) {
      dialog.saveError(err, function() {
        debug('error: %s', err);
      });
    }
  };

  var updateTab = (err, savedFile) => {

    if (err) {
      debug('not gonna update tab: %s', err);
      return done(err);
    }

    if (!savedFile) {
      debug('save file canceled');
      return done();
    }

    debug('saved %s', tab.id);

    // finally saved...
    tab.setFile(savedFile);

    this.events.emit('workspace:changed');

    return done(null, savedFile);
  };

  var saveAs;

  debug('saving %s', tab.id);

  tab.save((err, file) => {

    if (err) {
      return done(err);
    }

    debug('exported %s \n%s', tab.id, file.contents);

    saveAs = isUnsaved(file) || options && options.saveAs;

    this.saveFile(file, saveAs, updateTab);
  });
};


/**
 * Save the given file and invoke callback with (err, savedFile).
 *
 * @param {FileDescriptor} file
 * @param {Boolean} saveAs whether to ask the user for a file name
 * @param {Function} done
 */
App.prototype.saveFile = function(file, saveAs, done) {
  var dialog = this.dialog,
      fileSystem = this.fileSystem;

  if (!saveAs) {
    return fileSystem.writeFile(assign({}, file), done);
  }

  dialog.saveAs(file, (err, suggestedFile) => {

    if (err) {
      debug('save file error', err);
      return done(err);
    }

    if (!suggestedFile) {
      debug('save file canceled');
      return done();
    }

    debug('save file %s as %s', file.name, suggestedFile.path);

    fileSystem.writeFile(assign({}, file, suggestedFile), done);
  });
};


/**
 * Handles file dragging directly into modeler window
 *
 * @param {Array<File>} files File definitions passed on dragging
 */
App.prototype.filesDropped = function(files) {

  var dialog = this.dialog;

  function withType(file) {
    var type = parseFileType(file);

    if (!type) {
      dialog.unrecognizedFileError(file, function() {
        debug('file drop rejected: unrecognized file type', file);
      });

      // we skip this file
      return null;
    } else {
      return assign({}, file, { fileType: type });
    }
  }

  function withoutEmpty(f) {
    return f;
  }

  // parse type + filter unrecognized files
  var actualFiles = files.map(withType).filter(withoutEmpty);

  // create tabs for files
  this.openTabs(actualFiles);
};


/**
 * Select the given tab. May also be used to deselect all tabs
 * (empty selection) when passing null.
 *
 * @param {Tab} tab
 */
App.prototype.selectTab = function(tab) {
  debug('selecting tab with id: ' + tab.id);

  var exists = contains(this.tabs, tab);

  if (tab && !exists) {
    throw new Error('non existing tab');
  }

  this.activeTab = tab;

  if (tab) {
    tab.emit('focus');

    this.logger.info('switch to <%s> tab', tab.id);
  }

  this.events.emit('workspace:changed');

  this.events.emit('changed');
};

/**
 * Close the given tab. If the user aborts the operation
 * (i.e. cancels it via dialog choice) the callback will
 * be evaluated with (null, 'canceled').
 *
 * @param {Tab} tab
 * @param {Function} [done] passed with (err, status=(canceled, ...))
 */
App.prototype.closeTab = function(tab, done) {

  debug('close tab', tab);

  var tabs = this.tabs,
      dialog = this.dialog,
      file;

  var exists = contains(tabs, tab);

  if (!exists) {
    throw new Error('non existing tab');
  }

  if (typeof done !== 'function') {
    done = function(err) {
      if (err) {
        debug('error: %s', err);
      }
    };
  }

  // close normally when file is already saved
  if (!tab.dirty) {
    return this._closeTab(tab, done);
  }

  file = tab.file;

  dialog.close(file, (err, result) => {
    debug('---->', err, result);

    if (isCancel(result)) {
      debug('close-tab canceled: %s', err);

      return done(userCanceled());
    }

    if (err) {
      debug('close-tab error: %s', err);
      return done(err);
    }

    // close without saving
    if (result === 'close') {
      return this._closeTab(tab, done);
    }

    // save and then close the tab
    this.saveTab(tab, (err, savedFile) => {
      if (err) {
        debug('save-tab error: %s', err);

        return done(err);
      }

      return this._closeTab(tab, done);
    });
  });
};

App.prototype._closeTab = function(tab, done) {
  var tabs = this.tabs,
      events = this.events;

  events.emit('tab:close', tab);

  var idx = tabs.indexOf(tab);

  // remove tab from selection
  tabs.splice(idx, 1);

  // if tab was active, select previous (if exists) or next tab
  if (tab === this.activeTab) {
    this.selectTab(tabs[idx - 1] || tabs[idx]);
  }

  events.emit('workspace:changed');

  events.emit('changed');

  return done();
};

/**
 * Add a tab to the app at an appropriate position.
 *
 * @param {Tab} tab
 * @return {Tab} the added tab
 */
App.prototype._addTab = function(tab) {

  var tabs = this.tabs,
      events = this.events;

  // always add tab right before the EMPTY_TAB
  // TODO(vlad): make adding before empty tab more explicit
  tabs.splice(tabs.length - 1, 0, tab);

  events.emit('workspace:changed');
  events.emit('changed');

  return tab;
};

/**
 * Persist the current workspace state
 *
 * @param {Function} done
 */
App.prototype.persistWorkspace = function(done) {

  var config = {
    tabs: [],
    activeTab: -1
  };

  // store tabs
  this.tabs.forEach((tab, idx) => {

    var file = tab.file;

    // do not persist unsaved files
    if (!file || file.path === '[unsaved]') {
      return;
    }

    config.tabs.push({
      name: file.name,
      contents: file.contents,
      path: file.path,
      fileType: file.fileType
    });

    // store saved active tab index
    if (tab === this.activeTab) {
      config.activeTab = config.tabs.length - 1;
    }
  });

  // store layout
  config.layout = this.layout;

  // let others store stuff, too
  this.events.emit('workspace:persist', config);

  // actually save
  this.workspace.save(config, (err, config) => {
    this.events.emit('workspace:persisted', err, config);

    done(err, config);
  });
};

/**
 * Restore previously saved workspace, if any exists.
 *
 * @param {Function} done
 */
App.prototype.restoreWorkspace = function(done) {

  var defaultConfig = {
    tabs: [],
    layout: {
      propertiesPanel: {
        open: false,
        width: 250
      },
      log: {
        open: false,
        height: 150
      }
    }
  };

  this.workspace.load(defaultConfig, (err, config) => {

    if (err) {
      debug('workspace load error', err);

      return done(err);
    }

    // restore tabs
    if (config.tabs) {
      this.openTabs(config.tabs);
    }

    if (config.activeTab !== undefined) {
      this.activeTab = this.tabs[config.activeTab];
    }

    this.events.emit('changed');

    this.events.emit('workspace:restored');

    // we are done
    done(null, config);
  });

};


/**
 * Enables/disables any (button) menu entries
 *
 * @param  {String} id
 * @param  {Boolean} isDisabled
 */
App.prototype.updateMenuEntry = function (id, isDisabled) {
  var button = find(this.menuEntries, { id: id });

  button.disabled = isDisabled;

  this.events.emit('changed');
};

/**
 * Start application.
 */
App.prototype.run = function() {

  this.selectTab(this.tabs[0]);

  this.restoreWorkspace(function(err) {
    if (err) {
      debug('workspace restore error', err);
    } else {
      debug('workspace restored');
    }
  });
  this.events.emit('changed');
};


App.prototype.quit = function() {
  debug('initiating application quit');

  var dirtyTabs = this.tabs.filter(function(tab) {
    return tab.dirty;
  });

  series(dirtyTabs, (tab, done) => {

    this.selectTab(tab);

    // Make sure newly selected tab is rendered
    this.closeTab(tab, (err) => {
      if (err) {
        return done(err);
      }

      debug('tab closed, processing next tab...');

      done(null);
    });

  }, (err) => {
    if (err) {
      debug('quit aborted');

      return this.events.emit('quit-aborted');
    }
    debug('shutting down application');

    return this.events.emit('quitting');
  });
};


function contains(collection, element) {
  return collection.some(function(e) {
    return e === element;
  });
}

function isCancel(userChoice) {
  return userChoice === 'cancel';
}

function userCanceled() {
  return new Error('user canceled');
}

function noTabProvider(fileType) {
  throw new Error('missing provider for file <' + fileType + '>');
}