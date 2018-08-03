export default function Modeler() {
  this.importXML = function(xml, done) {
    this.xml = xml;

    done && done();
  }

  this.saveXML = function(done) {
    done(this.xml);
  }

  this.attachTo = function() {};

  this.detach = function() {};

  this.on = function() {};

  this.off = function() {};
}