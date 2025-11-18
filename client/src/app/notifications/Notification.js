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

import * as css from './Notification.less';

import CloseIcon from '../../../resources/icons/notifications/Close.svg';
import InfoIcon from '../../../resources/icons/notifications/Info.svg';
import SuccessIcon from '../../../resources/icons/notifications/Success.svg';
import WarningIcon from '../../../resources/icons/notifications/Warning.svg';
import ErrorIcon from '../../../resources/icons/notifications/Error.svg';

export const NOTIFICATION_TYPES = [ 'info', 'success', 'error', 'warning' ];

export default class Notification extends PureComponent {
  static getDerivedStateFromError() {
    return { error: true };
  }

  state = {
    error: false
  };

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

  getContent() {
    const {
      content,
      close
    } = this.props;

    // allow button to close notification
    if (content && content.type === 'button') {
      const onClick = ()=> {
        content.props.onClick();
        close();
      };

      return React.cloneElement(
        content,
        { onClick }
      );
    }

    return content;
  }

  render() {
    const {
      close,
      content,
      title,
      type
    } = this.props;

    return this.state.error ? null :
      (
        <div
          role={ type === 'error' ? 'alert' : 'status' }
          className={ classnames(css.Notification, type) }
          onMouseOver={ ()=> {this.resetTimeout(); } }
          onMouseOut={ ()=> {this.setupTimeout(this.props.duration);} }>

          <div>
            {getIconByType(type)}
            <h3>
              { title }
            </h3>
            <CloseIcon onClick={ close } className="close" />
          </div>
          <div>
            { content && <div className="content">{ this.getContent() }</div> }
          </div>
        </div>
      );
  }
}


// helpers

function getIconByType(type) {
  switch (type) {
  case 'info':
    return <InfoIcon />;
  case 'warning':
    return <WarningIcon />;
  case 'success':
    return <SuccessIcon />;
  case 'error':
    return <ErrorIcon />;
  }
}
