import React, { Component } from 'react';

import { WithCache } from './cached';

import {
  Fill,
  SlotFillRoot
} from './slot-fill';

import Toolbar from './Toolbar';
import EmptyTab from './EmptyTab';

import debug from 'debug';

import {
  Button,
  DropdownButton,
  TabLinks,
  TabContainer,
  Tab,
  Icon,
  Loader
} from './primitives';

import pDefer from 'p-defer';
import pSeries from 'p-series';

import History from './History';

import css from './App.less';

const log = debug('App');

const tabLoaded = {
  empty: EmptyTab
};

export const EMPTY_TAB = {
  id: '__empty',
  type: 'empty'
};


export class App extends Component {

  constructor(props, context) {
    super();


    this.state = {
      tabs: [],
      activeTab: EMPTY_TAB,
      dirtyTabs: {}
    };

    // TODO(nikku): make state
    this.tabHistory = new History();

    // TODO(nikku): make state
    this.closedTabs = new History();

    this.tabRef = React.createRef();
  }

  createDiagram = async (type = 'bpmn', options) => {

    const {
      tabsProvider
    } = this.props;

    const tab = this.addTab(
      tabsProvider.createTab(type, options)
    );

    await this.showTab(tab);

    return tab;
  }

  /**
   * Add a tab to the tab list.
   */
  addTab(tab) {

    this.setState((state) => {
      const {
        tabs,
        activeTab
      } = state;

      if (tabs.indexOf(tab) !== -1) {
        throw new Error('tab exists');
      }

      const insertIdx = tabs.indexOf(activeTab) + 1;

      return {
        tabs: [
          ...tabs.slice(0, insertIdx),
          tab,
          ...tabs.slice(insertIdx)
        ]
      };
    });

    return tab;
  }


  /**
   * Show the tab.
   *
   * @param {Tab} tab
   */
  showTab = (tab) => {

    const {
      activeTab,
      tabShown
    } = this.state;

    if (tab === activeTab) {
      return tabShown.promise;
    }

    const tabHistory = this.tabHistory;

    tabHistory.push(tab);

    return this.setActiveTab(tab);
  }

  /**
   * Navigate shown tabs in given direction.
   */
  navigate(direction) {

    const {
      activeTab,
      tabs
    } = this.state;

    // next tab in line as a fallback to history
    // navigation
    const nextFn = function() {
      return getNextTab(tabs, activeTab, direction);
    };

    const tabHistory = this.tabHistory;

    const nextActiveTab = tabHistory.navigate(direction, nextFn);

    return this.setActiveTab(nextActiveTab);
  }

  setActiveTab(tab) {

    const {
      activeTab,
      tabShown
    } = this.state;

    if (activeTab === tab) {
      return tabShown.promise;
    }

    if (tab !== EMPTY_TAB) {
      const navigationHistory = this.tabHistory;

      if (navigationHistory.get() !== tab) {
        navigationHistory.push(tab);
      }
    }

    const deferred = pDefer();

    this.setState({
      activeTab: tab,
      Tab: this.loadTab(tab),
      tabShown: deferred,
      tabState: 'loading'
    });

    return deferred.promise;
  }

  closeTab = async (tab) => {

    if (this.isDirty(tab)) {
      await this.saveTab(tab, { ask: true });
    }

    await this._removeTab(tab);
  }

  isDirty = (tab) => {
    return isNew(tab) || this.state.dirtyTabs[tab.id];
  }

  async _removeTab(tab) {

    const {
      tabs,
      activeTab,
      openedTabs
    } = this.state;

    const {
      tabHistory,
      closedTabs
    } = this;

    const {
      ...newOpenedTabs
    } = openedTabs;

    delete newOpenedTabs[tab.id];

    const newTabs = tabs.filter(t => t !== tab);

    tabHistory.purge(tab);

    if (!isNew(tab)) {
      closedTabs.push(tab);
    }

    if (activeTab === tab) {

      const tabIdx = tabs.indexOf(tab);

      // open previous tab, if it exists
      const nextActive = (
        tabHistory.get() ||
        newTabs[tabIdx] ||
        newTabs[tabIdx - 1] ||
        EMPTY_TAB
      );

      await this.setActiveTab(nextActive);
    }

    this.setState({
      tabs: newTabs,
      openedTabs: newOpenedTabs
    }, () => {
      this.props.cache.destroy(tab.id);
    });
  }

  selectTab = tab => {
    return this.setActiveTab(tab);
  }

  askSave = (file) => {
    return this.props.globals.dialog.askSave({ name: file.name });
  }

  showOpenDialog = async () => {
    const files = await this.props.globals.dialog.openFile(null);

    await this.openFiles(files);
  }

