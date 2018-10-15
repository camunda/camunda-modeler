'use strict';

import {
  merge,
  bind,
  assign,
  find,
  filter,
  matchPattern,
  debounce
} from 'min-dash';

var inherits = require('inherits');

var BaseComponent = require('base/component'),
    MenuBar = require('base/components/menu-bar'),
    Tabbed = require('base/components/tabbed'),
    ModalOverlay = require('base/components/modal-overlay');

var MultiButton = require('base/components/buttons/multi-button'),
    ColorPickerButton = require('base/components/buttons/color-picker-button'),
    Button = require('base/components/buttons/button'),
    Separator = require('base/components/buttons/separator');

var BpmnProvider = require('./tabs/bpmn/provider'),
    DmnProvider = require('./tabs/dmn/provider'),
    CmmnProvider = require('./tabs/cmmn/provider');

var EmptyTab = require('./tabs/empty-tab');

var Footer = require('./footer');

var ensureOpts = require('util/ensure-opts'),
    series = require('util/async/series'),
    isUnsaved = require('util/file/is-unsaved'),
    parseFileType = require('./util/parse-file-type'),
    namespace = require('./util/namespace'),
    fileDrop = require('./util/dom/file-drop');

var debug = require('debug')('app');

var EXPORT_OPTIONS = {
  'png': 'PNG image',
  'jpeg': 'JPEG image',
  'svg': 'SVG image'
};

/**
 * The main application entry point
 */
