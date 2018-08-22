import React, { Component, Fragment } from 'react';

import MultiSheetTab from '../MultiSheetTab';

import DmnEditor from './DmnEditor';
import XMLEditor from '../xml/XMLEditor';

// eslint-disable-next-line
const initialTableXML = `
  <?xml version="1.0" encoding="UTF-8"?>
  <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" id="definitions_12oosjb" name="definitions" namespace="http://camunda.org/schema/1.0/dmn">
    <decision id="decision_0ujzr04" name="Decision">
      <decisionTable id="decisionTable">
        <input id="input1" label="">
          <inputExpression id="inputExpression1" typeRef="string">
            <text></text>
          </inputExpression>
        </input>
        <output id="output1" label="" name="" typeRef="string" />
      </decisionTable>
    </decision>
  </definitions>
`;

const initialXML = `
  <?xml version="1.0" encoding="UTF-8"?>
  <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" id="definitions_12oosjb" name="definitions" namespace="http://camunda.org/schema/1.0/dmn">
    <decision id="decision_0ujzr04" name="Decision">
      <decisionTable id="decisionTable">
        <input id="input1" label="">
          <inputExpression id="inputExpression1" typeRef="string">
            <text></text>
          </inputExpression>
        </input>
        <output id="output1" label="" name="" typeRef="string" />
      </decisionTable>
    </decision>
  </definitions>
`;


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
      <Fragment key={ tab.id }>
        <MultiSheetTab
          id={ `${ tab.id }` }
          tab={ tab }
          xml={ tab.content || initialXML }
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
      </Fragment>
    );
  }
}