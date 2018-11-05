import { Component } from 'react';

import {
  assign,
  forEach
} from 'min-dash';

import EmptyTab from '../../EmptyTab';


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
      return 'CONTENTS';
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
      },
      cmnn: {
        name: 'CMMN'
      },
      dmn: {
        name: 'DMN'
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

    this.askSaveResponse = null;
    this.showOpenFilesDialogResponse = null;
    this.showResponse = null;
    this.showOpenFileErrorDialogResponse = null;
    this.showEmptyFileDialogResponse = null;
  }

  setShowOpenFilesDialogResponse(response) {
    this.showOpenFilesDialogResponse = response;
  }

  setAskSaveResponse(response) {
    this.askSaveResponse = response;
  }

  setAskExportAsResponse(response) {
    this.askExportAsResponse = response;
  }

  setShowResponse(response) {
    this.showResponse = response;
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

  askSave() {
    return this.askSaveResponse;
  }

  askExportAs() {
    return this.askExportAsResponse;
  }

  show() {
    return this.showResponse;
  }

  showOpenFileErrorDialog() {
    return this.showOpenFileErrorDialogResponse;
  }

  showEmptyFileDialog() {
    return this.showEmptyFileDialogResponse;
  }
}

export class FileSystem extends Mock {
  writeFile() {
    return {};
  }
}

export class Backend extends Mock {

  send() {}

  sendUpdateMenu() {}

  on() {}

  once() {}

  off() {}

}

export class Workspace extends Mock {

  save() {}

  restore(defaultConfig) {
    return this.config || defaultConfig;
  }
}