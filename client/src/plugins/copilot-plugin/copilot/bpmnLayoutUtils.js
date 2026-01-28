/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

// @ts-expect-error TS2307
import { layoutProcess } from 'bpmn-auto-layout';

export const applyLayoutAndImport = async (xml, modeler) => {
  if (!xml) {
    throw new Error('No XML content provided for layout');
  }

  const layoutedXml = await layoutProcess(xml);

  if (modeler && layoutedXml) {
    try {
      const { warnings } = await modeler.importXML(layoutedXml);
      if (warnings.length) {
        console.warn('[BPMN Import] Warnings:', warnings);
      }
      modeler.get('canvas').zoom('fit-viewport');
    } catch (error) {
      console.error('[BPMN Layout] Error:', error);
      throw new Error(`Failed to import BPMN diagram: ${error.message}`);
    }
  }

  return layoutedXml;
};
