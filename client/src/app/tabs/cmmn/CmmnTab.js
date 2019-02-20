/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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