import React, { Component } from "react";

import styled, { injectGlobal } from 'styled-components';

import { CacheContext } from './cached';

import {
  Fill,
  SlotFillRoot
} from './slot-fill';

import { EventsContext } from './events';

import Buttons from "./Buttons";
import TabLinks from './TabLinks';
import EmptyTab from "./EmptyTab";

import { Button, MultiButton, Tab } from './primitives';

export const AppContext = React.createContext();

export function WithApp(Comp) {
  return (props) => {
    return (
      <AppContext.Consumer>
        {
          app => <Comp { ...props } app={ app } />
        }
      </AppContext.Consumer>
    );
  }
}

injectGlobal`
  * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
    
    html,
    body,
    #root {
      height: 100%;
    }

    body {
      margin: 10px;
      display: flex;
      flex-direction: column;
    }

    .bounce {
      -webkit-animation-name: bounce;
      animation-name: bounce;
      -webkit-transform-origin: center bottom;
      -ms-transform-origin: center bottom;
      transform-origin: center bottom;
      -webkit-animation-duration: 1s;
      animation-duration: 1s;
      -webkit-animation-fill-mode: both;
      animation-fill-mode: both;
    }
      
    @-webkit-keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        -webkit-transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
        -webkit-transform: translate3d(0,0,0);
        transform: translate3d(0,0,0);
      }
      
      40%, 43% {
        -webkit-transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        -webkit-transform: translate3d(0, -30px, 0);
        transform: translate3d(0, -30px, 0);
      }
      
      70% {
        -webkit-transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        -webkit-transform: translate3d(0, -15px, 0);
        transform: translate3d(0, -15px, 0);
      }
      
      90% {
        -webkit-transform: translate3d(0,-4px,0);
        transform: translate3d(0,-4px,0);
      }
    }
      
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        -webkit-transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
        -webkit-transform: translate3d(0,0,0);
        transform: translate3d(0,0,0);
      }
    
      40%, 43% {
        -webkit-transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        -webkit-transform: translate3d(0, -30px, 0);
        transform: translate3d(0, -30px, 0);
      }
    
      70% {
        -webkit-transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
        -webkit-transform: translate3d(0, -15px, 0);
        transform: translate3d(0, -15px, 0);
      }
      
      90% {
        -webkit-transform: translate3d(0,-4px,0);
        transform: translate3d(0,-4px,0);
      }
    } 
  }
`;

const Container = styled.div`
  height: 100%;
`;

let tabId = 0;

const tabLoaded = { };

const Logo = styled.img`
  width: 50px;
  animation-name: bounce;
  animation-duration: 1s;
`;

const logo = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20960%20960%22%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M960%2060v839c0%2033-27%2061-60%2061H60c-33%200-60-27-60-60V60C0%2027%2027%200%2060%200h839c34%200%2061%2027%2061%2060z%22%2F%3E%3Cpath%20fill%3D%22%23DDD%22%20d%3D%22M217%20548a205%20205%200%200%200-144%2058%20202%20202%200%200%200-4%20286%20202%20202%200%200%200%20285%203%20200%20200%200%200%200%2048-219%20203%20203%200%200%200-185-128zM752%206a206%20206%200%200%200-192%20285%20206%20206%200%200%200%20269%20111%20207%20207%200%200%200%20111-260A204%20204%200%200%200%20752%206zM62%200A62%2062%200%200%200%200%2062v398l60%2046a259%20259%200%200%201%2089-36c5-28%2010-57%2014-85l99%202%2012%2085a246%20246%200%200%201%2088%2038l70-52%2069%2071-52%2068c17%2030%2029%2058%2035%2090l86%2014-2%20100-86%2012a240%20240%200%200%201-38%2089l43%2058h413c37%200%2060-27%2060-61V407a220%20220%200%200%201-44%2040l21%2085-93%2039-45-76a258%20258%200%200%201-98%201l-45%2076-94-39%2022-85a298%20298%200%200%201-70-69l-86%2022-38-94%2076-45a258%20258%200%200%201-1-98l-76-45%2040-94%2085%2022a271%20271%200%200%201%2041-47z%22%2F%3E%3C%2Fsvg%3E';

function TabLoading() {
  return <Tab><Logo className="bounce" src={ logo } /></Tab>;
}

class App extends Component {

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

  closeTab = tab => {
    const tabs = this.state.tabs.filter(t => t !== tab);

    let activeTab;

    if (this.state.activeTab === tab) {

      if (tabs.length) {
        let index = Math.max(0, this.state.tabs.indexOf(tab) - 1);

        activeTab = this.state.tabs[index];
      } else {
        activeTab = this._emptyTab;
      }

    } else {
      activeTab = this.state.activeTab
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

  updateTab = (tab, properties) => {
    console.log('%cApp#updateTab', 'color: #52B415');
    let { activeTab, tabs } = this.state;

    // TODO: fix, comparison by reference won't work
    const index = tabs.indexOf(tab);

    const updatedTab = Object.assign(tab, properties);

    tabs.splice(index, 1, updatedTab);

    activeTab = tab === activeTab ? updatedTab : activeTab;

    this.setState({
      tabs,
      activeTab
    });
  }

  loadTab(tab) {

    const type = tab.type;

    if (tabLoaded[type]) {
      return tabLoaded[type];
    }

    var loader;

    if (type === 'bpmn') {
      loader = import('./tabs/BpmnTab');
    }

    if (type === 'dmn') {
      loader = import('./tabs/dmn');
    }

    if (type === 'xml') {
      loader = import('./tabs/xml');
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

    return TabLoading;
  }

  getNextTabId() {
    tabId++;

    return tabId;
  }

  render() {
    const activeTab = this.state.activeTab || this._emptyTab;

    const { tabs } = this.state;

    const Tab = this.state.Tab || EmptyTab;

    const { closeTab, createTab, selectTab, updateTab } = this;

    const app = {
      activeTab,
      tabs,
      closeTab,
      createTab,
      selectTab,
      updateTab
    };

    console.log('%cApp#render', 'background: #52B415; color: white; padding: 2px 4px');

    return (
      <Container className="app">
        <SlotFillRoot>
          <AppContext.Provider
            value={ app }
          >

            <Fill name="buttons">
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
              <Button
                primary
                className="primary"
                onClick={ () => {
                  this.createTab('bpmn', "bpmn");
                } }
              >
                Create BPMN Tab
              </Button>
              <Button
                primary
                className="primary"
                onClick={ () => {
                  this.createTab('dmn', "dmn");
                } }
              >
                Create DMN Tab
              </Button>
              <Button
                style={ { display: 'none' } }
                primary
                className="primary"
                onClick={ () => {
                  this.createTab('xml', "xml");
                } }
              >
                Create XML Tab
              </Button>
            </Fill>

            <Buttons />

            <TabLinks />

            <div className="tab">
              <Tab key={ activeTab.id } tab={ activeTab } />
            </div>
          </AppContext.Provider>
        </SlotFillRoot>
      </Container>
    );
  }
}

/**
 * Passes cache to wrapped component WITHOUT forwarding refs.
 *
 * @param {Component} Comp
 */
function WithCache(Comp) {
  return (props) => (
    <CacheContext.Consumer>
      {
        (cache) => <Comp { ...props } cache={ cache } />
      }
    </CacheContext.Consumer>
  );
}

export default WithCache(App);