function App(options) {

  ensureOpts([
    'logger',
    'events',
    'dialog',
    'fileSystem',
    'config',
    'plugins',
    'metaData'
  ], options);

  BaseComponent.call(this, options);


  this.state = {};

  this.layout = {
    propertiesPanel: {
      open: false,
      width: 250
    },
    log: {
      open: false,
      height: 150
    },
    minimap: {
      open: false
    }
  };

  this.menuEntries = {
    modeler: {
      visible: true,
      name: 'modeler',
      buttons: [
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
              id: 'create-dmn-table',
              action: this.compose('triggerAction', 'create-dmn-table'),
              label: 'Create new DMN Table'
            },
            {
              id: 'create-dmn-diagram',
              action: this.compose('triggerAction', 'create-dmn-diagram'),
              label: 'Create new DMN Diagram (DRD)'
            },
            {
              id: 'create-cmmn-diagram',
              action: this.compose('triggerAction', 'create-cmmn-diagram'),
              label: 'Create new CMMN Diagram'
            }
          ]
        }),
        Button({
          id: 'open',
          group: 'modeler',
          icon: 'icon-open',
          label: 'Open a Diagram',
          action: this.compose('triggerAction', 'open-diagram')
        }),
        Separator(),
        Button({
          id: 'save',
          group: 'modeler',
          icon: 'icon-save-normal',
          label: 'Save Diagram',
          action: this.compose('triggerAction', 'save')
        }),
        Button({
          id: 'save-as',
          group: 'modeler',
          icon: 'icon-save-as',
          label: 'Save Diagram as...',
          action: this.compose('triggerAction', 'save-as')
        }),
        Separator(),
        Button({
          id: 'undo',
          group: 'modeler',
          icon: 'icon-undo',
          label: 'Undo',
          action: this.compose('triggerAction', 'undo'),
          disabled: true
        }),
        Button({
          id: 'redo',
          group: 'modeler',
          icon: 'icon-redo',
          label: 'Redo',
          action: this.compose('triggerAction', 'redo'),
          disabled: true
        }),
        Separator(),
        Button({
          id: 'export-as',
          group: 'modeler',
          label: 'Export as Image',
          icon: 'icon-picture',
          action: this.compose('triggerAction', 'export-tab'),
          disabled: true
        })
      ]
    },
    bpmn: {
      visible: false,
      name: 'bpmn',
      buttons: [
        Separator(),
        ColorPickerButton({
          id: 'set-color',
          icon: 'icon-set-color-tool',
          label: 'Set Color',
          action: this.compose('triggerAction', 'setColor'),
          disabled: true,
          colors: [
            { fill: undefined, stroke: undefined, label: 'None' }, // default
            { fill: '#BBDEFB', stroke: '#1E88E5', label: 'Blue' }, // blue
            { fill: '#FFE0B2', stroke: '#FB8C00', label: 'Orange' }, // orange
            { fill: '#C8E6C9', stroke: '#43A047', label: 'Green' }, // green
            { fill: '#FFCDD2', stroke: '#E53935', label: 'Red' }, // red
            { fill: '#E1BEE7', stroke: '#8E24AA', label: 'Purple' } // purple
          ]
        }),
        Separator(),
        Button({
          id: 'align-left',
          icon: 'icon-align-left-tool',
          label: 'Align Elements to the Left',
          action: this.compose('triggerAction', 'alignElements', {
            type: 'left'
          })
        }),
        Button({
          id: 'align-center',
          icon: 'icon-align-horizontal-center-tool',
          label: 'Align Elements to the Center',
          action: this.compose('triggerAction', 'alignElements', {
            type: 'center'
          })
        }),
        Button({
          id: 'align-right',
          icon: 'icon-align-right-tool',
          label: 'Align Elements to the Right',
          action: this.compose('triggerAction', 'alignElements', {
            type: 'right'
          })
        }),
        Button({
          id: 'align-top',
          icon: 'icon-align-top-tool',
          label: 'Align Elements to the Top',
          action: this.compose('triggerAction', 'alignElements', {
            type: 'top'
          })
        }),
        Button({
          id: 'align-middle',
          icon: 'icon-align-vertical-center-tool',
          label: 'Align Elements to the Middle',
          action: this.compose('triggerAction', 'alignElements', {
            type: 'middle'
          })
        }),
        Button({
          id: 'align-bottom',
          icon: 'icon-align-bottom-tool',
          label: 'Align Elements to the Bottom',
          action: this.compose('triggerAction', 'alignElements', {
            type: 'bottom'
          })
        }),
        Separator(),
        Button({
          id: 'distribute-horizontally',
          icon: 'icon-distribute-horizontally-tool',
          label: 'Distribute Elements Horizontally',
          action: this.compose('triggerAction', 'distributeHorizontally')
        }),
        Button({
          id: 'distribute-bottom',
          icon: 'icon-distribute-vertically-tool',
          label: 'Distribute Elements Vertically',
          action: this.compose('triggerAction', 'distributeVertically')
        }),
      ]
    },
    editor: {
      visible: false,
      buttons: [
       /* Separator(),
        MultiButton({
          id: 'deploy',
          choices: [
            {
              id: 'deploy-btn',
              icon: 'icon-deploy',
              label: 'Deploy Current Diagram',
              action: this.compose('triggerAction', 'open-deployment-overlay'),
              primary: true
            },
            {
              id: 'deploy-endpoint-config',
              label: 'Configure Deployment Endpoint',
              action: this.compose('triggerAction', 'open-endpoint-overlay')
            }
          ]
        })
        */
      ]
    }
  };

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

  this.activeTab = null;

  this.fileHistory = [];


  this.events.on('deploy:endpoint:update', endpoints => {
    this.persistEndpoints(endpoints);
  });

  this.events.on('deploy', (payload, done) => {
    this.triggerAction('deploy', payload, done);
  });

  this.events.on('workspace:changed', debounce((done) => {
    this.persistWorkspace((err) => {
      debug('workspace persisted?', err);

      // this is to prevent a race condition when quitting the app
      if (done) {
        done(err);
      }
    });
  }, 100));


  this.events.on('tools:state-changed', (tab, newState) => {

    var button, selectedEditor;

    if (this.activeTab !== tab) {
      return debug('Warning: state updated on incative tab! This should never happen!');
    }

    // update undo/redo/export based on state
    [ 'undo', 'redo' ].forEach((key) => {
      this.updateMenuEntry('modeler', key, !newState[key]);
    });

    debug('tools:state-changed', newState);

    [ 'bpmn', 'cmmn', 'dmn' ].forEach((key) => {
      if (newState[key] && this.menuEntries[key]) {

        this.menuEntries[key].visible = true;
      } else if (this.menuEntries[key]) {

        this.menuEntries[key].visible = false;
      }
    });

    // check if the selected tab is an editor to make the editor option visible or not
    selectedEditor = [ 'bpmn', 'cmmn', 'dmn' ].filter(key => newState[key])[0];

    if (selectedEditor) {
      this.menuEntries.editor.visible = true;
      this.menuEntries.editor.name = selectedEditor;
    } else {
      this.menuEntries.editor.visible = false;
      this.menuEntries.editor.name = null;
    }

    // update export button state
    button = find(this.menuEntries.modeler.buttons, matchPattern({
      id: 'export-as'
    }));

    button.choices = (newState['exportAs'] || []);

    if (button.choices.length) {
      button.disabled = false;
    } else {
      button.disabled = true;
    }

    // save and saveAs buttons
    // should work all the time as long as the
    // tab provides a save action
    [ 'save', 'save-as' ].forEach((key) => {
      var enabled = 'save' in newState;

      this.updateMenuEntry('modeler', key, !enabled);
    });

    // update set color button state
    button = find(this.menuEntries.bpmn.buttons, matchPattern({
      id: 'set-color'
    }));
    button.disabled = !newState.elementsSelected;



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

  this.events.on('dialog-overlay:toggle', this.compose('toggleOverlay'));

  // public API yea! //////////////////

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
    this.createComponent(BpmnProvider, { app: this, plugins: this.plugins }),
    this.createComponent(DmnProvider, { app: this }),
    this.createComponent(CmmnProvider, { app: this })
  ];

  // let other components know that the window has been resized
  window.addEventListener('resize', this.events.composeEmitter('window:resized'));

  window.addEventListener('focusin', this.events.composeEmitter('input:focused'));
}

