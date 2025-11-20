/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { forwardRef } from 'react';

import {
  find,
  forEach,
  sortBy
} from 'min-dash';

import replaceIds from '@bpmn-io/replace-ids';

import { Bot } from '@carbon/icons-react';

import { Linter as BpmnLinter } from '@camunda/linting';
import { FormLinter } from '@camunda/form-linting/lib/FormLinter';

import bpmnDiagram from './tabs/bpmn/diagram.bpmn';
import cloudBpmnDiagram from './tabs/cloud-bpmn/diagram.bpmn';
import dmnDiagram from './tabs/dmn/diagram.dmn';
import cloudDmnDiagram from './tabs/cloud-dmn/diagram.dmn';
import form from './tabs/form/initial.form';
import cloudForm from './tabs/form/initial-cloud.form';
import rpaScript from './tabs/rpa/resources/initial.rpa';

import {
  ENGINES
} from '../util/Engines';

import EmptyTab from './EmptyTab';

import parseDiagramType from './util/parseDiagramType';

import parseExecutionPlatform from './util/parseExecutionPlatform';

import Metadata from '../util/Metadata';

import {
  findUsages as findNamespaceUsages,
} from './tabs/util/namespace';

import {
  generateId
} from '../util';

import Flags, {
  DISABLE_DMN,
  DISABLE_FORM,
  DISABLE_ZEEBE,
  DISABLE_PLATFORM,
  DISABLE_HTTL_HINT,
  DEFAULT_HTTL,
  DISABLE_RPA
} from '../util/Flags';

import BPMNIcon from '../../resources/icons/file-types/BPMN.svg';
import DMNIcon from '../../resources/icons/file-types/DMN.svg';
import FormIcon from '../../resources/icons/file-types/Form.svg';

import { getDefaultVersion } from './tabs/EngineProfile';

import { getCloudTemplates } from '../util/elementTemplates';
import { CloudElementTemplatesLinterPlugin } from 'bpmn-js-element-templates';
import { RPALinter } from '@camunda/rpa-integration';

import { utmTag } from '../util/utmTag';

const BPMN_HELP_MENU = [
  {
    label: 'BPMN 2.0 Tutorial',
    action: utmTag('https://camunda.org/bpmn/tutorial/')
  },
  {
    label: 'BPMN Modeling Reference',
    action: utmTag('https://camunda.org/bpmn/reference/')
  }
];

const C7_HELP_MENU = [
  {
    label: 'Camunda 8 Migration Guide',
    action: utmTag('https://docs.camunda.io/docs/guides/migrating-from-camunda-7/')
  }
];

const DMN_HELP_MENU = [
  {
    label: 'DMN Tutorial',
    action: utmTag('https://camunda.org/dmn/tutorial/')
  }
];

const createdByType = {};

const noopProvider = {
  getComponent() {
    return null;
  },
  getInitialContents() {
    return null;
  }
};

const ENCODING_BASE64 = 'base64',
      ENCODING_UTF8 = 'utf8';

const EXPORT_JPEG = {
  name: 'JPEG image',
  encoding: ENCODING_BASE64,
  extensions: [ 'jpeg' ]
};

const EXPORT_PNG = {
  name: 'PNG image',
  encoding: ENCODING_BASE64,
  extensions: [ 'png' ]
};

const EXPORT_SVG = {
  name: 'SVG image',
  encoding: ENCODING_UTF8,
  extensions: [ 'svg' ]
};

const NAMESPACE_URL_ZEEBE = 'http://camunda.org/schema/zeebe/1.0';

const DEFAULT_PRIORITY = 1000;

const HIGHER_PRIORITY = 1001;

const formLinter = new FormLinter();

/**
 * A provider that allows us to customize available tabs.
 */
export default class TabsProvider {

