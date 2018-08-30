import React from 'react';

import {
  shallow,
  mount
} from 'enzyme';

import {
  App,
  EMPTY_TAB
} from '../App';

import {
  FileSystem,
  Dialog,
  TabsProvider
} from './mocks';


/* global sinon */
const { spy } = sinon;


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

      it('should support life-cycle', async function() {

        // given
        const events = [];

        const onTabChanged = spy(function(tab, oldTab) {
          events.push([ 'tab-changed', tab ]);

          app.handleTabShown(tab);
        });

        const onTabShown = spy(function(tab) {
          events.push([ 'tab-shown', tab ]);
        });

        const {
          app
        } = createApp({
          onTabChanged,
          onTabShown
        });

        // when
        const tab = await app.createDiagram('bpmn');

        // then
        expect(events).to.eql([
          [ 'tab-changed', tab ],
          [ 'tab-shown', tab ]
        ]);
      });


      it('should lazy load via tabsProvider', async function() {

        // given
        const events = [];

        const onTabChanged = spy(function(tab, oldTab) {
          events.push([ 'tab-changed', tab ]);
        });

        const onTabShown = spy(function(tab) {
          events.push([ 'tab-shown', tab ]);
        });

        const {
          app
        } = createApp({
          onTabChanged,
          onTabShown
        }, mount);

        // when
        const tab = await app.createDiagram('bpmn');


        // then
        expect(events).to.eql([
          [ 'tab-changed', tab ],
          [ 'tab-shown', tab ]
        ]);
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


class Cache {
  destroy() { }
}


function createApp(options = {}, mountFn=shallow) {

  let app;

  const cache = options.cache || new Cache();

  const globals = options.globals || {
    dialog: new Dialog(),
    fileSystem: new FileSystem()
  };

  const tabsProvider = options.tabsProvider || new TabsProvider();

  const onTabChanged = options.onTabChanged || function(newTab) {
    setTimeout(() => {
      app.handleTabShown(newTab);
    }, 0);
  };

  const onTabShown = options.onTabShown;
  const onToolStateChanged = options.onToolStateChanged;
  const onReady = options.onReady;

  const tree = mountFn(
    <App
      cache={ cache }
      globals={ globals }
      tabsProvider={ tabsProvider }
      onReady={ onReady }
      onTabChanged={ onTabChanged }
      onTabShown={ onTabShown }
      onToolStateChanged={ onToolStateChanged }
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