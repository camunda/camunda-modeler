import React from 'react';

import styled, { css } from 'styled-components';

import { WithApp } from '../App';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../cached';

import { Tab } from '../primitives';

const Container = styled.div`
  height: 100%;
  width: 100%;
`;

const ActiveEditor = styled.div`
  height: 100%;
`;

const SecondaryTabLinks = styled.ul`
  flex: initial;
`;

const SecondaryTabLink = styled.li`
  position: relative;
  margin-top: -1.5px;
  display: inline-block;
  min-width: 30px;
  margin-right: 5px;
  padding: 5px;
  text-align: center;
  border-bottom: solid 1px #ddd;
  border-right: solid 1px #ddd;
  border-left: solid 1px #ddd;
  border-radius: 0 0 2px 2px;
  background: #F6F6F6;
  cursor: default;

  &:hover {
    background: #fff;
    z-index: 2;
  }

  ${props => props.active && css`
    background: #fff;
    z-index: 2;
  `}
`;

class MultiEditorTab extends CachedComponent {

  constructor(props) {
    super(props);

    this.editorRef = React.createRef();
  }

  secondaryTabsChanged = (type, newSecondaryTabs, newActiveSecondaryTab) => {
    let { activeSecondaryTab, secondaryTabs } = this.getCached();

    if (!secondaryTabs) {
      secondaryTabs = [];
    }

    const {
      editors
    } = this.props;

    // assign editor based on type
    newSecondaryTabs = newSecondaryTabs.map(newSecondaryTab => {
      const { editor } = editors.find(e => e.type = newSecondaryTab.type);

      return Object.assign(newSecondaryTab, { editor });
    });

    secondaryTabs = secondaryTabs
      .filter(secondaryTab => secondaryTab.type !== type)
      .concat(newSecondaryTabs)
      .map(t => Object.assign(t, { order: t.order || 0 }))
      .sort((a, b) => a.order > b.order);

    if (newActiveSecondaryTab) {
      activeSecondaryTab = newActiveSecondaryTab;
    }

    this.setCached({
      secondaryTabs,
      activeSecondaryTab
    });
  }

  dirtyChanged = (dirty) => {
    const { app, tab, xml } = this.props;

    const { lastXML } = this.getCached();

    app.updateTab(tab, { dirty: dirty || (lastXML ? (xml !== lastXML) : false) });
  }

  switchSecondaryTab = (secondaryTab) => {
    return () => {
      this.editorRef.current.getXML((xml) => {
        this.setCached({
          activeSecondaryTab: secondaryTab,
          lastXML: xml
        });
      });

    };
  }

  getDefaultSecondaryTabs = () => {
    const {
      editors
    } = this.props;

    return editors.map(({ defaultName, editor, type }) => {
      return {
        editor,
        id: type,
        isDefault: true,
        name: defaultName,
        type
      };
    });
  }

  componentDidMount() {
    const {
      setCachedState
    } = this.props;

    let {
      secondaryTabs
    } = this.getCached();

    if (!secondaryTabs) {
      secondaryTabs = this.getDefaultSecondaryTabs();

      setCachedState({
        secondaryTabs,
        activeSecondaryTab: secondaryTabs[0]
      });
    }

  }

  render() {

    let {
      activeSecondaryTab,
      secondaryTabs,
      lastXML
    } = this.getCached();

    let {
      id,
      xml
    } = this.props;

    if (!secondaryTabs) {
      secondaryTabs = this.getDefaultSecondaryTabs();
    }

    if (!activeSecondaryTab) {
      activeSecondaryTab = secondaryTabs[0];
    }

    const Editor = activeSecondaryTab.editor;

    console.log('%cMultiEditorTab#render', 'background: #52B415; color: white; padding: 2px 4px');

    return (
      <div>
        <Container>

          <Tab>
            <ActiveEditor>
              <Editor
                ref={ this.editorRef }
                id={ `${id}-${activeSecondaryTab.type}` }
                xml={ lastXML || xml }
                secondaryTab={ activeSecondaryTab }
                secondaryTabsChanged={ this.secondaryTabsChanged }
                dirtyChanged={ this.dirtyChanged } />
            </ActiveEditor>
          </Tab>

          <SecondaryTabLinks>
            { secondaryTabs.map((secondaryTab) => {
              return (
                <SecondaryTabLink
                  key={ secondaryTab.id }
                  active={ activeSecondaryTab === secondaryTab }
                  onClick={ this.switchSecondaryTab(secondaryTab) }
                >
                  { secondaryTab.name }
                </SecondaryTabLink>
              );
            }) }
          </SecondaryTabLinks>
        </Container>

      </div>
    );
  }

}


export default WithCache(WithCachedState(WithApp(MultiEditorTab)));