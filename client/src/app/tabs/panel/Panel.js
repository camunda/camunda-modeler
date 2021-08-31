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

import css from './Panel.less';


export default class Panel extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: null
    };
  }

  render() {
    const {
      children,
      layout = {}
    } = this.props;

    const { panel = {} } = layout;

    const { open } = panel;

    if (!open) {
      return null;
    }

    return <div className={ classnames(css.Panel, { open }) }>
      <div className="panel__links">
        <Slot name="panel-link" />
      </div>
      <div className="panel__body">
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