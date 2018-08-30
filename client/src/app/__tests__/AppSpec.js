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

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

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

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

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

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

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

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

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

      let app, openedTabs;

      beforeEach(async function() {
        const rendered = createApp();

        app = rendered.app;

        const file1 = createFile('1.bpmn');
        const file2 = createFile('2.bpmn');

        openedTabs = [
          await app.createDiagram(),
          ...(await app.openFiles([ file1, file2 ])),
          await app.createDiagram(),
        ];

        // assume
        const {
          tabs,
          activeTab
        } = app.state;

        expect(tabs).to.eql(openedTabs);
        expect(activeTab).to.eql(openedTabs[3]);
      });


      it('should select tab', async function() {

        // when
        await app.selectTab(openedTabs[0]);

        // then
        const {
          activeTab
        } = app.state;

        expect(activeTab).to.eql(openedTabs[0]);
      });


      describe('should navigate', function() {

        it('back', async function() {

          // when
          await app.navigate(-1);

          // then
          const {
            activeTab
          } = app.state;

          expect(activeTab).to.eql(openedTabs[2]);
        });


        it('forward', async function() {

          // when
          await app.navigate(1);

          // then
          const {
            activeTab
          } = app.state;

          expect(activeTab).to.eql(openedTabs[0]);
        });

      });


      describe('should reopen last', function() {

        it('saved', async function() {

          // given
          const savedTab = openedTabs[2];
          const file = savedTab.file;

          await app.closeTab(savedTab);

          // when
          await app.triggerAction('reopen-last-tab');

          // then
          const {
            activeTab
          } = app.state;

          expect(activeTab.file).to.eql(file);
        });


        it('reject unsaved', async function() {

          // given
          const newTab = openedTabs[3];

          await app.closeTab(newTab);

          // when
          try {
            await app.triggerAction('reopen-last-tab');

            expect.fail('expected exception');
          } catch (e) {
            expect(e.message).to.eql('no last tab');
          }
        });


        it('after all closed', async function() {

          // given
          await app.closeTabs((t) => true);

          // when
          await app.triggerAction('reopen-last-tab');
          await app.triggerAction('reopen-last-tab');

          // then
          const {
            activeTab,
            tabs
          } = app.state;

          const expectedOpen = [
            app.findOpenTab(openedTabs[2].file),
            app.findOpenTab(openedTabs[1].file)
          ];

          expect(tabs).to.eql(expectedOpen);
          expect(activeTab).to.eql(expectedOpen[1]);
        });

      });


      describe('__internal__', function() {

        it('should reset state on all closed', async function() {

          // when
          await app.triggerAction('close-all-tabs');

          // then
          const tabHistory = app.tabHistory;

          expect(tabHistory.elements).to.be.empty;
          expect(tabHistory.idx).to.eql(-1);
          expect(tabHistory.get()).not.to.exist;
        });

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
    app.handleTabShown(newTab);
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