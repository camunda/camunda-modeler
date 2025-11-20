/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { Component } from 'react';

import {
  assign,
  forEach
} from 'min-dash';

import EmptyTab from '../../EmptyTab';

import { Linter as BpmnLinter } from 'test/mocks/linting';

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


class FakeTab extends Component {

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    const {
      onShown
    } = this.props;

    onShown();
  }

  componentDidUpdate() {

    const {
      error
    } = this.state;

    if (error) {
      throw error;
    }
  }

  triggerAction(action, options) {
    console.log('FakeTab#triggerAction', action, options);

    if (action === 'save') {
      return 'CONTENTS';
    }

    if (action === 'export-as') {
      return 'EXPORT CONTENTS';
    }

    if (action === 'error') {
      this.props.onError(options);
    }

    if (action === 'warning') {
      this.props.onWarning(options);
    }

    if (action === 'errorThrow') {
      this.setState({
        error: options
      });
    }
  }

  render() {
    return null;
  }

}


const noopProvider = {
  getComponent() {
    return null;
  },
  getInitialContents() {
    return null;
  }
};

export class TabsProvider {

  constructor(resolveTab) {
    this.uuid = 0;

    this.resolveTab = resolveTab || function(type) {

      if (type === 'empty') {
        return EmptyTab;
      }

      return Promise.resolve({ default: FakeTab });
    };

    this.providers = {
      bpmn: {
        name: 'BPMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'bpmn', 'xml' ],
        getLinter(plugins) {
          return new BpmnLinter({ plugins });
        },
        getNewFileMenu() {
          return [ {
            label: 'BPMN diagram',
            group: 'Camunda 7',
            action: 'create-bpmn-diagram'
          } ];
        },
        getIcon() { return null; }
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
        getLinter(plugins) {
          return new BpmnLinter({ plugins });
        },
        getNewFileMenu() {
          return [ {
            label: 'BPMN diagram',
            group: 'Camunda 8',
            action: 'create-cloud-bpmn-diagram'
          } ];
        },
        getIcon() { return null; }
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
        getLinter() {
          return null;
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
        getLinter() {
          return null;
        },
        getIcon() { return null; }
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
        getLinter() {
          return null;
        },
        getIcon() { return null; }
      },
      form: {
        name: 'FORM',
        encoding: ENCODING_UTF8,
        exports: {},
        extensions: [ 'form' ],
        getLinter() {
          return {
            lint(contents) {
              if (contents === 'linting-errors') {
                return [
                  {
                    id: 'Field_1',
                    path: [],
                    message: 'foo'
                  }
                ];
              }

              return [];
            }
          };
        },
        getIcon() { return null; }
      }
    };
  }

  createTab(type) {
    return this.createTabForFile({
      name: `diagram_1.${type}`,
      contents: '<contents>',
      path: null
    });
  }

  createTabForFile(file) {
    const type = file.name.substring(file.name.lastIndexOf('.') + 1);

    if (!this.hasProvider(type)) {
      return null;
    }

    return {
      id: this.uuid++,
      get name() {
        return this.file.name;
      },
      set name(newName) {
        this.file.name = newName;
      },
      file,
      type
    };
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

  getProviderForFile(file) {
    const type = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
    return this.getProvider(type);
  }

  hasProvider(type) {
    return !!this.providers[type];
  }

  getProvider(type) {
    return this.providers[type] || noopProvider;
  }

  getTabComponent(type) {
    return this.resolveTab(type);
  }

  getTabIcon() {
    return null;
  }
}


class Mock {

  constructor(overrides = {}) {
    assign(this, overrides);
  }

}

export class Cache extends Mock {
  destroy() {}
}

export class Dialog extends Mock {
  constructor(overrides) {
    super(overrides);

    this.showOpenFilesDialogResponse = new Response();
    this.showOpenFileErrorDialogResponse = new Response();
    this.showSaveFileDialogResponse = new Response();
    this.showSaveFileErrorDialogResponse = new Response();
    this.showResponse = new Response();
    this.showCloseFileDialogResponse = new Response();
    this.showEmptyFileDialogResponse = new Response();
    this.showFileExplorerDialogResponse = new Response();
    this.showReloadModelerDialogResponse = new Response();
  }

  setShowOpenFilesDialogResponse(index, response) {
    this.showOpenFilesDialogResponse.setResponse(index, response);
  }

  setShowOpenFileErrorDialogResponse(index, response) {
    this.showOpenFileErrorDialogResponse.setResponse(index, response);
  }

  setShowSaveFileDialogResponse(index, response) {
    this.showSaveFileDialogResponse.setResponse(index, response);
  }

  setShowSaveFileErrorDialogResponse(index, response) {
    this.showSaveFileErrorDialogResponse.setResponse(index, response);
  }

  setShowResponse(index, response) {
    this.showResponse.setResponse(index, response);
  }

  setShowCloseFileDialogResponse(index, response) {
    this.showCloseFileDialogResponse.setResponse(index, response);
  }

  setShowEmptyFileDialogResponse(index, response) {
    this.showEmptyFileDialogResponse.setResponse(index, response);
  }

  setShowReloadModelerDialogResponse(index, response) {
    this.showReloadModelerDialogResponse.setResponse(index, response);
  }

  showOpenFilesDialog() {
    return this.showOpenFilesDialogResponse.next();
  }

  showOpenFileErrorDialog() {
    return this.showOpenFileErrorDialogResponse.next();
  }

  showSaveFileDialog() {
    return this.showSaveFileDialogResponse.next();
  }

  showSaveFileErrorDialog() {
    return this.showSaveFileErrorDialogResponse.next();
  }

  show() {
    return this.showResponse.next();
  }

  showCloseFileDialog() {
    return this.showCloseFileDialogResponse.next();
  }

  showEmptyFileDialog() {
    return this.showEmptyFileDialogResponse.next();
  }

  showFileExplorerDialog() {
    return this.showFileExplorerDialogResponse.next();
  }

  showReloadDialog() {
    return this.showReloadModelerDialogResponse.next();
  }

}

export class FileSystem extends Mock {
  constructor(overrides) {
    super(overrides);

    this.readFileResponse = new Response(Promise.resolve({}));
    this.readFileStatsResponse = new Response(Promise.resolve({}));
    this.writeFileResponse = new Response(Promise.resolve({}));
  }

  setReadFileResponse(index, response) {
    this.readFileResponse.setResponse(index, response);
  }

  setReadFileStatsResponse(index, response) {
    this.readFileStatsResponse.setResponse(index, response);
  }

  setWriteFileResponse(index, response) {
    this.writeFileResponse.setResponse(index, response);
  }

  readFile() {
    return this.readFileResponse.next();
  }

  readFileStats() {
    return this.readFileStatsResponse.next();
  }

  writeFile() {
    return this.writeFileResponse.next();
  }
}

export class ZeebeAPI extends Mock {

}

export class Backend extends Mock {

  constructor(overrides) {
    super(overrides);

    this.listeners = {};
  }

  /**
   * Simulate receiving an event from remote.
   *
   * @param {Event}    event
   * @param {...Object} args
   */
  receive(event, ...args) {
    const listeners = this.listeners[event] || [];

    listeners.forEach(function(l) {
      l(...args);
    });
  }

  sendMenuUpdate() {}

  sendQuitAllowed() {}

  sendQuitAborted() {}

  sendReady() { }

  send() { }

  on(event, listener) {
    this.listeners[event] = (this.listeners[event] || []).concat([ listener.bind(this) ]);

    return {
      cancel: () => {
        this.listeners[event] = without(this.listeners[event], listener);
      }
    };
  }

  once(event, listener) {
    this.listeners[event] = (this.listeners[event] || []).concat([ listener.bind(this) ]);

    return {
      cancel: () => {
        this.listeners[event] = without(this.listeners[event], listener);
      }
    };
  }

  registerMenu = () => Promise.resolve();

  getPlatform() {}

}

export class Workspace extends Mock {

  save() {}

  restore(defaultConfig) {
    return {
      ...defaultConfig,
      ...(this.config || {})
    };
  }
}

export class KeyboardBindings extends Mock {
  bind() {}

  unbind() {}

  update() {}

  setOnAction() {}
}

export class Config extends Mock {
  get() {}

  set() {}

  getForFile() {}

  setForFile() {}

  getForPlugin() {}

  setForPlugin() {}
}

export class Log extends Mock {
  error() {}
}

export class Settings extends Mock {
  register() {}

  get() {}

  set() {}

  getSchema() {}

  subscribe() {}
}

/**
 * Response mock. Returns responses in desired order.
 *
 * Example:
 *
 * const response = new Reponse('foo');
 *
 * response.next(); // returns 'foo'
 *
 * response.setResponse(0, 'bar');
 * response.setResponse(1, 'baz');
 *
 * response.next(); // returns 'bar'
 * response.next(); // returns 'baz'
 * response.next(); // returns 'baz'
 */
class Response {
  constructor(defaultResponse = null) {
    this.response = [ defaultResponse ];
  }

  /**
   * Return specified responses in order.
   * Return last response if only one left.
   * Return null if no response set.
   */
  next() {
    return this.response.length > 1
      ? this.response.shift()
      : this.response[0];
  }

  /**
   * Set responses in desired order.
   */
  setResponse(index, response) {
    if (!response) {
      response = index;
      index = 0;
    }

    this.response[index] = response;
  }
}

export class Plugins extends Mock {
  get() {
    return [];
  }

  getAppPlugins() {
    return [];
  }
}

export class SystemClipboard extends Mock {
  writeText() {
    return undefined;
  }
}

export class Deployment extends Mock {
  getConfigForFile() {}

  deploy() {
    return { success: true };
  }

  on() {}

  off() {}

  registerResourcesProvider() {}

  unregisterResourcesProvider() {}
}

export class StartInstance extends Mock {}

function without(arr, toRemove) {
  return arr.filter(item => item !== toRemove);
}
