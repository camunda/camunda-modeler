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

import FeedbackIcon from 'icons/Feedback.svg';

import classNames from 'classnames';

import { Fill } from '../../app/slot-fill';
import { ReportFeedbackOverlay } from './ReportFeedbackOverlay';
import { ClipboardCopySystemInfo } from './ClipboardCopySystemInfo';

import * as css from './ReportFeedback.less';


export class ReportFeedback extends PureComponent {

  constructor(props) {
    super(props);

    this._buttonRef = React.createRef(null);

    this.state = {
      open: false,
      activeTab: undefined
    };
  }

  componentDidMount() {
    this._initCopySystemInfo();

    this.props.subscribe('reportFeedback.open', () => {
      if (this.state.open) {
        return;
      }

      this.setOpen(true);
    });

    this.props.subscribe('app.activeTabChanged', (tab) => {
      const { activeTab } = tab;
      this.setActiveTab(activeTab);
    });
  }

  componentDidUpdate(_, prevState) {
    if (prevState.activeTab !== this.state.activeTab) {
      this._initCopySystemInfo();
    }
  }

  _initCopySystemInfo() {
    this.clipboardCopySystemInfo = new ClipboardCopySystemInfo({
      getGlobal: this.props._getGlobal,
      activeTab: this.state.activeTab
    });
  }

  toggle = () => {
    this.setState(state => ({ ...state, open: !state.open }));
  };

  setOpen = value => {
    this.setState(state => ({ ...state, open: value }));
  };

  setActiveTab = tab => {
    this.setState(state => ({ ...state, activeTab: tab }));
  };

  copySystemInfo = config => {
    this.clipboardCopySystemInfo.clipboardCopy(config);
  };

  close = () => {
    this.setOpen(false);
  };

  render() {
    const {
      _buttonRef: buttonRef,
      close,
      copySystemInfo,
      state,
      toggle
    } = this;

    const { open } = state;

    return (
      <Fragment>
        <Fill slot="status-bar__app" group="9_feedback">
          <button
            className={ classNames('btn', { 'btn--active': open }, css.ReportFeedback) }
            title="Provide Feedback"
            onClick={ toggle }
            ref={ buttonRef }
          >
            <FeedbackIcon className="icon" />
          </button>
        </Fill>
        {
          open && <ReportFeedbackOverlay
            anchor={ buttonRef.current }
            onClose={ close }
            onSubmit={ copySystemInfo }
          />
        }
      </Fragment>
    );
  }
}
