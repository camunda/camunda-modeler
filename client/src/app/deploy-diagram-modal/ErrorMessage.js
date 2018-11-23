import React from 'react';

import css from './ErrorMessage.less';


const ErrorMessage = ({ heading, message }) => (
  <div className={ css.ErrorMessage }>
    <p>
      <strong>{ heading }</strong>
    </p>
    <p>
      <span className={ css.ErrorContent }>{ message }</span>
    </p>
  </div>
);

export default ErrorMessage;
