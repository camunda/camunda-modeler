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

import { isString } from 'min-dash';

import classNames from 'classnames';

import {
  CloseTrap,
  EscapeTrap,
  FocusTrap,
  GlobalClickTrap,
  KeyboardInteractionTrap
} from '../trap';

import * as css from './Overlay.less';

const DEFAULT_OFFSET = {
  bottom: 1,
  left: 0
};

/**
 * @typedef {object} OverlayProps
 * @prop {Node} anchor
 * @prop {{ top?: number, bottom?: number, left?: number, right?: number }} [offset={}]
 * @prop {string | number} [maxHeight]
 * @prop {string | number} [maxWidth]
 * @prop {string | number} [minHeight]
 * @prop {string | number} [minWidth]
 * @prop {string} [className]
 * @prop {function} [onClose]
 * @prop {boolean} [enableFocusTrap=true] evaluated once at mount time
 * @prop {boolean} [enableEscapeTrap=true] evaluated once at mount time
 * @prop {boolean} [enableGlobalClickTrap=true] evaluated once at mount time
 * @prop {boolean} [enableCloseTrap=true] evaluated once at mount time
 * @prop {boolean} [enableKeyboardTrap=true]
 *
 * @extends {PureComponent<OverlayProps>}
 */
export class Overlay extends PureComponent {

  constructor(props) {
    super(props);

    this.overlayRef = React.createRef();

    const {
      enableFocusTrap = true,
      enableEscapeTrap = true,
      enableGlobalClickTrap = true,
      enableCloseTrap = true
    } = props;

    if (enableFocusTrap) {
      this.focusTrap = FocusTrap(() => this.overlayRef.current);
    }

    if (enableEscapeTrap) {
      this.escapeTrap = EscapeTrap(() => {
        this.close();
      });
    }

    if (enableGlobalClickTrap) {
      this.globalClickTrap = GlobalClickTrap(() => {
        return [ this.overlayRef.current, this.props.anchor ];
      }, this.close);
    }

    if (enableCloseTrap) {
      this.closeTrap = CloseTrap(document.activeElement);
    }
  }

  close = () => {
    if (this.props.onClose) {
      return this.props.onClose();
    }
  };

  componentDidMount() {
    this.focusTrap && this.focusTrap.mount();
    this.escapeTrap && this.escapeTrap.mount();
    this.globalClickTrap && this.globalClickTrap.mount();
    this.closeTrap && this.closeTrap.mount();
  }

  componentWillUnmount() {
    this.focusTrap && this.focusTrap.unmount();
    this.escapeTrap && this.escapeTrap.unmount();
    this.globalClickTrap && this.globalClickTrap.unmount();
    this.closeTrap && this.closeTrap.unmount();
  }

  getStyle() {

    const {
      maxHeight,
      maxWidth,
      minHeight,
      minWidth,
      anchor,
      offset = {}
    } = this.props;

    const bodyRect = document.body.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();

    let style = {
      position: 'absolute'
    };

    if (maxHeight) {
      style = {
        ...style,
        '--overlay-max-height': isString(maxHeight) ? maxHeight : `${maxHeight}px`
      };
    }

    if (maxWidth) {
      style = {
        ...style,
        '--overlay-max-width': isString(maxWidth) ? maxWidth : `${maxWidth}px`
      };
    }

    if (minHeight) {
      style = {
        ...style,
        '--overlay-min-height': isString(minHeight) ? minHeight : `${minHeight}px`
      };
    }

    if (minWidth) {
      style = {
        ...style,
        '--overlay-min-width': isString(minWidth) ? minWidth : `${minWidth}px`
      };
    }

    if ('top' in offset) {
      style = {
        ...style,
        top: Math.round(anchorRect.top + anchorRect.height + offset.top)
      };
    } else {
      style = {
        ...style,
        bottom: Math.round(bodyRect.height - anchorRect.top + (offset.bottom || DEFAULT_OFFSET.bottom))
      };
    }

    if ('right' in offset) {
      return {
        ...style,
        right: Math.round(bodyRect.width - anchorRect.right + offset.right)
      };
    }

    return {
      ...style,
      left: Math.round(anchorRect.left + (offset.left || DEFAULT_OFFSET.left))
    };
  }

  render() {
    const {
      anchor,
      className,
      children,
      id,
      enableKeyboardTrap = true
    } = this.props;

    if (!anchor) {
      throw new Error('Overlay must receive an `anchor` prop.');
    }

    const optionalId = id ? { id } : {};

    const style = this.getStyle();

    const Wrapper = enableKeyboardTrap ? KeyboardInteractionTrap : React.Fragment;

    return ReactDOM.createPortal(
      <Wrapper>
        <div
          className={ classNames(css.Overlay, className) } style={ style } { ...optionalId }
          ref={ this.overlayRef } role="dialog"
        >
          { children }
        </div>
      </Wrapper>,
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