  openFiles = async (files) => {

    const {
      tabsProvider
    } = this.props;

    if (!files.length) {
      return [];
    }

    // open tabs from last to first to
    // keep display order in tact
    const openedTabs = files.slice().reverse().map(
      file => {
        let tab = this.findOpenTab(file);

        if (!tab) {
          tab = this.addTab(
            tabsProvider.createTabForFile(file)
          );
        }

        return tab;
      }
    );

    await this.selectTab(openedTabs[0]);

    // open tabs from last to first to
    // keep display order in tact
    return openedTabs.reverse();
  }

  findOpenTab(file) {

    const {
      tabs
    } = this.state;

    return tabs.find(t => t.file && t.file.path === file.path);
  }

  openTabLinksMenu = (tab, event) => {
    event.preventDefault();

    this.props.onContextMenu('tab', { tabId: tab.id });
  }

  openTabMenu = (event, type, context) => {
    event.preventDefault();

    this.props.onContextMenu(type);
  }

  /**
   * Mark the active tab as shown.
   */
  handleTabShown = (tab) => {

    const {
      openedTabs,
      activeTab,
      tabShown
    } = this.state;

    if (tab === activeTab) {
      tabShown.resolve();
    } else {
      tabShown.reject(new Error('tab miss-match'));
    }

    this.setState({
      openedTabs: {
        ...openedTabs,
        [activeTab.id]: true
      },
      tabState: 'shown'
    });
  }

  handleTabChanged = (tab, properties) => {
    let {
      dirtyTabs,
    } = this.state;

    if ('dirty' in properties) {

      const newDirtyTabs = {
        ...dirtyTabs,
        [tab.id]: properties.dirty
      };

      return this.setState({
        dirtyTabs: newDirtyTabs
      });
    }
  }

  tabSaved(tab, newFile) {

    const {
      dirtyTabs,
      tabs
    } = this.state;

    tab.file = newFile;

    this.setState({
      tabs: [ ...tabs ],
      dirtyTabs: {
        ...dirtyTabs,
        [tab.id]: false
      }
    });
  }

  loadTab(tab) {

    const type = tab.type;

    if (tabLoaded[type]) {
      return tabLoaded[type];
    }

    const {
      tabsProvider
    } = this.props;

    var tabComponent = tabsProvider.getTabComponent(type) || missingProvider(type);

    Promise.resolve(tabComponent).then((c) => {

      var Tab = c.default || c;

      tabLoaded[type] = Tab;

      if (this.state.activeTab === tab) {
        this.setState({
          Tab
        });
      }
    });

    return LoadingTab;
  }

  componentDidMount() {
    const {
      onReady
    } = this.props;

    if (typeof onReady === 'function') {
      onReady();
    }
  }

  componentDidUpdate(prevProps, prevState) {

    const {
      activeTab,
      tabState
    } = this.state;

    const {
      onTabChanged,
      onTabShown,
      onToolStateChanged
    } = this.props;

    if (prevState.activeTab !== activeTab) {

      if (typeof onToolStateChanged === 'function') {
        onToolStateChanged(activeTab, {
          closable: activeTab !== EMPTY_TAB,
          save: activeTab !== EMPTY_TAB,
          dirty: this.isDirty(activeTab)
        });
      }

      if (typeof onTabChanged === 'function') {
        onTabChanged(activeTab, prevState.activeTab);
      }
    }

    if (tabState === 'shown' && prevState.tabState !== 'shown') {

      if (typeof onTabShown === 'function') {
        onTabShown(activeTab);
      }

    }

  }

  async saveTab(tab, options = {}) {
    await this.showTab(tab);

    let {
      saveAs,
      ask
    } = options;

    const action = ask ? await this.askSave(tab) : 'save';

    if (action === 'cancel') {
      throw new Error('user canceled');
    }

    if (action === 'save') {
      const contents = await this.tabRef.current.triggerAction('save');

      // unsaved ?
      saveAs = saveAs || isNew(tab);

      const newFile = await this.props.globals.fileSystem.writeFile({
        ...tab.file,
        contents
      }, { saveAs });

      this.tabSaved(tab, newFile);
    }
  }

  saveAllTabs = () => {

    const {
      tabs
    } = this.state;

    const saveTasks = tabs.filter(this.isDirty).map((tab) => {
      return () => this.saveTab(tab);
    });

    return pSeries(saveTasks);
  }

  closeTabs = (matcher) => {

    const {
      tabs
    } = this.state;

    const allTabs = tabs.slice();

    const closeTasks = allTabs.filter(matcher).map((tab) => {
      return () => this.closeTab(tab);
    });

    return pSeries(closeTasks);
  }

  reopenLastTab = () => {

    const lastTab = this.closedTabs.pop();

    if (lastTab) {
      this.addTab(lastTab);

      return this.showTab(lastTab);
    }

    return Promise.reject(new Error('no last tab'));
  }

  showShortcuts = () => {
    // TODO(nikku): implement
    console.error('NOT IMPLEMENTED');
  }

