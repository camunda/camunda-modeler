import CmmnEditor from './CmmnEditor';
import XMLEditor from '../xml';

import { createTab } from '../EditorTab';


const CmmnTab = createTab('CmmnTab', [
  {
    type: 'bpmn',
    editor: CmmnEditor,
    defaultName: 'Diagram'
  },
  {
    type: 'xml',
    editor: XMLEditor,
    isFallback: true,
    defaultName: 'XML'
  }
]);

export default CmmnTab;