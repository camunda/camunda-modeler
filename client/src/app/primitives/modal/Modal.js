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

import FocusTrap from './FocusTrap';
import EscapeTrap from './EscapeTrap';

import css from './Modal.less';


export default class Modal extends PureComponent {

  constructor(props) {
    super(props);

    this.modalRef = React.createRef();

    this.focusTrap = FocusTrap(() => {
      return this.modalRef.current;
    });

    this.escapeTrap = EscapeTrap(() => {
      this.close();
    });
  }

  close = () => {
    return this.props.onClose();
  }

  componentDidMount() {
    this.focusTrap.mount();
    this.escapeTrap.mount();
  }

  componentWillUnmount() {
    this.focusTrap.unmount();
    this.escapeTrap.unmount();
  }

  render() {

    const {
      className,
      children
    } = this.props;

    return ReactDOM.createPortal(
      <div className={ css.ModalOverlay } onClick={ this.handleBackgroundClick }>
        <div className={ classNames(css.ModalContainer, className) } ref={ this.modalRef }>
          { children }
        </div>
      </div>,
      document.body
    );
  }

  handleBackgroundClick = event => {
    if (event.target === event.currentTarget) {
      this.close();
    }
  };
}

Modal.defaultProps = {
  onClose: () => {}
};

Modal.Header = Header;

Modal.Body = Body;

Modal.Title = Title;

Modal.Close = Close;

Modal.Footer = Footer;


function Title(props) {

  return (
    <h2 className="modal-title">
      { props.children }
    </h2>
  );
}

function Close(props) {

  const {
    onClick
  } = props;

  return (
    <span className="close" onClick={ onClick }>
      ×
    </span>
  );
}

function Header(props) {

  return (
    <div className="modal-header">
      { props.children }
    </div>
  );
}

function Body(props) {
  return (
    <div className="modal-body">
      { props.children }
    </div>
  );
}

function Footer(props) {
  return (
    <div className="modal-footer">
      { props.children }
    </div>
  );
}
