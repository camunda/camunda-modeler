import React from 'react';

import { shallow } from 'enzyme';

import {
  App,
  EMPTY_TAB
} from '../App';

import {
  FileSystem,
  Dialog,
  TabsProvider
} from './mocks';


describe('<App />', function() {

  describe('component', function() {

    it('tabsProvider');

    it('onToolStateChanged');

    it('onReady');

    it('onContextMenu');

  });


  it('should render empty tab', function() {

    // when
    const {
      app
    } = createApp();

    // then
    const {
      tabs,
      activeTab
    } = app.state;

    expect(tabs).to.be.empty;
    expect(activeTab).to.equal(EMPTY_TAB);
  });


  it('should create diagrams', async function() {
    // given
    const {
      app
    } = createApp();

    // when
    await app.createDiagram('bpmn');
    await app.createDiagram('dmn');
    await app.createDiagram();

    // then
    const {
      tabs,
      activeTab
    } = app.state;

    expect(tabs.map(tab => tab.type)).to.eql([
      'bpmn',
      'dmn',
      'bpmn'
    ]);

    expect(activeTab).to.eql(tabs[2]);
  });


  describe('open files', function() {

    it('should create tabs', async function() {

      // given
      const {
        app
      } = createApp();

      const file1 = createFile('foo.bpmn');
      const file2 = createFile('bar.bpmn');

      // when
      setTimeout(function() {
        app.handleTabShown(app.findOpenTab(file2));
      }, 6);

      const openedTabs = await app.openFiles([ file1, file2 ]);

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(openedTabs).to.eql(tabs);
      expect(activeTab).to.eql(app.findOpenTab(file2));
    });


    it('should keep existing tabs (by path)', async function() {

      // given
      const {
        app
      } = createApp();

      const file1 = createFile('foo.bpmn');
      const file2 = createFile('bar.bpmn');

      await app.openFiles([ file1, file2 ]);

      const lastOpenTabs = app.state.tabs;

      // when
      await app.openFiles([ file1 ]);

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).to.equal(lastOpenTabs);
      expect(tabs.map(tab => tab.file)).to.eql([ file1, file2 ]);

      // existing tab is focussed
      expect(activeTab).to.eql(app.findOpenTab(file1));
    });

  });


  describe('tabs', function() {

    it('should close active', async function() {

      // given
      const {
        app
      } = createApp();

      const file1 = createFile('foo.bpmn');
      const file2 = createFile('bar.bpmn');

      await app.openFiles([ file1, file2 ]);

      const tab = app.state.activeTab;

      // when
      await app.closeTab(tab);

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).not.to.contain(tab);

      // existing tab is focussed
      expect(activeTab).to.eql(app.findOpenTab(file1));
    });


    it('should close all', async function() {

      // given
      const {
        app
      } = createApp();

      const file1 = createFile('foo.bpmn');
      const file2 = createFile('bar.bpmn');

      await app.openFiles([ file1, file2 ]);

      // when
      await app.closeTabs(t => true);

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).to.be.empty;

      // existing tab is focussed
      expect(activeTab).to.equal(EMPTY_TAB);
    });


    it('should save', function() {

    });


    it('should save all', function() {

    });


    describe('loading', function() {

      it('should lazy-load', function() {

      });


      it('should support life-cycle', function() {

      });

    });


    describe('navigation', function() {

      it('should select tab', async function() {

      });


      it('should navigate', function() {

      });


      it('should reopen last', function() {

      });

    });

  });

});


const globals = {
  dialog: new Dialog(),
  fileSystem: new FileSystem()
};

const cache = {
  destroy() { }
};

function noop() {}

function createApp(options = {}) {

  let app;

  const tree = shallow(
    <App
      tabsProvider={ options.tabsProvider || new TabsProvider() }
      global={ options.globals || globals }
      onReady={ options.onReady || noop }
      onToolStateChanged={ options.onToolStateChanged || noop }
      onTabChanged={ newTab => setTimeout(() => app.handleTabShown(newTab), 0) }
      cache={ cache }
    />
  );

  app = tree.instance();

  return {
    tree,
    app
  };

}


function createFile(name, path) {

  path = typeof path === 'undefined' ? name : path;

  return {
    name,
    path
  };
}