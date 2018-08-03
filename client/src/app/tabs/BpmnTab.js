import React, { Component, Fragment } from "react";

import MultiEditorTab from './MultiEditorTab';

import BpmnEditor from './BpmnEditor';
import XMLEditor from './xml/XMLEditor';

const initialXML = `
  <?xml version="1.0" encoding="UTF-8"?>
  <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_{{ ID }}" targetNamespace="http://bpmn.io/schema/bpmn">
    <bpmn:process id="Process_1" isExecutable="true">
      <bpmn:startEvent id="StartEvent_1" />
    </bpmn:process>
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
      <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
        <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
          <dc:Bounds x="173" y="102" width="36" height="36" />
        </bpmndi:BPMNShape>
      </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
  </bpmn:definitions>
`;


export default class BpmnTab extends Component {

  render() {    
    const {
      tab
    } = this.props;

    return (
      <Fragment key={ tab.id }>
        <MultiEditorTab
          id={ `${ tab.id }` }
          tab={ tab }
          xml={ initialXML }
          editors={ [
            {
              type: 'bpmn',
              editor: BpmnEditor,
              defaultName: 'Diagram'
            },
            {
              type: 'xml',
              editor: XMLEditor,
              fallbackEditor: true,
              defaultName: 'XML'
            }
          ] } />
      </Fragment>
    );
  }
}