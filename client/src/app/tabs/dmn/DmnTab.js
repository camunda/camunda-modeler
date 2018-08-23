import React, { Component } from 'react';

import MultiSheetTab from '../MultiSheetTab';

import DmnEditor from './DmnEditor';
import XMLEditor from '../xml/XMLEditor';


export default class DmnTab extends Component {

  constructor() {
    super();

    this.tabRef = React.createRef();
  }

  triggerAction(action, options) {
    this.tabRef.current.triggerAction(action, options);
  }

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
        ref={ this.tabRef }
        providers={ [
          {
            type: 'dmn',
            editor: DmnEditor,
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