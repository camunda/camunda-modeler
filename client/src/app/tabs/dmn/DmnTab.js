/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import DmnEditor from './DmnEditor';
import XMLEditor from '../xml';

import { createTab } from '../EditorTab';


const DmnTab = createTab('DmnTab', [
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
]);

export default DmnTab;