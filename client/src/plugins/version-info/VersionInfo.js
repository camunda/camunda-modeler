/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, {
  Fragment,
  PureComponent
} from 'react';

import classNames from 'classnames';

import Flags, { DISPLAY_VERSION } from '../../util/Flags';

import { Fill } from '../../app/slot-fill';
import Metadata from '../../util/Metadata';
import { VersionInfoOverlay } from './VersionInfoOverlay';

import * as css from './VersionInfo.less';


const CONFIG_KEY = 'versionInfo';

export class VersionInfo extends PureComponent {

  constructor(props) {
    super(props);

    this._version = Flags.get(DISPLAY_VERSION) || Metadata.version;
    this._buttonRef = React.createRef(null);

    this.state = { open: false, unread: true };
  }

  componentDidMount() {
    this._subscription = this.props.subscribe('versionInfo.open', () => {
      if (this.state.open) {
        return;
      }

      this.open('menu');
    });

    this._checkIfUnread();
  }

  toggle = () => {
    if (this.state.open) {
      this.close();
    } else {
      this.open();
    }
  };

  open(source = 'statusBar') {
    this.setState({ open: true });

    this._onOpen(source);
  }

  close() {
    this.setState({ open: false });
  }

  _triggerEvent(event) {
    if (event.type === 'open') {
      this.props.triggerAction('emit-event', { type: 'versionInfo.opened', payload: event });
    }
  }

  async _checkIfUnread() {
    const config = await this.props.config.get(CONFIG_KEY);

    if (!config || !config.lastOpenedVersion || config.lastOpenedVersion !== this._version) {
      return;
    }

    this.setState({ unread: false });
  }

  async _onOpen(source) {
    this._triggerEvent({ type: 'open', source });

    if (!this.state.unread) {
      return;
    }

    const { config } = this.props;

    const oldConfig = await config.get(CONFIG_KEY);
    await config.set(CONFIG_KEY, { ...oldConfig, lastOpenedVersion: this._version });

    this.setState({ unread: false });
  }

  render() {
    const {
      open,
      unread
    } = this.state;

    const {
      _buttonRef: buttonRef,
      _version: version,
      toggle
    } = this;
    const close = () => this.close();

    return (
      <Fragment>
        <Fill slot="status-bar__app" group="9_version-info">
          <button
            className={ classNames('btn', { 'btn--active': open }) }
            title="Toggle version info"
            onClick={ toggle }
            ref={ buttonRef }
          >{ version } {unread && <UnreadMarker />}</button>
        </Fill>
        {
          open && <VersionInfoOverlay
            anchor={ buttonRef.current } onClose={ close } version={ version }
          />
        }
      </Fragment>
    );
  }
}

function UnreadMarker(props) {
  return (<span className={ css.UnreadMarker }>
    <svg
      aria-label="unread" role="img" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
    >
      <circle cx="50" cy="50" r="50" />
    </svg>
  </span>
  );
}
