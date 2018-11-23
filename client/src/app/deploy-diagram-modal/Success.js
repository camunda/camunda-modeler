import React from 'react';

import css from './Success.less';


const Success = ({ heading, message }) => (
  <div className={ css.Success }>
    <p>
      <strong>{ heading }</strong>
    </p>
    <p>
      <span className={ css.SuccessContent }>{ message }</span>
    </p>
  </div>
);

export default Success;
