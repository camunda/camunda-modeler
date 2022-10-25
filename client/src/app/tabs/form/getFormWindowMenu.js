/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { FORM_PREVIEW_TRIGGER } from './FormEditor';

export function getFormWindowMenu(state) {
  return [
    ...getPreviewEntries(state)
  ];
}

function getPreviewEntries({ previewOpen }) {
  return [ {
    label: previewOpen ? 'Open design mode' : 'Open validation mode',
    accelerator: 'CommandOrControl+P',
    action: previewOpen ? 'collapsePreview' : 'openPreview',
    options: {
      triggeredBy: FORM_PREVIEW_TRIGGER.WINDOW_MENU
    }
  } ];
}