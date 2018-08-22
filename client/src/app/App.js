import React, { Component } from 'react';

import { WithCache } from './cached';

import {
  Fill,
  SlotFillRoot
} from './slot-fill';

import classNames from 'classnames';

import Toolbar from './Toolbar';
import EmptyTab from './EmptyTab';

import {
  Button,
  MultiButton,
  TabLinks,
  TabContainer,
  Tab
} from './primitives';

import History from './History';

import css from './App.less';

let tabId = 0;

const tabLoaded = {
  empty: EmptyTab
};

const EMPTY_TAB = {
  id: '__empty',
  type: 'empty'
};

const LOGO_SRC = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20960%20960%22%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M960%2060v839c0%2033-27%2061-60%2061H60c-33%200-60-27-60-60V60C0%2027%2027%200%2060%200h839c34%200%2061%2027%2061%2060z%22%2F%3E%3Cpath%20fill%3D%22%23DDD%22%20d%3D%22M217%20548a205%20205%200%200%200-144%2058%20202%20202%200%200%200-4%20286%20202%20202%200%200%200%20285%203%20200%20200%200%200%200%2048-219%20203%20203%200%200%200-185-128zM752%206a206%20206%200%200%200-192%20285%20206%20206%200%200%200%20269%20111%20207%20207%200%200%200%20111-260A204%20204%200%200%200%20752%206zM62%200A62%2062%200%200%200%200%2062v398l60%2046a259%20259%200%200%201%2089-36c5-28%2010-57%2014-85l99%202%2012%2085a246%20246%200%200%201%2088%2038l70-52%2069%2071-52%2068c17%2030%2029%2058%2035%2090l86%2014-2%20100-86%2012a240%20240%200%200%201-38%2089l43%2058h413c37%200%2060-27%2060-61V407a220%20220%200%200%201-44%2040l21%2085-93%2039-45-76a258%20258%200%200%201-98%201l-45%2076-94-39%2022-85a298%20298%200%200%201-70-69l-86%2022-38-94%2076-45a258%20258%200%200%201-1-98l-76-45%2040-94%2085%2022a271%20271%200%200%201%2041-47z%22%2F%3E%3C%2Fsvg%3E';


export class App extends Component {

  constructor(props, context) {
    super();


    this.state = {
      tabs: [],
      activeTab: null
    };

    this.tabHistory = new History();

    this.tabRef = React.createRef();
  }

  createDiagram = (type = 'bpmn', options) => {
    const id = nextId();

    const name = `diagram_${id}.${type}`;

    const tab = {
      id,
      name,
      type
    };

    this.addTab(tab);

    this.showTab(tab);
  }

  /**
   * Add a tab to the tab list.
   */
  addTab(tab) {

    console.log('Add tab', tab.type);

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
  }


  /**
   * Show the tab.
   *
   * @param {Tab} tab
   */
  showTab = (tab) => {

    const {
      activeTab
    } = this.state;

    if (tab === activeTab) {
      return;
    }

    const tabHistory = this.tabHistory;

    tabHistory.push(tab);

    this.setActiveTab(tab);
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
    const fallbackTab = getNextTab(tabs, activeTab, direction);

    const tabHistory = this.tabHistory;

    const nextActiveTab = tabHistory.navigate(direction, fallbackTab);

    this.setActiveTab(nextActiveTab);
  }

  setActiveTab(tab) {

    const {
      activeTab
    } = this.state;

    if (activeTab === tab) {
      return;
    }

    if (tab !== EMPTY_TAB) {
      const navigationHistory = this.tabHistory;

      if (navigationHistory.get() !== tab) {
        navigationHistory.push(tab);
      }
    }

    this.setState({
      activeTab: tab,
      Tab: this.loadTab(tab)
    });
  }

  closeTab = (tab) => {

    const {
      activeTab,
      tabs
    } = this.state;

    const newTabs = tabs.filter(t => t !== tab);

    if (activeTab === tab) {

      // open previous tab, if it exists
      if (tabs.length > 1) {
        this.navigate(-1);
      } else {
        this.setActiveTab(EMPTY_TAB);
      }
    }

    this.tabHistory.purge(tab);

    this.setState({
      tabs: newTabs
    }, () => {
      this.props.cache.destroy(tab.id);
    });

  }

  selectTab = tab => {
    this.setActiveTab(tab);
  }

  showOpenDialog = () => {
    this.props.globals.dialog.openFile(null).then((files) => {
      this.openFiles(files);
    });
  }

  openFiles = (files) => {

    if (!files.length) {
      return;
    }

    const newTabs = files.map((f) => {

      return {
        name: f.name,
        content: f.contents,
        type: f.name.substring(f.name.lastIndexOf('.') + 1),
        id: nextId()
      };
    });

    newTabs.forEach((tab) => {
      this.addTab(tab);
    });

    this.selectTab(newTabs[newTabs.length - 1]);
  }

  /**
   * Mark the active tab as shown.
   */
  handleTabShown = () => {

    const {
      shownTabs,
      activeTab
    } = this.state;


    this.setState({
      shownTabs: {
        ...shownTabs,
        [activeTab.id]: true
      }
    });
  }

