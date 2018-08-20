import React, { Component } from 'react';

import { CacheContext } from './cached';

import {
  Fill,
  SlotFillRoot
} from './slot-fill';

import classNames from 'classnames';

import { EventsContext } from './events';

import Toolbar from './Toolbar';
import EmptyTab from './EmptyTab';

import {
  Button,
  MultiButton,
  TabLinks,
  TabContainer,
  Tab
} from './primitives';

import AppBackendBridge from './AppBackendBridge';

import css from './App.less';

let tabId = 0;

const tabLoaded = {
  empty: EmptyTab
};


const LOGO_SRC = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20960%20960%22%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M960%2060v839c0%2033-27%2061-60%2061H60c-33%200-60-27-60-60V60C0%2027%2027%200%2060%200h839c34%200%2061%2027%2061%2060z%22%2F%3E%3Cpath%20fill%3D%22%23DDD%22%20d%3D%22M217%20548a205%20205%200%200%200-144%2058%20202%20202%200%200%200-4%20286%20202%20202%200%200%200%20285%203%20200%20200%200%200%200%2048-219%20203%20203%200%200%200-185-128zM752%206a206%20206%200%200%200-192%20285%20206%20206%200%200%200%20269%20111%20207%20207%200%200%200%20111-260A204%20204%200%200%200%20752%206zM62%200A62%2062%200%200%200%200%2062v398l60%2046a259%20259%200%200%201%2089-36c5-28%2010-57%2014-85l99%202%2012%2085a246%20246%200%200%201%2088%2038l70-52%2069%2071-52%2068c17%2030%2029%2058%2035%2090l86%2014-2%20100-86%2012a240%20240%200%200%201-38%2089l43%2058h413c37%200%2060-27%2060-61V407a220%20220%200%200%201-44%2040l21%2085-93%2039-45-76a258%20258%200%200%201-98%201l-45%2076-94-39%2022-85a298%20298%200%200%201-70-69l-86%2022-38-94%2076-45a258%20258%200%200%201-1-98l-76-45%2040-94%2085%2022a271%20271%200%200%201%2041-47z%22%2F%3E%3C%2Fsvg%3E';


export class App extends Component {

  constructor(props, context) {
    super();

    this._emptyTab = {
      type: 'empty',
      id: '__empty'
    };

    const initialTab = {
      type: 'bpmn',
      content: null,
      id: 'diagram_0',
      name: 'diagram_0.bpmn'
    };

    this.state = {
      tabs: [
        initialTab
      ],
      activeTab: initialTab,
      Tab: this.loadTab(initialTab)
    };
  }

  createTab = (type, fileExtension) => {
    const id = this.getNextTabId();

    const name = `diagram_${id}.${fileExtension}`;

    const tab = {
      type,
      name,
      content: null,
      id
    };

    this.setState({
      tabs: [...this.state.tabs, tab],
      activeTab: tab,
      Tab: this.loadTab(tab)
    });
  }

  closeTab = (tab) => {

    const tabs = this.state.tabs.filter(t => t !== tab);

    let activeTab;

    if (this.state.activeTab === tab) {

      if (tabs.length) {
        let index = Math.max(0, tabs.indexOf(tab) - 1);

        activeTab = tabs[index];
      } else {
        activeTab = this._emptyTab;
      }

    } else {
      activeTab = this.state.activeTab;
    }

    this.setState({
      tabs: tabs,
      activeTab: activeTab,
      Tab: this.loadTab(activeTab)
    }, () => {
      this.props.cache.destroy(tab.id);
    });
  }

  selectTab = tab => {
    if (tab === this.state.activeTab) {
      return;
    }

    this.setState({
      activeTab: tab,
      Tab: this.loadTab(tab)
    });
  }

  showOpenDialog = () => {
    this.props.globals.dialog.openFile(null).then((files) => {
      this.openFiles(files);
    });
  }

