/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import classnames from 'classnames';

import { isDefined } from 'min-dash';

import {
  Fill,
  Slot
} from '../../slot-fill';

import ResizableContainer from '../ResizableContainer';

import css from './Panel.less';

export const MIN_HEIGHT = 100;

export const DEFAULT_LAYOUT = {
  open: false,
  height: MIN_HEIGHT
};


export default class Panel extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: null
    };
  }

  updateMenu = () => {
    const { onUpdateMenu } = this.props;

    const enabled = hasSelection();

    const editMenu = [
      [
        {
          role: 'undo',
          enabled: false
        },
        {
          role: 'redo',
          enabled: false
        },
      ],
      [
        {
          role: 'copy',
          enabled
        },
        {
          role: 'cut',
          enabled: false
        },
        {
          role: 'paste',
          enabled: false
        },
        {
          role: 'selectAll',
          enabled: false
        }
      ]
    ];

    onUpdateMenu({ editMenu });
  }

  handleResizeContainer = (newLayout) => {
    const {
      layout = {},
      onLayoutChanged
    } = this.props;

    const panel = layout.panel || {};
    const newPanel = newLayout.panel || {};

    onLayoutChanged({
      panel: {
        ...panel,
        ...newPanel
      }
    });
  }

  render() {
    const {
      children,
      layout,
    } = this.props;

    const { panel = {} } = layout;

    return (
      <ResizableContainer
        className={ css.Panel }
        defaultLayout={ DEFAULT_LAYOUT }
        layout={ layout }
        layoutProp="panel"
        minHeight={ MIN_HEIGHT }
        onLayoutChanged={ this.handleResizeContainer }
        position="bottom"
      >
        <div className="panel__container">
          <div className={ classnames('panel__links', { open: panel.open }) }>
            <Slot name="panel-link" />
          </div>
          <div tabIndex="0" className="panel__body" onFocus={ this.updateMenu }>
            <div className="panel__inner">
              <Slot name="panel-body" />
            </div>
          </div>
          {
            children
          }
        </div>
      </ResizableContainer>
    );
  }
}

Panel.Tab = Tab;

function Tab(props) {
  const {
    children,
    id,
    label,
    layout = {},
    number,
    onLayoutChanged,
    priority
  } = props;

  const { panel = {} } = layout;

  const { tab } = panel;

  const onClick = () => {
    onLayoutChanged({
      panel: {
        ...panel,
        tab: id
      }
    });
  };

  return <div>
    <Fill slot="panel-link" priority={ priority }>
      <button
        className={ classnames('panel__link', { 'panel__link--active': panel.tab === id }) }
        onClick={ onClick }>
        <span className="panel__link-label">
          { label }
        </span>
        {
          isDefined(number)
            ? <span className="panel__link-number">{ number }</span>
            : null
        }
      </button>
    </Fill>
    {
      tab === id && (
        <Fill slot="panel-body">
          { children }
        </Fill>
      )
    }
  </div>;
}


// helpers //////////

function hasSelection() {
  return window.getSelection().toString() !== '';
}