  updateTab = (tab, properties) => {
    console.log('%cApp#updateTab', 'color: #52B415');

    let { activeTab, tabs } = this.state;

    const updatedTabs = tabs.map((t) => {

      if (t.id === tab.id) {

        const newTab = {
          ...t,
          ...properties
        };

        this.tabHistory.replace(t, newTab);

        return newTab;
      } else {
        return t;
      }
    });

    const newActiveTab = (
      activeTab.id === tab.id ?
        updatedTabs.find(t => t.id === tab.id) :
        activeTab
    );

    this.setState({
      tabs: updatedTabs,
      activeTab: newActiveTab
    });
  }

  loadTab(tab) {

    const type = tab.type;

    if (tabLoaded[type]) {
      return tabLoaded[type];
    }

    var loader;

    if (type === 'bpmn') {
      loader = import('./tabs/bpmn');
    }

    if (type === 'dmn') {
      loader = import('./tabs/dmn');
    }

    if (!loader) {
      return missingProvider(type);
    }

    loader.then((c) => {

      var Tab = c.default;

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

    setTimeout(() => {
      this.createDiagram('bpmn');
      this.createDiagram('bpmn');
      this.createDiagram('bpmn');
      this.createDiagram('dmn');
      this.createDiagram('dmn');
      this.createDiagram('dmn');
      this.createDiagram('cmmn');
      this.createDiagram('bpmn');
    });

    this.props.onReady();
  }

  componentDidUpdate(prevProps, prevState) {

    const {
      activeTab
    } = this.state;

    // TODO: move this outside of app
    if (prevState.activeTab !== activeTab) {

      this.props.onToolStateChanged(activeTab, {
        closable: activeTab !== EMPTY_TAB
      });
    }
  }

  handleCreate = (type) => {
    this.createDiagram(type);
  }

  handleOpen = () => {
    this.showOpenDialog();
  }

  handleNavigate = (direction) => {
    this.navigate(direction);
  }

  saveAllTabs = () => {
    // TODO(nikku): implement
    console.error('NOT IMPLEMENTED');
  }

  closeTabs = (matcher) => {

    const {
      tabs
    } = this.state;

    const allTabs = tabs.slice();

    allTabs.filter(matcher).forEach((tab) => {
      console.log('CLOSING', tab);

      this.closeTab(tab);
    });
  }

  reopenLastTab = () => {
    // TODO(nikku): implement
    console.error('NOT IMPLEMENTED');
  }

  showShortcuts = () => {
    // TODO(nikku): implement
    console.error('NOT IMPLEMENTED');
  }

  triggerAction = (action, options) => {

    console.log('App#triggerAction %s %o', action, options);

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
      return this.createDiagram('dmn', { isTable: true });
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

    if (action === 'quit') {
      return this.quit();
    }

    if (action === 'close-all-tabs') {
      return this.closeTabs(t => true);
    }

    if (action === 'close-tab') {
      return this.closeTabs(t => t.id === options.tabId);
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

    console.log('trigger action', action, options);

    return tab.triggerAction(action, options);
  }

  quit() {
    return true;
  }

  composeAction = (...args) => (event) => {
    console.log(event, args);

    this.triggerAction(...args);
  }

  render() {
    const activeTab = this.state.activeTab || EMPTY_TAB;

    const { tabs } = this.state;

    const Tab = this.state.Tab || EmptyTab;

    console.log('%cApp#render', 'background: #52B415; color: white; padding: 2px 4px');

    return (
      <div className={ css.app }>

        <SlotFillRoot>

          <Toolbar />

          <Fill name="buttons" group="editor">
            <MultiButton>
              <Button onClick={ this.composeAction('selectElements') }>Select All</Button>
              <Button onClick={ this.composeAction('setColor', { fill: 'white', stroke: '#489d12' }) }>
                Set Color
              </Button>
            </MultiButton>
          </Fill>

          <Fill name="buttons" group="general">
            <Button onClick={ this.handleOpen }>
              Open file
            </Button>

            <MultiButton>
              <Button onClick={ () => this.handleNavigate(-1) }>&laquo;</Button>
              <Button onClick={ () => this.handleNavigate(1) }>&raquo;</Button>
            </MultiButton>

            <Button
              primary
              onClick={ () => this.handleCreate('bpmn') }
            >
              Create BPMN Tab
            </Button>

            <Button
              primary
              onClick={ () => this.handleCreate('dmn')  }
            >
              Create DMN Tab
            </Button>

            <Button
              primary
              onClick={ () => this.handleCreate('cmmn') }
            >
              Create CMMN Tab
            </Button>
          </Fill>

          <div className="tabs">
            <TabLinks
              className="primary"
              tabs={ tabs }
              activeTab={ activeTab }
              onSelect={ this.selectTab }
              onClose={ this.closeTab }
              onCreate={ this.createDiagram } />

            <TabContainer className="main">
              <Tab
                key={ activeTab.id }
                tab={ activeTab }
                onChanged={ this.updateTab }
                onShown={ this.handleTabShown }
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
      <Tab className="loader" key="loading">
        <img className={ classNames(css.logo, 'loading') } src={ LOGO_SRC } alt="bpmn.io logo" />
      </Tab>
    );
  }

}


function nextId() {
  tabId++;

  return tabId;
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