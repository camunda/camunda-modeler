import React from 'react';

import css from './Button.less';

import classNames from 'classnames';

export default function MultiButton(props) {
  return (
    <div className={ classNames(css.MultiButton, props.className) }>
      { props.children }
    </div>
  );
}