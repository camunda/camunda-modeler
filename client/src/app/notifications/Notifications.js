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
import { createPortal } from 'react-dom';

import Notification from './Notification';

import css from './Notifications.less';


export default class Notifications extends PureComponent {
  constructor(props) {
    super(props);

    this.container = document.createElement('div');
  }

  componentDidMount() {
    document.body.appendChild(this.container);
  }

  componentWillUnmount() {
    document.body.removeChild(this.container);
  }

  render() {
    const notifications = this.props.notifications.map(({ id, ...props }) => {
      return <Notification key={ id } { ...props } />;
    }).reverse();

    return createPortal(<div className={ css.Notifications }>{ notifications }</div>, this.container);
  }
}
