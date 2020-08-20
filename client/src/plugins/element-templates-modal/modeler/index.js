/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import EditorActions from './EditorActions';
import PropertiesProvider from './PropertiesProvider';

export default {
  __init__: [
    'elementTemplatesModalEditorActions',
    'propertiesProvider'
  ],
  elementTemplatesModalEditorActions: [ 'type', EditorActions ],
  propertiesProvider: [ 'type', PropertiesProvider ]
};