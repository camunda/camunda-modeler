import React from 'react';

import style from './Button.less';

import classNames from 'classnames';

export default function MultiButton(props) {
  return (
    <div className={ classNames(style.MultiButton, props.className) }>
      { props.children }
    </div>
  );
}