  constructor(plugins = [], settings) {
    const self = this;
    this.settings = settings;
    this.providers = {
      empty: {
        canOpen(file) {
          return false;
        },
        getComponent() {
          return forwardRef(function EmptyTabProducer(props, ref) {
            return <EmptyTab ref={ ref } { ...props } tabsProvider={ self } />;
          });
        },
        getIcon() {
          return null;
        }
      },
      'cloud-bpmn': {
        name: 'BPMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'bpmn', 'xml' ],
        priority: HIGHER_PRIORITY,
        canOpen(file) {
          const {
            contents
          } = file;

          // (0) can open only BPMN files
          if (parseDiagramType(contents) !== 'bpmn') {
            return false;
          }

          // (1) detect execution platform
          const executionPlatformDetails = parseExecutionPlatform(contents);

          if (executionPlatformDetails) {
            return [
              'Camunda Cloud',
              'Zeebe'
            ].includes(executionPlatformDetails.executionPlatform);
          }

          // (2) detect zeebe namespace
          const used = findNamespaceUsages(contents, NAMESPACE_URL_ZEEBE);

          return !!used;
        },
        getComponent(options) {
          return import('./tabs/cloud-bpmn');
        },
        getIcon() {
          return BPMNIcon;
        },
        getInitialContents(options) {
          return cloudBpmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.bpmn`;
        },
        getHelpMenu() {
          return BPMN_HELP_MENU;
        },
        getNewFileMenu() {
          return [ {
            label: 'BPMN diagram',
            group: 'Camunda 8',
            action: 'create-cloud-bpmn-diagram'
          } ];
        },
        async getLinter(plugins = [], tab, getConfig) {
          const templates = await getConfig('bpmn.elementTemplates', tab.file) || [];
          const cloudTemplates = getCloudTemplates(templates);

          return new BpmnLinter({
            modeler: 'desktop',
            type: 'cloud',
            plugins: [
              ...plugins,
              CloudElementTemplatesLinterPlugin(cloudTemplates)
            ]
          });
        }
      },
      bpmn: {
        name: 'BPMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'bpmn', 'xml' ],
        canOpen(file) {
          return parseDiagramType(file.contents) === 'bpmn';
        },
        getComponent(options) {
          return import('./tabs/bpmn');
        },
        getIcon() {
          return BPMNIcon;
        },
        getInitialContents(options) {
          return bpmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.bpmn`;
        },
        getHelpMenu() {
          return BPMN_HELP_MENU.concat(C7_HELP_MENU);
        },
        getNewFileMenu() {
          return [ {
            label: 'BPMN diagram',
            group: 'Camunda 7',
            action: 'create-bpmn-diagram'
          } ];
        },
        getLinter(plugins) {

          if (Flags.get(DISABLE_HTTL_HINT)) {
            plugins = [
              DisableHTTLHintPlugin(),
              ...plugins
            ];
          }

          return new BpmnLinter({
            modeler: 'desktop',
            type: 'platform',
            plugins
          });
        }
      },
      'cloud-dmn': {
        name: 'DMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'dmn', 'xml' ],
        canOpen(file) {
          const {
            contents
          } = file;

          // (0) can open only DMN files
          if (parseDiagramType(contents) !== 'dmn') {
            return false;
          }

          // (1) detect execution platform
          const executionPlatformDetails = parseExecutionPlatform(contents);

          if (executionPlatformDetails) {
            return executionPlatformDetails.executionPlatform === 'Camunda Cloud';
          }

          // (2) don't open DMN files without execution platform
          return false;
        },
        getComponent(options) {
          return import('./tabs/cloud-dmn');
        },
        getIcon() {
          return DMNIcon;
        },
        getInitialContents() {
          return cloudDmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.dmn`;
        },
        getHelpMenu() {
          return DMN_HELP_MENU.concat(C7_HELP_MENU);
        },
        getNewFileMenu() {
          return [ {
            label: 'DMN diagram',
            group: 'Camunda 8',
            action: 'create-cloud-dmn-diagram'
          } ];
        },
        getLinter() {
          return null;
        }
      },
      dmn: {
        name: 'DMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'dmn', 'xml' ],
        canOpen(file) {
          return parseDiagramType(file.contents) === 'dmn';
        },
        getComponent(options) {
          return import('./tabs/dmn');
        },
        getIcon() {
          return DMNIcon;
        },
        getInitialContents() {
          return dmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.dmn`;
        },
        getHelpMenu() {
          return DMN_HELP_MENU;
        },
        getNewFileMenu() {
          return [ {
            label: 'DMN diagram',
            group: 'Camunda 7',
            action: 'create-dmn-diagram'
          } ];
        },
        getLinter() {
          return null;
        }
      },
      'cloud-form': {
        name: 'Form',
        encoding: ENCODING_UTF8,
        exports: {},
        extensions: [ 'form' ],
        canOpen(file) {
          const {
            contents
          } = file;

          try {
            const obj = JSON.parse(contents);
            const { executionPlatform } = obj;
            return file.name.endsWith('.form') && executionPlatform === ENGINES.CLOUD;

          } catch (e) {
            return false;
          }
        },
        getComponent(options) {
          return import('./tabs/form');
        },
        getIcon() {
          return FormIcon;
        },
        getInitialContents() {
          return cloudForm;
        },
        getInitialFilename(suffix) {
          return `form_${suffix}.form`;
        },
        getHelpMenu() {
          return [];
        },
        getNewFileMenu() {
          return [ {
            label: 'Form',
            group: 'Camunda 8',
            action: 'create-cloud-form'
          } ];
        },
        getLinter() {
          return formLinter;
        }
      },
      form: {
        name: 'Form',
        encoding: ENCODING_UTF8,
        exports: {},
        extensions: [ 'form' ],
        canOpen(file) {
          return file.name.endsWith('.form');
        },
        getComponent(options) {
          return import('./tabs/form');
        },
        getIcon() {
          return FormIcon;
        },
        getInitialContents() {
          return form;
        },
        getInitialFilename(suffix) {
          return `form_${suffix}.form`;
        },
        getHelpMenu() {
          return [];
        },
        getNewFileMenu() {
          return [ {
            label: 'Form',
            group: 'Camunda 7',
            action: 'create-form'
          } ];
        },
        getLinter() {
          return formLinter;
        }
      },
      'rpa': {
        name: 'RPA',
        encoding: 'utf8',
        exports: {},
        extensions: [ 'rpa' ],
        canOpen(file) {
          return file.name.endsWith('.rpa');
        },
        getComponent(options) {
          return import('./tabs/rpa');
        },
        getIcon() {
          return Bot;
        },
        getInitialContents() {
          return rpaScript;
        },
        getInitialFilename(suffix) {
          return `script_${suffix}.rpa`;
        },
        getHelpMenu() {
          return [];
        },
        getNewFileMenu() {
          return [ {
            label: 'RPA script',
            group: 'Camunda 8',
            action: 'create-diagram',
            options: {
              type: 'rpa'
            }
          } ];
        },
        getLinter() {
          return new RPALinter();
        }
      }
    };

    plugins.forEach((tabs) => {
      this.providers = {
        ...this.providers,
        ...tabs
      };
    });

    this.providersByFileType = Object.entries(this.providers).reduce((acc, [ key, provider ]) => {
      const { extensions } = provider;
      if (!extensions) {
        return acc;
      }

      extensions.forEach(extension => {
        acc[extension] = acc[extension] || [];
        acc[extension].push(provider);
      });

      return acc;
    }, {});

    if (Flags.get(DISABLE_ZEEBE)) {
      this.providersByFileType.bpmn = this.providersByFileType.bpmn.filter(p => p !== this.providers['cloud-bpmn']);
      this.providersByFileType.dmn = this.providersByFileType.dmn.filter(p => p !== this.providers['cloud-dmn']);
      this.providersByFileType.form = this.providersByFileType.form.filter(p => p !== this.providers['cloud-form']);
      this.providersByFileType.rpa = [];

      delete this.providers['cloud-bpmn'];
      delete this.providers['cloud-dmn'];
      delete this.providers['cloud-form'];
      delete this.providers['rpa'];
    }

    if (Flags.get(DISABLE_PLATFORM)) {
      this.providersByFileType.bpmn = this.providersByFileType.bpmn.filter(p => p !== this.providers.bpmn);
      delete this.providers.bpmn;

      delete this.providers.dmn;
      delete this.providersByFileType.dmn;

      delete this.providers.form;
    }

    if (Flags.get(DISABLE_DMN)) {
      delete this.providers.dmn;
      delete this.providers['cloud-dmn'];
      delete this.providersByFileType.dmn;
    }

    if (Flags.get(DISABLE_FORM)) {
      delete this.providers.form;
      delete this.providers['cloud-form'];
      delete this.providersByFileType.form;
    }

    if (Flags.get(DISABLE_RPA)) {
      delete this.providers.rpa;
      delete this.providersByFileType.rpa;
    }
  }

