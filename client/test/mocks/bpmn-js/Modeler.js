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

    done && done();
  }

  saveXML(done) {
    done(this.xml);
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

    return null;
  }
}

Modeler.prototype._modules = [];