  openFiles = (files) => {

    const newTabs = files.map((f) => {

      return {
        name: f.name,
        content: f.contents,
        type: f.name.substring(f.name.lastIndexOf('.') + 1),
        id: this.getNextTabId()
      };
    });

    const newActiveTab = newTabs[newTabs.length - 1] || this.state.activeTab;

    this.setState({
      tabs: [
        ...this.state.tabs,
        ...newTabs
      ],
      activeTab: newActiveTab,
      Tab: this.loadTab(newActiveTab)
    });
  }

  updateTab = (tab, properties) => {
    console.log('%cApp#updateTab', 'color: #52B415');

    let { activeTab, tabs } = this.state;

    const updatedTabs = tabs.map((t) => {

      if (t.id === tab.id) {
        return {
          ...t,
          ...properties
        };
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
      loader = Promise.resolve({
        default: missingProvider(type)
      });
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

  getNextTabId() {
    tabId++;

    return tabId;
  }

  componentDidMount() {
    this.props.globals.eventBus.emit('app:ready');
  }

  render() {
    const activeTab = this.state.activeTab || this._emptyTab;

    const { tabs } = this.state;

    const Tab = this.state.Tab || EmptyTab;

    const {
      closeTab,
      createTab,
      showOpenDialog,
      selectTab,
      updateTab
    } = this;

    console.log('%cApp#render', 'background: #52B415; color: white; padding: 2px 4px');

    return (
      <div className={ css.app }>
        <AppBackendBridge
          app={ this }
          backend={ this.props.globals.backend }
        />

        <SlotFillRoot>

          <Toolbar />

          <Fill name="buttons" group="editor">
            <EventsContext.Consumer>
              { events => {
                return (
                  <MultiButton>
                    <Button onClick={ () => {
                      events.fire('triggerEditorAction', { editorAction: 'selectElements' });
                    } }>Select All</Button>
                    <Button onClick={ () => {
                      events.fire('setColor', { fill: 'white', stroke: '#489d12' });
                    } }>Set Color</Button>
                  </MultiButton>
                );
              } }
            </EventsContext.Consumer>
          </Fill>

          <Fill name="buttons" group="general">
            <Button onClick={ showOpenDialog }>
              Open file
            </Button>

            <Button
              primary
              onClick={ () => {
                createTab('bpmn', 'bpmn');
              } }
            >
              Create BPMN Tab
            </Button>

            <Button
              primary
              onClick={ () => {
                createTab('dmn', 'dmn');
              } }
            >
              Create DMN Tab
            </Button>

            <Button
              primary
              onClick={ () => {
                createTab('cmmn', 'cmmn');
              } }
            >
              Create CMMN Tab
            </Button>
          </Fill>

          <div className="tabs">
            <TabLinks
              className="primary"
              tabs={ tabs }
              activeTab={ activeTab }
              onSelect={ selectTab }
              onClose={ closeTab }
              onCreate={ () => {
                createTab('bpmn', 'bpmn');
              } } />

            <TabContainer className="main">
              <Tab
                key={ activeTab.id }
                tab={ activeTab }
                onChanged={ updateTab }
              />
            </TabContainer>
          </div>
        </SlotFillRoot>
      </div>
    );
  }
}


function missingProvider(type) {
  return function MissingProviderTab(props) {
    return (
      <Tab>
        <span>Cannot open tab: no provider for { type }.</span>
      </Tab>
    );
  };
}

function LoadingTab() {
  return (
    <Tab className="loader">
      <img className={ classNames(css.logo, 'loading') } src={ LOGO_SRC } alt="bpmn.io logo" />
    </Tab>
  );
}


/**
 * Passes cache to wrapped component WITHOUT forwarding refs.
 *
 * @param {Component} Comp
 */
function WithCache(Comp) {
  return class AppWithCache extends Component {
    render() {
      return (
        <CacheContext.Consumer>
          {
            (cache) => <Comp { ...this.props } cache={ cache } />
          }
        </CacheContext.Consumer>
      );
    }
  };
}

export default WithCache(App);