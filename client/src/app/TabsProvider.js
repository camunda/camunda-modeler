/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import bpmnDiagram from './tabs/bpmn/diagram.bpmn';
import cloudBpmnDiagram from './tabs/cloud-bpmn/diagram.bpmn';
import cmmnDiagram from './tabs/cmmn/diagram.cmmn';
import dmnDiagram from './tabs/dmn/diagram.dmn';

import replaceIds from '@bpmn-io/replace-ids';

import EmptyTab from './EmptyTab';

import { forEach } from 'min-dash';

import parseDiagramType from './util/parseDiagramType';

import {
  Flags,
  generateId
} from '../util';

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

/**
 * A provider that allows us to customize available tabs.
 */
export default class TabsProvider {

  constructor() {

    this.providers = {
      empty: {
        getComponent() {
          return EmptyTab;
        },
        getNewFileButton() {
          return null;
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
        getComponent(options) {
          return import('./tabs/bpmn');
        },
        getInitialContents(options) {
          return bpmnDiagram;
        },
        getHelpMenu() {
          return [{
            label: 'BPMN 2.0 Tutorial',
            action: 'https://camunda.org/bpmn/tutorial/'
          },
          {
            label: 'BPMN Modeling Reference',
            action: 'https://camunda.org/bpmn/reference/'
          }];
        },
        getNewFileMenu() {
          return [{
            label: 'BPMN Diagram (Camunda)',
            accelerator: 'CommandOrControl+T',
            action: 'create-bpmn-diagram'
          }];
        },
        getNewFileButton() {
          return {
            label: 'Create new BPMN Diagram (Camunda)',
            action: 'create-bpmn-diagram'
          };
        }
      },
      'cloud-bpmn': {
        name: null,
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'bpmn', 'xml' ],
        getComponent(options) {
          return import('./tabs/cloud-bpmn');
        },
        getInitialContents(options) {
          return cloudBpmnDiagram;
        },
        getHelpMenu() {
          return [];
        },
        getNewFileMenu() {
          return [{
            label: 'BPMN Diagram (Zeebe)',
            action: 'create-cloud-bpmn-diagram'
          }];
        },
        getNewFileButton() {
          return {
            label: 'Create new BPMN Diagram (Zeebe)',
            action: 'create-cloud-bpmn-diagram'
          };
        }
      },
      cmmn: {
        name: 'CMMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'cmmn', 'xml' ],
        getComponent(options) {
          return import('./tabs/cmmn');
        },
        getInitialContents(options) {
          return cmmnDiagram;
        },
        getHelpMenu() {
          return [{
            label: 'CMMN 1.1 Tutorial',
            action: 'https://docs.camunda.org/get-started/cmmn11/'
          },
          {
            label: 'CMMN Modeling Reference',
            action: 'https://docs.camunda.org/manual/latest/reference/cmmn11/'
          }];
        },
        getNewFileMenu() {
          return [{
            label: 'CMMN Diagram',
            action: 'create-cmmn-diagram'
          }];
        },
        getNewFileButton() {
          return {
            label: 'Create new CMMN Diagram',
            action: 'create-cmmn-diagram'
          };
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
        getComponent(options) {
          return import('./tabs/dmn');
        },
        getInitialContents() {
          return dmnDiagram;
        },
        getHelpMenu() {
          return [{
            label: 'DMN 1.1 Tutorial',
            action: 'https://camunda.org/dmn/tutorial/'
          }];
        },
        getNewFileMenu() {
          return [{
            label: 'DMN Diagram (Camunda)',
            action: 'create-dmn-diagram'
          }];
        },
        getNewFileButton() {
          return {
            label: 'Create new DMN Diagram (Camunda)',
            action: 'create-dmn-diagram'
          };
        }
      }
    };

    if (Flags.get('disable-cmmn', true)) {
      delete this.providers.cmmn;
    }

    if (Flags.get('disable-dmn')) {
      delete this.providers.dmn;
    }

  }

  getProviderNames() {
    const names = [];

    forEach(this.providers, (provider) => {
      const { name } = provider;

      if (name) {
        names.push(name);
      }
    });

    return names;
  }

  getProviders() {
    return this.providers;
  }

  hasProvider(type) {
    return !!this.providers[type];
  }

  getProvider(type) {
    return (this.providers[type] || noopProvider);
  }

  getTabComponent(type, options) {
    return this.getProvider(type).getComponent(options);
  }

  getInitialFileContents(type) {
    const rawContents = this.getProvider(type).getInitialContents();

    return rawContents && replaceIds(rawContents, generateId);
  }

  createFile(type) {

    const counter = (
      type in createdByType
        ? (++createdByType[type])
        : (createdByType[type] = 1)
    );

    const name = `diagram_${counter}.${type}`;

    const contents = this.getInitialFileContents(type);

    return {
      name,
      contents,
      path: null
    };
  }

  createTab(type, options) {

    const file = this.createFile(type, options);

    return this.createTabForFile(file);
  }

  getTabType(file) {

    const {
      name,
      contents
    } = file;

    const typeFromExtension = name.substring(name.lastIndexOf('.') + 1).toLowerCase();

    if (this.hasProvider(typeFromExtension)) {
      return typeFromExtension;
    }

    const typeFromContents = parseDiagramType(contents);

    if (typeFromContents && this.hasProvider(typeFromContents)) {
      return typeFromContents;
    }

    return null;
  }

  createTabForFile(file) {

    const id = generateId();

    const type = this.getTabType(file);

    if (!type) {
      return null;
    }

    // fill empty file with initial contents
    if (!file.contents) {
      file.contents = this.getInitialFileContents(type);
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
        return this.file.path || 'unsaved';
      },
      type
    };

  }

}