  getProviderNames() {
    const names = [];

    forEach(this.providers, (provider) => {
      const { name } = provider;

      if (name && !names.includes(name)) {
        names.push(name);
      }
    });

    return names;
  }

  getProviders() {
    return this.providers;
  }

  hasProvider(fileType) {
    return !!this._getProvidersForExtension(fileType).length;
  }

  getProvider(type) {
    return (this.providers[type] || noopProvider);
  }

  /**
   * Returns provider if available.
   *
   * Algorithm:
   * * check if there are providers defined for the file extension
   *   * if there is only one, return it (happy path)
   *   * if there are more than one:
   *     * return the first provider which can open the file
   *     * otherwise return the last provider
   *   * if there are none, return the first provider (by priority) which can open the file or `null`
   *
   * @param {import('./TabsProvider').File} file
   * @returns {Object | null}
   */
  getProviderForFile(file) {
    const typeFromExtension = getTypeFromFileExtension(file);

    const providersForExtension = this._getProvidersForExtension(typeFromExtension);

    // single provider specified for the extension
    if (providersForExtension.length === 1) {
      return providersForExtension[0];
    }

    // multiple providers specified for the extension
    if (providersForExtension.length > 1) {
      const provider = findProviderForFile(providersForExtension, file);

      // return the matching provider or the first by priority provider as fallback
      return provider || sortByPriority(providersForExtension)[0];
    }

    // no providers specified for the extension; return the first that can open the file
    const provider = findProviderForFile(sortByPriority(this.providers), file);

    return provider || null;
  }

