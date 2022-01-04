/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Component } from 'react';

export class Editor extends Component {
  constructor(props) {
    super(props);

    this.xml = null;
  }

  triggerAction() {}

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

export const providers = [ {
  type: 'editor',
  editor: Editor,
  defaultName: 'Editor'
}, {
  type: 'fallback',
  editor: Editor,
  defaultName: 'Fallback',
  isFallback: true
} ];

export const tab = {
  id: 42,
  name: 'foo.bar',
  type: 'bar',
  title: 'unsaved',
  file: {
    name: 'foo.bar',
    contents: '',
    path: null
  }
};