/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Metadata from '../../util/Metadata';

import { UAParser } from 'ua-parser-js';


const TAB_TYPE_MAPPING = {
  'bpmn': 'BPMN - Camunda 7',
  'cloud-bpmn': 'BPMN - Camunda 8',
  'dmn': 'DMN - Camunda 7',
  'cloud-dmn': 'DMN - Camunda 8',
  'form': 'Form - Camunda 7',
  'cloud-form': 'Form - Camunda 8'
};


export class ClipboardCopySystemInfo {

  constructor(props) {
    const {
      getGlobal,
      activeTab
    } = props;

    this._systemClipboard = getGlobal('systemClipboard');
    this._plugins = getGlobal('plugins');
    this._activeTab = activeTab;
  }

  clipboardCopy(config) {
    const systemInfo = this._compileSystemInfoString(config);
    this._systemClipboard.writeText({ text: systemInfo });
  }

  _compileSystemInfoString(config) {
    const {
      _appendVersion
    } = this;

    let systemInfoText = '## Camunda Modeler system information';

    if (config.version) {
      systemInfoText = appendVersion(systemInfoText, this._getVersion());
    }
    if (config.operatingSystem) {
      systemInfoText = appendOS(systemInfoText, this._getOS());
    }
    if (config.installedPlugins) {
      systemInfoText = appendPlugins(systemInfoText, this._getPlugins());
    }
    if (config.executionPlatform) {
      systemInfoText = appendExecutionPlatform(systemInfoText, this._getExecPlatform());
    }

    return systemInfoText;
  }

  _getVersion() {
    return Metadata.data.version;
  }

  _getOS() {
    const userAgentParsed = UAParser(navigator.userAgent);
    const { cpu, os } = userAgentParsed;
    return [ os.name, os.version, cpu.architecture ].join(' ');
  }

  _getPlugins() {
    return this._plugins.getAppPlugins();
  }

  _getExecPlatform() {
    const activeTab = this._activeTab;
    return activeTab && TAB_TYPE_MAPPING[activeTab.type];
  }
}

// helper //////////////////

function appendVersion(text, version) {
  return text + '\r\n * Version: ' + version;
}

function appendOS(text, os) {
  return text + '\r\n * Operating System: ' + os;
}

function appendPlugins(text, plugins) {
  return text + '\r\n * Plugins: ' + (plugins.length ?
    plugins.map(({ name }) => name).join(', ') :
    '<no plugins>');
}

function appendExecutionPlatform(text, execPlatform) {
  return text + '\r\n * Execution Platform: ' + (execPlatform ?
    execPlatform :
    '<no active Tab or no execution platform set>');
}