  triggerAction = (action, options) => {

    const {
      activeTab
    } = this.state;


    log('App#triggerAction %s %o', action, options);

    if (action === 'select-tab') {
      if (options === 'next') {
        this.navigate(1);
      }

      if (options === 'previous') {
        this.navigate(-1);
      }

      return;
    }

    if (action === 'create-bpmn-diagram') {
      return this.createDiagram('bpmn');
    }

    if (action === 'create-dmn-diagram') {
      return this.createDiagram('dmn');
    }

    if (action === 'create-dmn-table') {
      return this.createDiagram('dmn', { table: true });
    }

    if (action === 'create-cmmn-diagram') {
      return this.createDiagram('cmmn');
    }

    if (action === 'open-diagram') {
      return this.showOpenDialog();
    }

    if (action === 'save-all') {
      return this.saveAllTabs();
    }

    if (action === 'save') {
      return this.saveTab(activeTab);
    }

    if (action === 'save-as') {
      return this.saveTab(activeTab, { saveAs: true });
    }

    if (action === 'quit') {
      return this.quit();
    }

    if (action === 'close-all-tabs') {
      return this.closeTabs(t => true);
    }

    if (action === 'close-tab') {
      return this.closeTabs(t => options && t.id === options.tabId);
    }

    if (action === 'close-active-tab') {
      let activeId = this.state.activeTab.id;

      return this.closeTabs(t => t.id === activeId);
    }

    if (action === 'close-other-tabs') {
      let activeId = options && options.tabId || this.state.activeTab.id;

      return this.closeTabs(t => t.id !== activeId);
    }

    if (action === 'reopen-last-tab') {
      return this.reopenLastTab();
    }

    if (action === 'show-shortcuts') {
      return this.showShortcuts();
    }

    const tab = this.tabRef.current;

    return tab.triggerAction(action, options);
  }

  quit() {
    return true;
  }

  composeAction = (...args) => async (event) => {
    await this.triggerAction(...args);
  }

  render() {
    const activeTab = this.state.activeTab || EMPTY_TAB;

    const { tabs } = this.state;

    const Tab = this.state.Tab || EmptyTab;

    return (
      <div className={ css.App }>

        <SlotFillRoot>

          <Toolbar />

          <Fill name="toolbar" group="general">
            <DropdownButton
              title="Create diagram"
              items={ [
                {
                  text: 'Create new BPMN diagram',
                  onClick: this.composeAction('create-bpmn-diagram')
                },
                {
                  text: 'Create new DMN table',
                  onClick: this.composeAction('create-dmn-diagram')
                },
                {
                  text: 'Create new DMN diagram (DRD)',
                  onClick: () => console.log('DMN diagram')
                },
                {
                  text: 'Create new CMMN diagram',
                  onClick: this.composeAction('create-cmmn-diagram')
                }
              ] }
            >
              <Icon name="new" />
            </DropdownButton>

            <Button
              title="Open diagram"
              onClick={ this.composeAction('open-diagram') }
            >
              <Icon name="open" />
            </Button>
          </Fill>

          <div className="tabs">
            <TabLinks
              className="primary"
              tabs={ tabs }
              isDirty={ this.isDirty }
              activeTab={ activeTab }
              onSelect={ this.selectTab }
              onContextMenu={ this.openTabLinksMenu }
              onClose={ (tab) => {
                this.triggerAction('close-tab', { tabId: tab.id }).catch(console.error);
              } }
              onCreate={ this.composeAction('create-bpmn-diagram') }
            />

            <TabContainer className="main">
              <Tab
                key={ activeTab.id }
                tab={ activeTab }
                onChanged={ this.handleTabChanged }
                onShown={ this.handleTabShown }
                onContextMenu={ this.openTabMenu }
                ref={ this.tabRef }
              />
            </TabContainer>
          </div>
        </SlotFillRoot>
      </div>
    );
  }
}


function missingProvider(providerType) {
  class MissingProviderTab extends Component {

    componentDidMount() {
      this.props.onShown(this.props.tab);
    }

    render() {
      return (
        <Tab key="missing-provider">
          <span>
            Cannot open tab: no provider for { providerType }.
          </span>
        </Tab>
      );
    }
  }

  return MissingProviderTab;
}

class LoadingTab extends Component {

  render() {
    return (
      <Tab key="loading">
        <Loader />
      </Tab>
    );
  }

}

function getNextTab(tabs, activeTab, direction) {
  let nextIdx = tabs.indexOf(activeTab) + direction;

  if (nextIdx === -1) {
    nextIdx = tabs.length - 1;
  }

  if (nextIdx === tabs.length) {
    nextIdx = 0;
  }

  return tabs[nextIdx];
}

function isNew(tab) {
  return tab.file && !tab.file.path;
}

/**


  shouldComponentUpdate(newProps, newState) {

    function compare(type, o, n) {

      Object.keys(o).forEach(function(k) {
        if (o[k] !== n[k]) {
          console.log('%s[%s] changed', type, k, o[k], n[k]);
        }
      });
    }

    compare('props', this.props, newProps);
    compare('state', this.state, newState);

    return true;
  }

 */
export default WithCache(App);