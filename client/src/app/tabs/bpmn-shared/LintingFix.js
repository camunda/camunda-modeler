/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  resolveFix,
  shouldOfferFix
} from '@camunda/linting-autofix';

function getReportElement(modeler, report) {
  if (!report) {
    return null;
  }

  return modeler.get('elementRegistry').get(report.id);
}

export function resolveLintingFix(modeler, report) {
  const element = getReportElement(modeler, report);

  if (!shouldOfferFix(report, element)) {
    return null;
  }

  return resolveFix(report, element);
}

export function applyLintingFix(modeler, report) {
  const resolvedFix = resolveLintingFix(modeler, report);

  if (!resolvedFix) {
    return;
  }

  const commands = resolvedFix.apply();

  if (!commands.length) {
    return;
  }

  modeler.get('linting').showError(report);
  modeler.get('commandStack').execute('properties-panel.multi-command-executor', commands);
}
