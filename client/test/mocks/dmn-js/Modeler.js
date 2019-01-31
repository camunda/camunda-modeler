import { assign } from 'min-dash';

class CommandStack {
  constructor() {
    this._stackIdx = -1;
    this._maxStackIdx = this._stackIdx;
  }

  execute(commands) {
    this._stackIdx += commands;
    this._maxStackIdx = this._stackIdx;
  }

  undo() {
    if (this.canUndo()) {
      this._stackIdx--;
    }
  }

  redo() {
    if (this.canRedo()) {
      this._stackIdx++;
    }
  }

  canRedo() {
    return this._stackIdx < this._maxStackIdx;
  }

  canUndo() {
    return this._stackIdx > -1;
  }
}

class PropertiesPanel {
  attachTo() {}

  detach() {}
}


class Viewer {

  constructor(xml, modules) {
    this.modules = assign(this._getDefaultModules(), modules);

    this.xml = xml;
  }

  _getDefaultModules() {
    return {
      eventBus: {
        fire() {}
      },
      canvas: {
        resized() {}
      },
      commandStack: new CommandStack(),
      propertiesPanel: new PropertiesPanel(),
      selection: {
        get() {
          return [];
        },
        hasSelection() {
          return false;
        }
      },
      sheet: {
        resized() {}
      }
    };
  }

  saveSVG(done) {

    if (this.xml === 'export-as-error') {
      return done(new Error('failed to save svg'));
    }

    return done(null, '<svg />');
  }

  get(moduleName) {
    const module = this.modules[moduleName];

    if (module) {
      return module;
    }

    throw new Error(`service not provided: <${moduleName}>`);
  }
}


export default class Modeler {

  constructor(modules = {}) {
    this.modules = modules;

    this.xml = null;

    this.viewer = null;

    this.listeners = {};
  }

  importXML(xml, options, done) {
    this.xml = xml;

    this.viewer = new Viewer(this.xml, this.modules);

    const error = xml === 'import-error' ? new Error('error') : null;

    const warnings = xml === 'import-warnings' ? [ 'warning' ] : [];

    done && done(error, warnings);
  }

  getActiveView() {
    return this.activeView || { type: 'drd' };
  }

  getActiveViewer() {
    return this.viewer || new Viewer(this.xml, this.modules);
  }

  _getViewer() {
    return this.viewer || new Viewer(this.xml, this.modules);
  }

  saveXML(options, done) {

    const xml = this.xml;

    if (xml === 'export-error') {
      return done(new Error('failed to save xml'));
    }

    return done(null, xml);
  }

  _getInitialView() {
    return { type: 'drd' };
  }

  getView(element) {
    return { type: 'drd', element };
  }

  getViews() {
    return [
      { type: 'drd' }
    ];
  }

  open(view) {
    this.activeView = view;
  }

  attachTo() {}

  detach() {}

  on(event, priority, callback) {
    if (!callback) {
      callback = priority;
    }

    if (!this.listeners[ event ]) {
      this.listeners[ event ] = [];
    }

    this.listeners[ event ].push(callback);
  }

  off() {}

  _emit(event) {
    if (this.listeners[ event ]) {
      this.listeners[ event ].forEach(callback => callback());
    }
  }

  getStackIdx() {
    const viewer = this.viewer || new Viewer(this.xml, this.modules);

    const commandStack = viewer.get('commandStack', false);

    return commandStack._stackIdx;
  }
}

Modeler.prototype._modules = [];