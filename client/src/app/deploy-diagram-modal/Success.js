import React from 'react';

import css from './Success.less';


const Success = ({ message }) => (
  <div className={ css.Success }>
    <strong>Success: </strong><span className={ css.SuccessContent }>{ message }</span>
  </div>
);

export default Success;
