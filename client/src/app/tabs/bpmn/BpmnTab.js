import React, { Component } from 'react';

import MultiSheetTab from '../MultiSheetTab';

import BpmnEditor from './BpmnEditor';
import XMLEditor from '../xml/XMLEditor';


export default class BpmnTab extends Component {

  render() {
    const {
      tab,
      onChanged
    } = this.props;

    return (
      <MultiSheetTab
        id={ `${ tab.id }` }
        tab={ tab }
        xml={ tab.file.contents }
        onChanged={ onChanged }
        providers={ [
          {
            type: 'bpmn',
            editor: BpmnEditor,
            defaultName: 'Diagram'
          },
          {
            type: 'xml',
            editor: XMLEditor,
            isFallback: true,
            defaultName: 'XML'
          }
        ] } />
    );
  }
}