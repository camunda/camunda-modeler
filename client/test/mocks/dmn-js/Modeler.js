import { assign } from 'min-dash';

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
      canvas: {
        resized() {}
      },
      commandstack: {
        canRedo() {},
        canUndo() {},
        stackIdx: -1
      },
      propertiesPanel: new PropertiesPanel(),
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
  }

  importXML(xml, options, done) {
    this.xml = xml;

    const error = xml === 'import-error' ? new Error('error') : null;

    const warnings = xml === 'import-warnings' ? [ 'warning' ] : [];

    done && done(error, warnings);
  }

  getActiveView() {
    return this.activeView;
  }

  getActiveViewer() {
    return new Viewer(this.xml, this.modules);
  }

  _getViewer(element) {
    return new Viewer(this.xml, this.modules);
  }

  saveXML(options, done) {

    const xml = this.xml;

    if (xml === 'export-error') {
      return done(new Error('failed to save xml'));
    }

    return done(null, xml);
  }

  _getInitialView(views) {
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

  on() {}

  off() {}
}

Modeler.prototype._modules = [];