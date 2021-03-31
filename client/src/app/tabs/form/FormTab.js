/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import FormEditor from './FormEditor';
import JSONEditor from '../json';

import { createTab } from '../EditorTab';


const FormTab = createTab('FormTab', [
  {
    type: 'form',
    editor: FormEditor,
    defaultName: 'Form'
  },
  {
    type: 'json',
    editor: JSONEditor,
    isFallback: true,
    defaultName: 'JSON'
  }
]);

export default FormTab;
