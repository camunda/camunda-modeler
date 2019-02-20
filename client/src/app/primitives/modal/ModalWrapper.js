/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import classNames from 'classnames';

import css from './ModalWrapper.less';


const ModalWrapper = props => {
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

ModalWrapper.defaultProps = {
  onClose: () => {}
};

export default ModalWrapper;
