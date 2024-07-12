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
import ContextAction from './tab-context-action';
import CreateNewAction from './create-new-action';
import ElementTemplatesModal from './element-templates-modal';
import ErrorTracking from './error-tracking';
import PrivacyPreferences from './privacy-preferences';
import ReportFeedback from './report-feedback';
import UpdateChecks from './update-checks';
import UserJourneyStatistics from './user-journey-statistics';
import VersionInfo from './version-info';
import ZeebePlugin from './zeebe-plugin';
import ConnectorTemplates from './connector-templates';

export default [
  CamundaPlugin,
  ContextAction,
  CreateNewAction,
  ElementTemplatesModal,
  ErrorTracking,
  PrivacyPreferences,
  ReportFeedback,
  UpdateChecks,
  VersionInfo,
  ZeebePlugin,
  UserJourneyStatistics,
  ConnectorTemplates
];
