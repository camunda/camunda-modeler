import { Component } from 'react';

class FakeTab extends Component {

  componentDidMount() {
    const {
      tab,
      onShown
    } = this.props;

    onShown(tab);
  }

  triggerAction(action, options) {
    console.log('FakeTab#triggerAction', action, options);

    if (action === 'save') {
      return 'CONTENTS';
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
      return Promise.resolve({ default: FakeTab });
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

  getTabComponent(type) {
    return this.resolveTab(type);
  }

}

export class Dialog {
  constructor() {
    this.askSaveResponse = null;
    this.openFileResponse = null;
  }

  setAskSaveResponse(response) {
    this.askSaveResponse = response;
  }

  setOpenFileResponse(response) {
    this.this.openFileResponse = response;
  }

  askSave() {
    return this.askSaveResponse;
  }

  openFile() {
    return this.openFileResponse;
  }
}

export class FileSystem {
  writeFile() {

    // TODO: what do files look like?
    return {};
  }
}

export class Backend {
  sendUpdateMenu() {}
}