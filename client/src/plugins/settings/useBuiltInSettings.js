/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect } from 'react';

import { find, map } from 'min-dash';

import { ENGINES, ENGINE_PROFILES, getLatestStable } from '../../util/Engines';

import { getAnnotatedVersion, toSemverMinor } from '../../app/tabs/EngineProfile';

/**
 * Registers built-in application settings.
 * @param {import('../../app/Settings').Settings} settings
 */
export default function useBuiltInSettings(settings) {

  useEffect(() => {
    settings.register(schema);
  }, []);
}

export const schema = {
  id: 'app',
  title: 'Global Settings',
  order: 0,
  properties: {
    'app.newContextPad': {
      type: 'boolean',
      default: false,
      flag: 'enable-new-context-pad',
      label: 'Enable new context pad',
      restartRequired: true,
      documentationUrl: 'https://docs.camunda.io/docs/components/modeler/web-modeler/context-pad/',
    },
    'app.disablePlugins': {
      type: 'boolean',
      default: false,
      flag: 'disable-plugins',
      label: 'Disable plugins',
      restartRequired: true,
    },
    'app.disableConnectorTemplates': {
      type: 'boolean',
      default: false,
      flag: 'disable-connector-templates',
      label: 'Disable connector templates',
      restartRequired: true,
    },

    // TODO(@jarekdanielak): Enable this setting when getEditMenu issue is resolved.
    // 'app.disableAdjustOrigin': {
    //   type: 'boolean',
    //   default: false,
    //   flag: 'disable-adjust-origin',
    //   label: 'Disable adjust origin',
    //   restartRequired: true,
    // },
    'app.defaultC8Version': {
      type: 'select',
      options: getEngineOptions(ENGINES.CLOUD),
      default: getLatestStable(ENGINES.CLOUD),
      flag: 'c8-engine-version',
      label: 'Default Camunda 8 version',
    },
    'app.defaultC7Version': {
      type: 'select',
      options: getEngineOptions(ENGINES.PLATFORM),
      default: getLatestStable(ENGINES.PLATFORM),
      flag: 'c7-engine-version',
      label: 'Default Camunda 7 version',
    }
  }
};

/**
 * Parse available engine versions to a format of `{ label, value }`.
 */
function getEngineOptions(engine) {
  return map(find(ENGINE_PROFILES, i => i.executionPlatform === engine).executionPlatformVersions, (version) => {
    return {
      label: getAnnotatedVersion(toSemverMinor(version), engine),
      value: version
    };
  });
};