inherits(App, BaseComponent);

module.exports = App;


App.prototype.render = function() {

  var html =
    <div className="app" onDragover={ fileDrop(this.compose('openFiles')) }>
      <ModalOverlay
        initializeState={ this.initializeState.bind(this) }
        isActive={ this._activeOverlay }
        content={ this._overlayContent }
        events={ this.events }
        endpoints={ this.endpoints } />
      <MenuBar entries={ this.menuEntries } />
      <Tabbed
        className="main"
        tabs={ this.tabs }
        active={ this.activeTab }
        onDragTab={ this.compose('shiftTab') }
        onSelect={ this.compose('selectTab') }
        onContextMenu={ this.compose('openTabContextMenu') }
        onClose={ this.compose('closeTab') } />
      <Footer
        layout={ this.layout }
        log={ this.logger }
        events={ this.events } />
    </div>;

  return html;
};

App.prototype.openTabContextMenu = function(tab, evt) {
  // do not open a context-menu on the 'empty tab'
  if (tab.empty) {
    return;
  }

  debug('opening context-menu', tab);

  this.emit('context-menu:open', 'tab', { tabId: tab.id });
};

App.prototype.toggleOverlay = function(isOpened) {

  if (typeof isOpened === 'string') {
    this._activeOverlay = true;

    this._overlayContent = isOpened;
  } else {
    this._activeOverlay = isOpened;

    this._overlayContent = null;
  }

  this.events.emit('changed');
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
    dialog: this.dialog,
    config: this.config
  });

  return new Component(actualOptions);
};


/**
 * Opens bare files descriptors, that have not been yet validated or processed.
 *
 * @param  {Array<FileDescriptor>} files
 */
