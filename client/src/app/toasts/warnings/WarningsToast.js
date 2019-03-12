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

import css from './WarningsToast.less';

import {
  ToastContainer
} from '../../primitives';

class WarningsToast extends PureComponent {

  render() {

    const {
      onClose,
      warnings
    } = this.props;

    return (
      <ToastContainer onClose={ onClose } className={ css.WarningsToast } type="alert">
          Imported with { warningsString(warnings) }. See further information inside the Log. &nbsp;

        <span className='close-warnings' onClick={ onClose }></span>
      </ToastContainer>);
  }
}

export default WarningsToast;

// helpers //////////

function warningsString(warnings) {
  var count = (warnings || []).length;

  return count + ' warning' + (count !== 1 ? 's' : '');
}
