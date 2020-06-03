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
import KeyboardInteractionTrap from './KeyboardInteractionTrap';

import CloseIcon from '../../../../resources/icons/Close.svg';


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
    if (this.props.onClose) {
      return this.props.onClose();
    }
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
      children,
      onClose
    } = this.props;

    return ReactDOM.createPortal(
      <KeyboardInteractionTrap>
        <div className="modal" tabIndex="-1" role="dialog">
          <div className={ classNames('modal-dialog', className) } ref={ this.modalRef } role="document">
            <div className="modal-content">
              { children }
              { onClose && (<Close onClick={ this.close } />) }
            </div>
          </div>
        </div>
      </KeyboardInteractionTrap>,
      document.body
    );
  }
}

Modal.Body = Body;

Modal.Title = Title;

Modal.Close = Close;

Modal.Footer = Footer;


function Title(props) {

  return (
    <div className="modal-header">
      <h2 className="modal-title">
        { props.children }
      </h2>
    </div>
  );
}

function Close(props) {

  const {
    onClick
  } = props;

  return (
    <button className="close" onClick={ onClick } aria-label="Close">
      <CloseIcon aria-hidden="true" />
    </button>
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
