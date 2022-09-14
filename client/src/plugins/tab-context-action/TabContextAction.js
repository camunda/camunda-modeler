/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { Fill } from '../../app/slot-fill';

import {
  OverlayDropdown
} from '../../shared/ui';

import TabContext from '../../../resources/icons/TabContext.svg';

const OVERLAY_OFFSET = { top: 0, right: 0 };
const OVERLAY_MIN_WIDTH = '160px';
const OVERLAY_MAX_WIDTH = '300px';
const SECTION_MAX_HEIGHT = 'calc(80vh - 150px)';

const overlayConfig = {
  offset: OVERLAY_OFFSET,
  minWidth: OVERLAY_MIN_WIDTH,
  maxWidth: OVERLAY_MAX_WIDTH
};


export class TabContextAction extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = { tabs: [] };

    this._buttonRef = React.createRef();
  }

  updateTabs = (context) => {
    const {
      tabs
    } = context;

    this.setState({
      tabs
    });
  };

  getActionOptions = () => {
    const {
      triggerAction
    } = this.props;

    const {
      tabs
    } = this.state;

    const options = {
      key: 'actions',
      items: [
        {
          text: 'Save all files',
          onClick: () => triggerAction('save-all')
        },
        {
          text: 'Close active tab',
          onClick: () => triggerAction('close-active-tab')
        }
      ]
    };

    if (tabs.length > 1) {
      options.items.push({
        text: 'Close all tabs',
        onClick: () => triggerAction('close-all-tabs')
      },
      {
        text: 'Close other tabs',
        onClick: () => triggerAction('close-other-tabs')
      });
    }

    return options;
  };

  getOpenedEditorsOptions = () => {
    const {
      getTabIcon,
      onSelect,
    } = this.props;

    const {
      tabs
    } = this.state;

    return {
      key: 'openedEditors',
      label: 'Opened editors',
      maxHeight: SECTION_MAX_HEIGHT,
      items: getOpenTabsList(tabs, onSelect, getTabIcon)
    };
  };

  componentDidMount() {
    const {
      subscribe
    } = this.props;

    subscribe('app.tabsChanged', this.updateTabs);
  }

  render() {
    const {
      tabs
    } = this.state;

    const options = [
      this.getActionOptions(),
      this.getOpenedEditorsOptions()
    ];

    return (
      <React.Fragment>
        {
          tabs.length ? (
            <OverlayDropdown
              className="btn--tab-action"
              items={ options }
              title="More actions ..."
              buttonRef={ this._buttonRef }
              overlayConfig={ overlayConfig }
            >
              <TabContext />
            </OverlayDropdown>
          ) : null
        }
      </React.Fragment>
    );
  }

}

export function TabContextActionPlugin(props) {
  const {
    subscribe,
    _getFromApp,
    ...restProps
  } = props;

  const getTabIcon = _getFromApp('_getTabIcon');
  const onSelect = _getFromApp('selectTab');

  return (
    <Fill slot="tab-actions" priority={ 1 }>
      <TabContextAction
        { ...restProps }
        getTabIcon={ getTabIcon }
        onSelect={ onSelect }
        subscribe={ subscribe } />
    </Fill>
  );
}


// helper ///////////////

function getOpenTabsList(tabs, onSelect, getTabIcon) {
  return tabs.map(tab => {
    const IconComponent = getTabIcon(tab);

    return {
      text: tab.name,
      icon: IconComponent,
      onClick: () => onSelect(tab)
    };
  });
}