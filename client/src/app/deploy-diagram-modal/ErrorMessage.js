import React from 'react';

import css from './ErrorMessage.less';


const ErrorMessage = ({ message }) => (
  <div className={ css.ErrorMessage }>
    <strong>Error: </strong><span className={ css.ErrorContent }>{ message }</span>
  </div>
);

export default ErrorMessage;
