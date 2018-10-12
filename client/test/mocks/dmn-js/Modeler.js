class PropertiesPanel {
  attachTo() {}

  detach() {}
}


class Viewer {

  constructor(xml) {
    this.xml = xml;
  }

  saveSVG(done) {

    if (this.xml === 'export-as-error') {
      return done(new Error('failed to save svg'));
    }

    return done(null, '<svg />');
  }

  get(module) {
    if (module === 'propertiesPanel') {
      return new PropertiesPanel();
    }

    if (module === 'canvas') {
      return {
        resized() { }
      };
    }

    if (module === 'sheet') {
      return {
        resized() { }
      };
    }

    throw new Error(`service not provided: <${module}>`);
  }

}


export default class Modeler {

  constructor() {
    this.xml = null;
  }

  importXML(xml, options, done) {
    this.xml = xml;

    const error = xml === 'import-error' ? new Error('error') : null;

    const warnings = xml === 'import-warnings' ? [ 'warning' ] : [];

    done && done(error, warnings);
  }

  getActiveView() {
    this.activeView;
  }

  getActiveViewer() {
    return new Viewer(this.xml);
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

  open(view) {
    this.activeView = view;
  }

  attachTo() {}

  detach() {}

  on() {}

  off() {}
}

Modeler.prototype._modules = [];