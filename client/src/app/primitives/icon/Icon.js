import React from 'react';

import classnames from 'classnames';

import './Icon.less';


export default function Icon(props) {

  const {
    className,
    name
  } = props;

  return <span className={ classnames(`app-icon-${name}`, className) }></span>;
}