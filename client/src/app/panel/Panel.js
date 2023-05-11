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
} from '../slot-fill';

import CloseIcon from '../../../resources/icons/Close.svg';

import css from './Panel.less';


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
  };

  render() {
    const {
      children,
      layout = {},
      onLayoutChanged
    } = this.props;

    const close = () => {
      const { panel = {} } = layout;

      onLayoutChanged({
        panel: {
          ...panel,
          open: false
        }
      });
    };

    return <div className={ css.Panel }>
      <div className="panel__header">
        <div className="panel__links">
          <Slot name="panel-link" />
        </div>
        <div className="panel__actions">
          <Slot name="panel-action" />
          <button key="close" className="panel__action" title="Close panel" onClick={ close }>
            <CloseIcon />
          </button>
        </div>
      </div>
      <div tabIndex="0" className="panel__body" onFocus={ this.updateMenu }>
        <div className="panel__inner">
          <Slot name="panel-body" />
        </div>
      </div>
      {
        children
      }
    </div>;
  }
}

Panel.Tab = Tab;

function Tab(props) {
  const {
    actions = null,
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

  return <>
    <Fill slot="panel-link" priority={ priority }>
      <button
        className={ classnames('panel__link', { 'panel__link--active': tab === id }) }
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
      actions && tab === id && <Fill slot="panel-action">
        {
          actions.map(action => {
            const Icon = action.icon;

            return <button key={ action.title } className="panel__action" title={ action.title } onClick={ action.onClick }>
              <Icon />
            </button>;
          })
        }
      </Fill>
    }
    {
      tab === id && (
        <Fill slot="panel-body">
          { children }
        </Fill>
      )
    }
  </>;
}


// helpers //////////

function hasSelection() {
  return window.getSelection().toString() !== '';
}
