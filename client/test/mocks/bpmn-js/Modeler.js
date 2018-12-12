import { assign } from 'min-dash';


class CommandStack {
  canRedo() {}

  canUndo() {}

  clear() {}

  execute() {}
}

class PropertiesPanel {
  attachTo() {}

  detach() {}
}

export default class Modeler {
  constructor(modules = {}) {
    this.modules = assign(this._getDefaultModules(), modules);

    this.xml = null;
  }

  _getDefaultModules() {
    return {
      canvas: {
        resized() {}
      },
      clipboard: {
        isEmpty() {}
      },
      commandStack: new CommandStack(),
      minimap: {
        toggle() {}
      },
      propertiesPanel: new PropertiesPanel(),
      selection: {
        get() {
          return [];
        }
      }
    };
  }

  importXML(xml, done) {
    this.xml = xml;

    const error = xml === 'import-error' ? new Error('error') : null;

    const warnings = xml === 'import-warnings' ? [ 'warning' ] : [];

    done && done(error, warnings);
  }

  saveXML(options, done) {

    const xml = this.xml;

    if (xml === 'export-error') {
      return done(new Error('failed to save xml'));
    }

    return done(null, xml);
  }

  saveSVG(done) {

    if (this.xml === 'export-as-error') {
      return done(new Error('failed to save svg'));
    }

    return done(null, '<svg />');
  }

  attachTo() {}

  detach() {}

  on() {}

  off() {}

  get(moduleName) {
    const module = this.modules[moduleName];

    if (module) {
      return module;
    }

    throw new Error(`service not provided: <${moduleName}>`);
  }
}

Modeler.prototype._modules = [];