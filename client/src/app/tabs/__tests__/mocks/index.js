import React, { Component } from 'react';

export class Editor extends Component {
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