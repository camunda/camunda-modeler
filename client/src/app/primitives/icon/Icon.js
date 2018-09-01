import React from 'react';

import './Icon.less';


export default function Icon(props) {

  const {
    name
  } = props;

  return <span className={ `app-icon-${name}` }></span>;
}