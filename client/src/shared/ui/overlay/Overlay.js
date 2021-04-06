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
import ReactDOM from 'react-dom';

import classNames from 'classnames';

import FocusTrap from '../modal/FocusTrap';
import EscapeTrap from '../modal/EscapeTrap';
import KeyboardInteractionTrap from '../modal/KeyboardInteractionTrap';
import GlobalClickListener from './GlobalClickListener';

import css from './Overlay.less';

const DEFAULT_OFFSET = {
  bottom: -1,
  left: 0
};


export class Overlay extends PureComponent {

  constructor(props) {
    super(props);

    this.overlayRef = React.createRef();

    this.focusTrap = FocusTrap(() => this.overlayRef.current);

    this.escapeTrap = EscapeTrap(() => {
      this.close();
    });

    this.globalClickTrap = GlobalClickListener(() => {
      return [ this.overlayRef.current, this.props.anchor ];
    }, this.close);
  }

  close = () => {
    if (this.props.onClose) {
      return this.props.onClose();
    }
  }

  componentDidMount() {
    this.focusTrap.mount();
    this.escapeTrap.mount();
    this.globalClickTrap.mount();
  }

  componentWillUnmount() {
    this.focusTrap.unmount();
    this.escapeTrap.unmount();
    this.globalClickTrap.unmount();
  }

  getStyle() {
    const { anchor, offset = {} } = this.props;
    const bodyRect = document.body.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();

    return {
      position: 'absolute',
      bottom: Math.round(bodyRect.height - anchorRect.top + (offset.bottom || DEFAULT_OFFSET.bottom)),
      left: Math.round(anchorRect.left + (offset.left || DEFAULT_OFFSET.left))
    };
  }

  render() {
    const {
      className,
      children
    } = this.props;

    const style = this.getStyle();

    return ReactDOM.createPortal(
      <KeyboardInteractionTrap>
        <div
          className={ classNames(css.Overlay, className) } style={ style }
          ref={ this.overlayRef } role="dialog"
        >
          { children }
        </div>
      </KeyboardInteractionTrap>,
      document.body
    );
  }
}

Overlay.Body = Body;

Overlay.Title = Title;

Overlay.Footer = Footer;


function Title(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <div className={ classNames('overlay__header', className) } { ...rest }>
      <h1 className="overlay__title">
        { children }
      </h1>
    </div>
  );
}

function Body(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <div className={ classNames('overlay__body', className) } { ...rest }>
      { children }
    </div>
  );
}

function Footer(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <div className={ classNames('overlay__footer', className) } { ...rest }>
      { props.children }
    </div>
  );
}
