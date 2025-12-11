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
import { utmTag } from '../../util/utmTag';

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
  order: 0,
  sections: {
    general: {
      title: 'Global settings'
    },
    versions: {
      title: 'Default Camunda versions',
      description: 'Engine version to be used for new diagrams.'
    }
  },
  properties: {
    'app.newContextPad': {
      type: 'boolean',
      default: false,
      flag: 'enable-new-context-pad',
      label: 'Enable new context pad',
      restartRequired: true,
      documentationUrl: utmTag('https://docs.camunda.io/docs/components/modeler/web-modeler/context-pad/'),
      section: 'general'
    },
    'app.disablePlugins': {
      type: 'boolean',
      default: false,
      flag: 'disable-plugins',
      label: 'Disable plugins',
      documentationUrl: utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/plugins/#disabling-plugins'),
      restartRequired: true,
      section: 'general'
    },
    'app.disableConnectorTemplates': {
      type: 'boolean',
      default: false,
      flag: 'disable-connector-templates',
      label: 'Disable connector templates',
      documentationUrl: utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/use-connectors/#automatic-connector-template-fetching'),
      restartRequired: true,
      section: 'general'
    },

    // TODO(@jarekdanielak): Enable this setting when getEditMenu issue is resolved.
    // 'app.disableAdjustOrigin': {
    //   type: 'boolean',
    //   default: false,
    //   flag: 'disable-adjust-origin',
    //   label: 'Disable adjust origin',
    //   restartRequired: true,
    //   section: 'general'
    // },
    'app.defaultC8Version': {
      type: 'select',
      options: getEngineOptions(ENGINES.CLOUD),
      default: getLatestStable(ENGINES.CLOUD),
      flag: 'c8-engine-version',
      label: 'Default Camunda 8 version',
      section: 'versions'
    },
    'app.defaultC7Version': {
      type: 'select',
      options: getEngineOptions(ENGINES.PLATFORM),
      default: getLatestStable(ENGINES.PLATFORM),
      flag: 'c7-engine-version',
      label: 'Default Camunda 7 version',
      section: 'versions'
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
