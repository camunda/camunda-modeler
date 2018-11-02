import BpmnEditor from './BpmnEditor';
import XMLEditor from '../xml';

import { createTab } from '../EditorTab';


const BpmnTab = createTab('BpmnTab', [
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
]);

export default BpmnTab;