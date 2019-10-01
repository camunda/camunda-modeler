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

import css from './Notification.less';

export const NOTIFICATION_TYPES = [ 'info', 'success', 'error', 'warning' ];

export default class Notification extends PureComponent {
  static getDerivedStateFromError() {
    return { error: true };
  }

  state = {
    error: false
  }

  componentDidMount() {
    const { duration } = this.props;

    if (duration) {
      this.setupTimeout(duration);
    }
  }

  componentDidUpdate(previousProps) {
    const currentDuration = this.props.duration;

    const { duration: previousDuration } = previousProps;

    if (currentDuration !== previousDuration) {
      this.resetTimeout();

      currentDuration && this.setupTimeout(currentDuration);
    }
  }

  componentWillUnmount() {
    this.resetTimeout();
  }

  setupTimeout(duration) {
    this.timeout = setTimeout(() => {
      this.props.close();
    }, duration);
  }

  resetTimeout() {
    this.timeout && clearTimeout(this.timeout);
  }

  componentDidCatch() {
    this.props.close();
  }

  render() {
    const {
      close,
      content,
      title,
      type
    } = this.props;

    return this.state.error ? null : <div className={ classnames(css.Notification, type) }>
      <span className="close" onClick={ close } />
      <h2>
        { title }
      </h2>
      { content && <div className="content">{ content }</div> }
    </div>;
  }
}
