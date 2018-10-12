class PropertiesPanel {
  attachTo() {}

  detach() {}
}

export default class Modeler {
  constructor() {
    this.xml = null;
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

  get(module) {
    if (module === 'propertiesPanel') {
      return new PropertiesPanel();
    }

    if (module === 'canvas') {
      return {
        resized() { }
      };
    }

    throw new Error(`service not provided: <${module}>`);
  }
}

Modeler.prototype._modules = [];