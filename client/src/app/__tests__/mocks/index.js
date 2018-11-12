import { Component } from 'react';

import {
  assign,
  forEach
} from 'min-dash';

import EmptyTab from '../../EmptyTab';

const ENCODING_BASE64 = 'base64',
      ENCODING_UTF8 = 'utf8';


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
        exports: {
          jpg: { encoding: ENCODING_BASE64 },
          png: { encoding: ENCODING_BASE64 },
          svg: { encoding: ENCODING_UTF8 }
        }
      },
      cmnn: {
        name: 'CMMN',
        exports: {
          jpg: { encoding: ENCODING_BASE64 },
          png: { encoding: ENCODING_BASE64 },
          svg: { encoding: ENCODING_UTF8 }
        }
      },
      dmn: {
        name: 'DMN',
        exports: {
          jpg: { encoding: ENCODING_BASE64 },
          png: { encoding: ENCODING_BASE64 },
          svg: { encoding: ENCODING_UTF8 }
        }
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

    return {
      id: this.uuid++,
      get name() {
        return this.file.name;
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

    this.showOpenFilesDialogResponse = null;
    this.showSaveFileDialogResponse = null;
    this.showResponse = null;
    this.showCloseFileDialogResponse = null;
    this.showOpenFileErrorDialogResponse = null;
    this.showEmptyFileDialogResponse = null;
  }

  setShowOpenFilesDialogResponse(response) {
    this.showOpenFilesDialogResponse = response;
  }

  setShowSaveFileDialogResponse(response) {
    this.showSaveFileDialogResponse = response;
  }

  setShowResponse(response) {
    this.showResponse = response;
  }

  setShowCloseFileDialogResponse(response) {
    this.showCloseFileDialogResponse = response;
  }

  setShowOpenFileErrorDialogResponse(response) {
    this.showOpenFileErrorDialogResponse = response;
  }

  setShowEmptyFileDialogResponse(response) {
    this.showEmptyFileDialogResponse = response;
  }

  showOpenFilesDialog() {
    return this.showOpenFilesDialogResponse;
  }

  showSaveFileDialog() {
    return this.showSaveFileDialogResponse;
  }

  show() {
    return this.showResponse;
  }

  showCloseFileDialog() {
    return this.showCloseFileDialogResponse;
  }

  showOpenFileErrorDialog() {
    return this.showOpenFileErrorDialogResponse;
  }

  showEmptyFileDialog() {
    return this.showEmptyFileDialogResponse;
  }
}

export class FileSystem extends Mock {
  constructor(overrides) {
    super(overrides);

    this.openFilesResponse = [];
    this.saveFileResponse = {};
    this.readFileResponse = {};
    this.readFileStatsResponse = {};
    this.writeFileResponse = {};
  }

  setOpenFilesResponse(response) {
    this.openFilesResponse = response;
  }

  setSaveFileResponse(response) {
    this.saveFileResponse = response;
  }

  setReadFileResponse(response) {
    this.readFileResponse = response;
  }

  setReadFileStatsResponse(response) {
    this.readFileStatsResponse = response;
  }

  setWriteFileResponse(response) {
    this.writeFileResponse = response;
  }

  openFiles() {
    return this.openFilesResponse;
  }

  saveFile() {
    return this.saveFileResponse;
  }

  readFile() {
    return this.readFileResponse;
  }

  readFileStats() {
    return this.readFileStatsResponse;
  }

  writeFile() {
    return this.writeFileResponse;
  }
}

export class Backend extends Mock {

  send() {}

  sendUpdateMenu() {}

  on() {}

  once() {}

  off() {}

  registerMenu = () => Promise.resolve()

}

export class Workspace extends Mock {

  save() {}

  restore(defaultConfig) {
    return this.config || defaultConfig;
  }
}