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

import { isString } from 'min-dash';

import { Toaster, toast } from '@camunda/design-system';

import * as css from './Notifications.css';

export const NOTIFICATION_TYPES = [ 'info', 'success', 'error', 'warning' ];


/**
 * Shows the notifications held in app state as design system toasts.
 *
 * The design system `toast()` cannot update a toast in place, so a changed
 * notification is dismissed and shown again.
 */
export default class Notifications extends PureComponent {
  shown = new Map();

  componentDidMount() {
    this.sync();
  }

  componentDidUpdate() {
    this.sync();
  }

  componentWillUnmount() {
    this.shown.forEach(hide);
  }

  sync() {
    const { notifications } = this.props;

    const ids = notifications.map(({ id }) => id);

    this.shown.forEach((shown, id) => {
      if (!ids.includes(id)) {
        hide(shown);
        this.shown.delete(id);
      }
    });

    notifications.forEach(notification => {
      const shown = this.shown.get(notification.id);

      if (shown && shown.notification === notification) {
        return;
      }

      if (shown) {
        hide(shown);
      }

      this.shown.set(notification.id, show(notification));
    });
  }

  render() {
    return (
      <div className={ css.Notifications }>
        <Toaster position="bottom-left" />
      </div>
    );
  }
}


// helpers //////////

function show(notification) {
  const shown = { notification, hidden: false };

  // a toast dismissed by `hide` must not close the notification that replaced it
  const close = () => {
    if (!shown.hidden) {
      notification.close();
    }
  };

  shown.toastId = showToast(notification, close);

  return shown;
}

function hide(shown) {
  shown.hidden = true;

  toast.dismiss(shown.toastId);
}

function showToast({ type, title, content, duration }, close) {
  const options = {
    duration: duration || Infinity,
    onAutoClose: close,
    onDismiss: close
  };

  // a plain button becomes the toast action and closes the notification
  if (content && content.type === 'button' && isString(content.props.children)) {
    options.action = {
      label: content.props.children,
      onClick: () => {
        content.props.onClick();
        close();
      }
    };
  } else if (content) {
    options.description = <NotificationContent content={ content } close={ close } />;
  }

  return toast[ type ](title, options);
}

class NotificationContent extends PureComponent {
  state = {
    error: false
  };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch() {
    this.props.close();
  }

  render() {
    return this.state.error ? null : this.props.content;
  }
}
