import React from 'react';

import { shallow } from 'enzyme';

import {
  App
} from '../../src/app/App';

// mocks //////////
// TODO(philippfromme): where to put these mocks?
class TabsProvider {
  createTab(type) {
    return {
      file: {
        name: 'diagram_1.bpmn',
        contents: '<contents>',
        path: null
      },
      id: 'diagram_1',
      name: 'diagram_1.bpmn',
      title: 'unsaved',
      type
    };
  }

  getTabComponent(type) {
    return null;
  }
}

class Dialog {
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

class FileSystem {
  writeFile() {

    // TODO: what do files look like?
    return {};
  }
}

const globals = {
  dialog: new Dialog(),
  fileSystem: new FileSystem()
};

function noop() {}

function createApp(options = {}) {
  return shallow(<App
    tabsProvider={ options.tabsProvider || new TabsProvider() }
    global={ options.globals || globals }
    onReady={ options.onReady || noop }
    onToolStateChanged={ options.onToolStateChanged || noop } />);
}


describe('App', function() {

  it('should render', function() {

    // when
    const instance = createApp().instance();

    // then
    expect(instance).to.exist;
  });


  describe('tabs', function() {

    it('should open tab');

    it('should open tabs');

    it('show tab');

    it('should navigate tab <');

    it('should navigate tab >');

    it('should close tab');

    it('should close tabs');

  });

});