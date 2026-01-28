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

/**
 * Normalizes BPMN XML namespace declarations to be compatible with bpmn-auto-layout.
 * The bpmn-auto-layout package has issues with non-standard namespace prefixes
 * (like ns0, ns1, ns2, ns3) and malformed xmlns declarations.
 *
 * @param {string} xml - The BPMN XML string to normalize
 * @returns {string} - The normalized BPMN XML string
 */
const normalizeXmlNamespaces = (xml) => {
  if (!xml) return xml;

  let normalized = xml;

  // Remove malformed namespace declarations like xmlns:ns2="xmlns" ns2:modeler="..."
  // These should be xmlns:modeler="..." directly
  normalized = normalized.replace(/xmlns:ns\d+="xmlns"\s+ns\d+:(\w+)="([^"]+)"/g, 'xmlns:$1="$2"');

  // Fix ns0:executionPlatform -> modeler:executionPlatform pattern
  // First, ensure we have the modeler namespace declared properly
  if (normalized.includes('ns0:executionPlatform') || normalized.includes('ns1:executionPlatformVersion')) {

    // Remove the malformed ns0/ns1 modeler declarations
    normalized = normalized.replace(/xmlns:ns0="modeler"\s*/g, '');
    normalized = normalized.replace(/xmlns:ns1="modeler"\s*/g, '');

    // Add proper modeler namespace if not present
    if (!normalized.includes('xmlns:modeler=')) {
      normalized = normalized.replace(
        /<definitions/,
        '<definitions xmlns:modeler="http://camunda.org/schema/modeler/1.0"'
      );
    }

    // Replace ns0/ns1 prefixes with modeler
    normalized = normalized.replace(/ns0:executionPlatform/g, 'modeler:executionPlatform');
    normalized = normalized.replace(/ns1:executionPlatformVersion/g, 'modeler:executionPlatformVersion');
  }

  // Ensure the default BPMN namespace is properly declared
  // Move xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" to be after definitions if it's at the end
  const bpmnNs = 'xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"';
  if (normalized.includes(bpmnNs)) {

    // Remove it from current position and add it right after <definitions
    normalized = normalized.replace(new RegExp('\\s*' + bpmnNs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    normalized = normalized.replace(/<definitions/, `<definitions ${bpmnNs}`);
  }

  // Clean up any duplicate spaces
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.replace(/\s+>/g, '>');
  normalized = normalized.replace(/>\s+</g, '><');

  // Restore proper formatting for readability
  normalized = normalized.replace(/></g, '>\n<');

  return normalized;
};

export const applyLayoutAndImport = async (xml, modeler) => {
  if (!xml) {
    throw new Error('No XML content provided for layout');
  }

  // Normalize the XML namespaces before layout
  console.log('[BPMN Layout] XML for layout', xml);
  const normalizedXml = normalizeXmlNamespaces(xml);
  console.log('[BPMN Layout] Normalized XML for layout', normalizedXml);

  const layoutedXml = await layoutProcess(normalizedXml);
  console.log('[BPMN Layout] Layouted XML', layoutedXml);

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
