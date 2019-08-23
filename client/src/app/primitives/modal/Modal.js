/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import classNames from 'classnames';

import css from './Modal.less';


const Modal = props => {
  const handleBackgroundClick = event => {
    if (event.target === event.currentTarget) {
      props.onClose();
    }
  };

  return (
    <div className={ css.ModalOverlay } onClick={ handleBackgroundClick }>
      <div className={ classNames(css.ModalContainer, props.className) }>
        { props.children }
      </div>
    </div>
  );
};

Modal.defaultProps = {
  onClose: () => {}
};

export default Modal;