App.prototype.openFiles = function(files) {

  var dialog = this.dialog;

  series(files, (file, done) => {

    if (!file.contents.length) {

      // handle empty files
      var fileType = file.name.split('.').pop();

      if ([ 'bpmn', 'dmn', 'cmmn' ].indexOf(fileType) === -1) {
        return dialog.unrecognizedFileError(file, function(err) {
          debug('open-diagram canceled: unrecognized file type', file);

          return done(err);
        });
      }

      var options = {
        fileType: fileType,
        name: file.name
      };

      dialog.openEmptyFile(options, (err, answer) => {

        if (isCancel(answer)) {
          return done();
        }

        if (answer === 'create') {
          var tabProvider = this._findTabProvider(fileType);

          return done(null, tabProvider.createNewFile({
            name: file.name,
            path: file.path
          }));
        }
      });
    } else {
      var type = parseFileType(file);

      if (!type) {
        dialog.unrecognizedFileError(file, function(err) {
          debug('open-diagram canceled: unrecognized file type', file);

          return done(err);
        });

      } else {

        // handle old namespaces
        if (namespace.hasOldNamespace(file.contents)) {

          dialog.convertNamespace(type, (err, answer) => {
            if (err) {
              debug('open-diagram error: %s', err);

              return done(err);
            }

            if (isCancel(answer)) {
              return done(null);
            }

            if (answer === 'yes') {
              file.contents = namespace.replace(file.contents, type);
            }

            done(null, assign({}, file, { fileType: type }));
          });
        } else {
          done(null, assign({}, file, { fileType: type }));
        }
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
};


/**
 * Open a new tab based on a file chosen by the user.
 */
App.prototype.openDiagram = function() {
  var dialog = this.dialog;

  var cwd = getFilePath(this.activeTab);

  dialog.open(cwd, (err, files) => {
    if (err) {
      return dialog.openError(err, function() {
        debug('open-diagram canceled: %s', err);
      });
    }

    if (!files) {
      return debug('open-diagram canceled: no file');
    }

    this.openFiles(files);
  });
};


App.prototype.triggerAction = function(action, firstArg, secondArg) {

  /**
   * done: callback passed
   * this makes sure to support passing callback to this function
   * callback can be passed in 2nd or 3rd position
   */
  var self = this,
      options = firstArg,
      done = function() {};

  if (typeof firstArg === 'function') {
    done = firstArg;
    options = secondArg;
  } else if (typeof secondArg === 'function') {
    done = secondArg;
  }

  debug('trigger-action', action, options);

  var activeTab = this.activeTab;
  var browser = this.browser;


  if (action === 'select-tab') {
    if (options === 'next') {
      this.selectNext();

    }

    if (options === 'previous') {
      this.selectPrevious();
    }

    return;
  }

  if (action === 'create-bpmn-diagram') {
    return this.createDiagram('bpmn');
  }

  if (action === 'create-dmn-diagram') {
    return this.createDiagram('dmn');
  }

  if (action === 'create-dmn-table') {
    return this.createDiagram('dmn', { isTable: true });
  }

  if (action === 'create-cmmn-diagram') {
    return this.createDiagram('cmmn');
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

  if (action === 'close-all-tabs') {
    return this.closeAllTabs();
  }

  if (action === 'close-tab') {
    return this.closeTab(options && options.tabId);
  }

  if (action === 'close-other-tabs') {
    return this.closeOtherTabs(options && options.tabId);
  }

  if (action === 'reopen-last-tab') {
    return this.reopenLastTab();
  }

  if (action === 'show-shortcuts') {
    return this.toggleOverlay('shortcuts');
  }

  // Actions below require active tab
  if (!activeTab) {
    return;
  }

  if (action === 'close-active-tab') {
    if (activeTab.closable) {
      return this.closeTab(this.activeTab);
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

    let exportButton = find(this.menuEntries.modeler.buttons, matchPattern({
      id: 'export-as'
    }));

    let choices = exportButton.choices;

    if (!choices.length) {
      return;
    }

    return this.exportTab(activeTab, choices);
  }

  if (action === 'open-deployment-overlay') {

    // clear state of deployment modal
    this.setState({ DeploymentConfig: { } });

    // save tab before opening deployment modal
    return this.saveTab(activeTab, function(err) {

      if (err) {
        console.error('deploy:bpmn ' + err);

        return done(err);
      }

      return self.toggleOverlay('deployDiagram');
    });
  }

  if (action === 'open-endpoint-overlay') {
    return this.toggleOverlay('configureEndpoint');
  }

  if (action === 'deploy') {

    // make sure to save the active tab's file before deploying
    return this.saveTab(activeTab, function(err) {
      if (err) {
        console.error('deploy ' + err);

        return done(err);
      }

      var payload = {
        file: activeTab.file,
        deploymentName: options.deploymentName,
        tenantId: options.tenantId
      };

      browser.send('deploy', payload, function(err, response) {
        if (err) {
          console.error('deploy ' + err);

          return done(err);
        }

        return done();
      });
    });
  }

  // forward other actions to active tab
  activeTab.triggerAction(action, options);
};


/**
 * Create diagram of the specific type.
 *
 * @param {String} type
 * @return {Tab} created diagram tab
 */
App.prototype.createDiagram = function(type, attrs) {
  var tabProvider = this._findTabProvider(type);

  var file = tabProvider.createNewFile(attrs);

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
 * @param {Boolean} [select=true] whether to select the last opened tab
 *
 * @return {Array<Tab>} return the opened tabs
 */
App.prototype.openTabs = function(files, select) {

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

  if (select !== false) {
    // select the last opened tab
    this.selectTab(openedTabs[openedTabs.length - 1]);
  }

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
 */
App.prototype._createTab = function(file) {
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
 * @param {Array<String>} choices
 * @param {Function} [done]
 */
App.prototype.exportTab = function(tab, choices, done) {
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

  var exportOptions = choices.map((c) => {
    return {
      name: EXPORT_OPTIONS[c],
      extensions: [ c ]
    };
  });


  var dialog = this.dialog,
      fileSystem = this.fileSystem;

  dialog.exportAs(tab.file, exportOptions, (err, suggestedFile) => {

    if (err || !suggestedFile) {
      return done(err || userCanceled());
    }

    var type = suggestedFile.fileType;

    if (!EXPORT_OPTIONS[type]) {
      return done(new Error('cannot export to <' + type + '>'));
    }

    tab.exportAs(type, (err, file) => {
      if (err) {
        return done(err);
      }

      fileSystem.writeFile(assign({}, file, { path: suggestedFile.path }), done);
    });
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

      return done(null, 'cancel');
    }

    debug('saved %s', tab.id);

    // finally saved...
    tab.setFile(savedFile);

    this.events.emit('workspace:changed');

    return done(null, savedFile);
  };

  debug('saving %s', tab.id);

  // keep track of current active tab
  var activeTab = this.activeTab;

  // making sure tab is selected before save
  this.selectTab(tab);

  tab.save((err, file) => {
    // restore last active tab
    this.selectTab(activeTab);

    if (err) {
      return done(err);
    }

    debug('exported %s \n%s', tab.id, file.contents);

    var saveAs = !file.path || options && options.saveAs;

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
  var self = this;

  var dialog = this.dialog,
      fileSystem = this.fileSystem;

  function handleFileError(err, savedFile) {
    if (err) {
      return dialog.savingDenied(function(err, choice) {
        if (err) {
          debug('save file canceled: %s', err);

          return done(err);
        }

        if (isCancel(choice)) {
          return;
        }

        self.saveFile(file, { saveAs: true }, done);
      });
    }

    done(null, savedFile);
  }

  if (!saveAs) {
    file.isUnsaved = false;

    return fileSystem.writeFile(assign({}, file), handleFileError);
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

    file.isUnsaved = false;

    fileSystem.writeFile(assign({}, file, suggestedFile), handleFileError);
  });
};


/**
 * Select the given tab. May also be used to deselect all tabs
 * (empty selection) when passing null.
 *
 * @param {Tab} tab
 */
App.prototype.selectTab = function(tab) {
  debug('selecting tab');

  var exists = contains(this.tabs, tab);

  if (tab && !exists) {
    throw new Error('non existing tab');
  }

  this.activeTab = tab;

  if (tab) {
    tab.emit('focus');

    this.recheckTabContent(tab);
  }


  this.events.emit('workspace:changed');

  this.events.emit('changed');
};


/**
 * Select next or previous non-empty tab.
 * Defaults to previous tab.
 *
 * @param  {Boolean} isNext
 */
App.prototype._selectWithDirection = function(isNext) {
  var nonEmptyTabs = filter(this.tabs, function(t) {
    return !t.empty;
  });

  if (nonEmptyTabs.length < 2) {
    return;
  }

  var i = nonEmptyTabs.indexOf(this.activeTab);

  if (isNext) {
    i = (i + 1) % nonEmptyTabs.length;
  } else {
    i = (i - 1 + nonEmptyTabs.length) % nonEmptyTabs.length;
  }

  this.selectTab(nonEmptyTabs[i]);
};


/**
 * Select next non-empty tab
 */
App.prototype.selectNext = function() {
  this._selectWithDirection(true);
};


/**
 * Select previus non-empty tab
 */
App.prototype.selectPrevious = function() {
  this._selectWithDirection(false);
};


/**
 * Close the given tab. If the user aborts the operation
 * (i.e. cancels it via dialog choice) the callback will
 * be evaluated with (null, 'canceled').
 *
 * @param {Tab} tab
 * @param {Function} [done] passed with (err, status=(canceled, ...))
 * @param {Object} [hints]
 */
App.prototype.closeTab = function(tab, done, hints) {

  debug('close tab', tab);

  var tabs = this.tabs,
      dialog = this.dialog,
      exists,
      file;

  if (typeof tab === 'string') {
    tab = exists = find(this.tabs, matchPattern({ id: tab }));
  } else {
    exists = contains(tabs, tab);
  }

  if (!exists) {
    throw new Error('non existing tab');
  }

  if (typeof done === 'object') {
    hints = done;
    done = function(err) {
      if (err) {
        debug('error: %s', err);
      }
    };
  }

  if (typeof done !== 'function') {
    done = function(err) {
      if (err) {
        debug('error: %s', err);
      }
    };
  }

  hints = hints || {};

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
    if (isDiscard(result)) {
      if (hints.skipIfDiscardChanges) {
        return done();
      } else {
        return this._closeTab(tab, done);
      }
    }

    // save and then close the tab
    this.saveTab(tab, (err, savedFile) => {
      if (err) {
        debug('save-tab error: %s', err);

        return done(err);
      }

      if (isCancel(savedFile)) {
        debug('close-tab canceled: %s', err);

        return done(userCanceled());
      }

      return this._closeTab(tab, done);
    });
  });
};


/**
 * Close given tab and select other tab, if current one is active.
 *
 * @param  {Tab}   tab
 * @param  {Function} done
 */
App.prototype._closeTab = function(tab, done) {
  var tabs = this.tabs,
      events = this.events;

  tab.emit('destroy');

  events.emit('tab:close', tab);

  var idx = tabs.indexOf(tab);

  // remove tab from selection
  tabs.splice(idx, 1);

  // if tab was active, select previous (if exists) or next tab
  if (tab === this.activeTab) {
    this.selectTab(tabs[idx - 1] || tabs[idx]);
  }

  if (!isUnsaved(tab.file)) {
    this.fileHistory.push(tab.file);
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
    if (isUnsaved(file)) {
      return;
    }

    config.tabs.push(assign({}, file));

    // store saved active tab index
    if (tab === this.activeTab) {
      config.activeTab = config.tabs.length - 1;
    }
  });

  // store layout
  config.layout = this.layout;

  // let others store stuff, too
  this.events.emit('workspace:persist', config);

  // store bpmn deploy url
  config.endpoints = this.endpoints;

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

  var defaultWorkspace = {
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
    },
    endpoints: [
      'http://localhost:8080/engine-rest/deployment/create'
    ]
  };


  this.workspace.load(defaultWorkspace, (err, workspaceConfig) => {

    if (err) {
      debug('workspace load error', err);

      return done(err);
    }

    // restore tabs
    if (workspaceConfig.tabs && workspaceConfig.tabs.length) {
      this.openTabs(workspaceConfig.tabs, false);
    }

    var activeTab;

    if (workspaceConfig.activeTab && workspaceConfig.activeTab !== -1) {
      activeTab = this.tabs[workspaceConfig.activeTab];
    }

    if (activeTab) {
      this.selectTab(activeTab);
    }

    this.endpoints = workspaceConfig.endpoints || defaultWorkspace.endpoints;

    this.events.emit('layout:update', workspaceConfig.layout);

    this.events.emit('changed');

    this.events.emit('workspace:restored');

    // we are done
    done(null, workspaceConfig);
  });

};

/**
 * Enables/disables any (button) menu entries
 *
 * @param  {String} id
 * @param  {Boolean} isDisabled
 */
App.prototype.updateMenuEntry = function(group, id, isDisabled) {
  var button = find(this.menuEntries[group].buttons, matchPattern({
    id: id
  }));

  button.disabled = isDisabled;

  this.events.emit('changed');
};


/**
 * Start application.
 */
App.prototype.run = function() {

  // initialization sequence
  //
  // (-1) load plugins
  // (0) select empty tab
  // (1) load configuration
  // (2) restore workspace
  // (3) indicate ready

  this.plugins.load(() => {

    this.restoreWorkspace((err) => {

      // ensure a tab is selected
      if (!this.activeTab) {
        this.selectTab(this.tabs[0]);
      }

      if (err) {
        debug('workspace restore error', err);
      } else {
        debug('workspace restored');
      }
      this.events.emit('ready');
    });
  });

  this.events.emit('changed');
};


/**
 * Shifts a dragged tab to a new position (index based)
 *
 * @param  {Tab} tab
 * @param  {Number} newIdx
 */
App.prototype.shiftTab = function(tab, newIdx) {
  var tabs = this.tabs,
      tabIdx;

  if (!tab) {
    return;
  }

  tabIdx = tabs.indexOf(tab);

  tabs.splice(tabIdx, 1);

  tabs.splice(newIdx, 0, tab);

  this.events.emit('workspace:changed');

  this.events.emit('changed');
};


/**
 * Close all given tabs in a sequence.
 * Aborts if user cancels any of the dialogs.
 *
 * @param  {Array<Tab>} tabs
 * @param  {Function} cb
 * @param  {Object} hints
 */
App.prototype._closeTabs = function(tabs, cb, hints) {
  if (typeof cb === 'object') {
    hints = cb;
    cb = function(err) {
      if (err) {
        debug('error: %s', err);
      }
    };
  }

  cb = cb || function(err) {
    if (err) {
      debug('error: %s', err);
    }
  };

  hints = hints || {};

  series(tabs, (tab, done) => {
    this.selectTab(tab);

    // TODO: make sure newly selected tab is rendered
    this.closeTab(tab, done, hints);
  }, cb);
};


/**
 * Closes all tabs that have external files associated with them.
 */
App.prototype.closeAllTabs = function() {
  var tabs = this.tabs.filter(function(tab) {
    return !!tab.file;
  });

  this._closeTabs(tabs);
};


/**
 * Closes all tabs besides the current active one.
 */
App.prototype.closeOtherTabs = function(tab) {
  if (tab && typeof tab === 'string') {
    tab = find(this.tabs, matchPattern({ id: tab }));
  } else {
    tab = contains(this.tabs, tab) ? tab : null;
  }

  var openedTab = tab || this.activeTab;

  var tabs = this.tabs.filter(function(tab) {
    return tab.closable && openedTab !== tab;
  });

  this._closeTabs(tabs);
};


App.prototype.reopenLastTab = function() {
  var file = this.fileHistory.pop();

  if (file) {
    this.openFiles([ file ]);
  }
};


/**
 * Initiates application quit.
 */
App.prototype.quit = function() {
  debug('initiating application quit');

  var dirtyTabs = this.tabs.filter(function(tab) {
    return tab.dirty;
  });

  this._closeTabs(dirtyTabs, (err) => {
    if (err) {
      debug('quit aborted');

      return this.events.emit('quit-aborted');
    }
    debug('shutting down application');

    // we have to use the event based workspace persisting
    // or there will be race conditions on quit
    this.events.emit('workspace:changed', () => {
      this.events.emit('quitting');
    });
  }, {
    skipIfDiscardChanges: true
  });
};


/**
 * Changes and persist bpmn deployment url
 * @param url
 */
App.prototype.persistEndpoints = function(_endpoints) {
  this.endpoints = _endpoints;
  this.events.emit('workspace:changed');
};

var rdebug = require('debug')('app - external change');

/**
 * Checks tab content for external changes
 * @param  {Tab} tab
 */
App.prototype.recheckTabContent = function(tab) {

  if (tab.empty) {
    return rdebug('skipping (empty tab)');
  }

  if (isUnsaved(tab.file)) {
    return rdebug('skipping (unsaved)');
  }

  rdebug('checking');

  if (typeof tab.file.lastModified === 'undefined') {
    return rdebug('skipping (missing tab.file.lastChanged)');
  }

  var setNewFile = (file) => {
    tab.setFile(assign({}, tab.file, file));

    this.events.emit('workspace:changed');
  };

  this.fileSystem.readFileStats(tab.file, (err, statsFile) => {
    if (err) {
      return rdebug('file check error', err);
    }

    rdebug('last modified { tab: %s, stats: %s }',
      tab.file.lastModified || 0,
      statsFile.lastModified);

    if (!(statsFile.lastModified > tab.file.lastModified)) {
      return rdebug('unchanged');
    }

    rdebug('external change');

    // notifying user about external changes
    this.dialog.contentChanged((answer) => {

      if (isOk(answer)) {
        rdebug('reloading');

        this.fileSystem.readFile(tab.file, function(err, updatedFile) {
          if (err) {
            return rdebug('reloading failed', err);
          }

          setNewFile(updatedFile);
        });

      } else if (isCancel(answer)) {
        rdebug('NOT reloading');

        setNewFile(statsFile);
      }

    });

  });
};

/**
 * Sets new App state
 * @param newState
 */
App.prototype.setState = function(newState) {
  this.state = assign({}, this.state, newState);
};

/**
 * Initializes state of a specific component
 * @param key
 * @param value
 */
App.prototype.initializeState = function(options) {
  if (!options || options && (!options.key || !options.self)) {
    return new Error('key must be provided');
  }

  var self = options.self,
      key = options.key,
      initialState = options.self.initialState,
      newAppState = {};


  if (this.state[key]) {
    self.state = this.state[key];
  } else {
    newAppState[key] = initialState;

    this.setState(newAppState);

    self.state = newAppState[key];
  }


  self.setState = (newState) => {
    var state = this.state[key];

    newAppState[key] = assign({}, state, newState);

    this.setState(newAppState);

    self.state = newAppState[key];

    this.emit('changed');
  };
};


function contains(collection, element) {
  return collection.some(function(e) {
    return e === element;
  });
}

function isDiscard(userChoice) {
  return userChoice === 'discard';
}

function isCancel(userChoice) {
  return userChoice === 'cancel';
}

function isOk(userChoice) {
  return userChoice === 'ok';
}

function userCanceled() {
  return new Error('user canceled');
}

function noTabProvider(fileType) {
  throw new Error('missing provider for file <' + fileType + '>');
}

function getFilePath(tab) {
  if (isUnsaved(tab && tab.file)) {
    return null;
  }

  return tab.file.path;
}
