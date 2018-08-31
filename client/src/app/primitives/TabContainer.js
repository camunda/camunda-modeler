import React from 'react';

import classNames from 'classnames';

import css from './Tabbed.less';


export default function TabContainer(props) {

  return (
    <div className={ classNames(css.TabContainer, props.className) }>
      { props.children }
    </div>
  );
}