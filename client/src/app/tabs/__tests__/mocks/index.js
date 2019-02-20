/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';

export class Editor extends Component {
  constructor() {
    super();

    this.xml = null;
  }

  setXML(xml) {
    this.xml = xml;
  }

  getXML() {
    return this.xml;
  }

  render() {
    return <div></div>;
  }
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