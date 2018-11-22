import React, { Component } from 'react';

export class Editor extends Component {

  constructor(props) {
    super(props);

    const {
      xml
    } = this.props;

    const modeler = new Modeler({ xml });

    this.state = {
      modeler
    };
  }

  render() {
    return <div></div>;
  }

  async getXML() {

    const {
      modeler
    } = this.state;

    return new Promise((resolve, reject) => {

      modeler.saveXML({}, (err, xml) => {
        if (err) {
          reject(err);
        }

        resolve(xml);
      });
    });
  }

  async setXML(xml) {

    const {
      modeler
    } = this.state;

    return new Promise((resolve, reject) => {

      modeler.importXML(xml, xml => {
        resolve(xml);
      });

    });
  }

}

export class Modeler {
  constructor(props) {

    const {
      xml
    } = props;

    this.xml = xml;

    this.listeners = {};
  }

  importXML(xml, done) {
    this.xml = xml;

    done(xml);
  }

  saveXML(options, done) {

    const xml = this.xml;

    if (xml === 'export-error') {
      return done(new Error('failed to save xml'));
    }

    this.emit({ xml });

    return done(null, xml);
  }

  on(type, callback) {
    this.listeners[type] = callback.bind(this);
  }

  emit(type, event) {
    const callback = this.listeners[type];

    if (typeof callback === 'function') {
      this.listeners[type](event);
    }
  }

  off() {}
}

export const providers = [{
  type: 'editor',
  editor: Editor,
  defaultName: 'Editor'
}, {
  type: 'fallback',
  editor: Editor,
  defaultName: 'Fallback',
  isFallback: true
}];

export const tab = {
  name: 'foo.bar',
  type: 'bar'
};