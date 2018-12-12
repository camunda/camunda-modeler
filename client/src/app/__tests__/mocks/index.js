import { Component } from 'react';

import {
  assign,
  forEach
} from 'min-dash';

import EmptyTab from '../../EmptyTab';

const ENCODING_BASE64 = 'base64',
      ENCODING_UTF8 = 'utf8';

const EXPORT_JPG = {
  name: 'JPG',
  encoding: ENCODING_BASE64,
  extensions: [ '.jpg' ]
};

const EXPORT_PNG = {
  name: 'PNG',
  encoding: ENCODING_BASE64,
  extensions: [ '.png' ]
};

const EXPORT_SVG = {
  name: 'SVG',
  encoding: ENCODING_UTF8,
  extensions: [ '.svg' ]
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
          jpg: EXPORT_JPG,
          png: EXPORT_PNG,
          svg: EXPORT_SVG
        },
        extensions: [ 'bpmn', 'xml' ]
      },
      cmmn: {
        name: 'CMMN',
        encoding: ENCODING_UTF8,
        exports: {
          jpg: EXPORT_JPG,
          png: EXPORT_PNG,
          svg: EXPORT_SVG
        },
        extensions: [ 'cmmn', 'xml' ]
      },
      dmn: {
        name: 'DMN',
        encoding: ENCODING_UTF8,
        exports: {
          jpg: EXPORT_JPG,
          png: EXPORT_PNG,
          svg: EXPORT_SVG
        },
        extensions: [ 'dmn', 'xml' ]
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
    return this.providers[type];
  }

  getTabComponent(type) {
    return this.resolveTab(type);
  }


  getInitialFileContents() {
    return '<contents>';
  }

}


class Mock {

  constructor(overrides = {}) {
    assign(this, overrides);
  }

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

export class Backend extends Mock {

  constructor(overrides) {
    super(overrides);

    this.listeners = {};
  }

  send(event, ...args) {
    const callback = this.listeners[event];

    if (typeof callback === 'function') {
      callback(args);
    }
  }

  sendMenuUpdate() {}

  sendQuitAllowed() {}

  on(event, callback) {
    this.listeners[event] = callback.bind(this);
  }

  once() {}

  off() {}

  registerMenu = () => Promise.resolve()

  getPlatform() {}

}

export class Workspace extends Mock {

  save() {}

  restore(defaultConfig) {
    return this.config || defaultConfig;
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