  getTabComponent(type, options) {
    return this.getProvider(type).getComponent(options);
  }

  getTabIcon(type, options) {
    return this.getProvider(type).getIcon(options);
  }

  createTab(type) {
    const file = this._createFile(type);

    return this.createTabForFile(file);
  }

  createTabForFile(file) {

    const id = generateId();

    const type = this._getTabType(file);

    if (!type) {
      return null;
    }

    // fill empty file with initial contents
    if (!file.contents) {
      file.contents = this._getInitialFileContents(type);
    }

    return {
      file,
      id,
      get name() {
        return this.file.name;
      },
      set name(newName) {
        this.file.name = newName;
      },
      get title() {
        return this.file.path || '(new file)';
      },
      type
    };
  }

  linkSettings(settings) {
    this.settings = settings;
  }

  _createFile(type) {

    const counter = (
      type in createdByType
        ? (++createdByType[type])
        : (createdByType[type] = 1)
    );

    const name = this._getInitialFilename(type, counter);

    const contents = this._getInitialFileContents(type);

    return {
      name,
      contents,
      path: null
    };
  }

  _getInitialFilename(providerType, suffix) {
    const provider = this.providers[providerType];

    return provider.getInitialFilename(suffix);
  }

  _getInitialFileContents(type) {
    const rawContents = this.getProvider(type).getInitialContents();

    return rawContents && replaceHistoryTimeToLive(
      replaceExporter(
        replaceVersions(
          replaceIds(rawContents, generateId),
          this.settings
        )
      )
    );
  }

  _getTabType(file) {
    const provider = this.getProviderForFile(file);

    if (!provider) {
      return null;
    }

    for (let type in this.providers) {
      if (this.providers[type] === provider) {
        return type;
      }
    }
  }

  _getProvidersForExtension(extension) {
    return this.providersByFileType[extension] || [];
  }
}



// helper ///////////////////

function getTypeFromFileExtension(file) {
  const { name } = file;

  return name.substring(name.lastIndexOf('.') + 1).toLowerCase();
}

function findProviderForFile(providers, file) {
  return find(providers, provider => {
    if (provider.canOpen(file)) {
      return provider;
    }
  });
}

/**
 * Sorts a list of providers by priority (descending).
 *
 * @param {Array|Object} providers
 * @returns {Array}
 */
function sortByPriority(providers) {
  return sortBy(providers, p => (p.priority || DEFAULT_PRIORITY) * -1);
}


function replaceVersions(contents, settings) {

  const settingsVersion = {
    [ENGINES.PLATFORM]: settings?.get('app.defaultC7Version'),
    [ENGINES.CLOUD]: settings?.get('app.defaultC8Version')
  };

  const platformVersion = getDefaultVersion(ENGINES.PLATFORM, settingsVersion[ENGINES.PLATFORM]);
  const cloudVersion = getDefaultVersion(ENGINES.CLOUD, settingsVersion[ENGINES.CLOUD]);

  return (
    contents
      .replace('{{ CAMUNDA_PLATFORM_VERSION }}', platformVersion)
      .replace('{{ CAMUNDA_CLOUD_VERSION }}', cloudVersion)
  );
}

function replaceExporter(contents) {
  const {
    name,
    version
  } = Metadata;

  return (
    contents
      .replace('{{ EXPORTER_NAME }}', name)
      .replace('{{ EXPORTER_VERSION }}', version)
  );
}

function DisableHTTLHintPlugin() {
  return {
    config: {
      rules: {
        'bpmnlint-plugin-camunda-compat/history-time-to-live': 'off'
      }
    }
  };
}

function replaceHistoryTimeToLive(contents) {
  if (!Flags.get(DEFAULT_HTTL)) {
    return contents.replace('camunda:historyTimeToLive="{{ DEFAULT_HTTL }}"', '');
  }
  return (
    contents
      .replace('{{ DEFAULT_HTTL }}', Flags.get(DEFAULT_HTTL))
  );
}
