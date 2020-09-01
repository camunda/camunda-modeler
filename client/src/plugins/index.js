/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import CamundaPlugin from './camunda-plugin';
import PrivacyPreferences from './privacy-preferences';
import UpdateChecks from './update-checks';
import ErrorTracking from './error-tracking';
import UsageStatistics from './usage-statistics';
import ElementTemplatesModal from './element-templates-modal';

export default [
  CamundaPlugin,
  PrivacyPreferences,
  UpdateChecks,
  ErrorTracking,
  UsageStatistics,
  ElementTemplatesModal
];
