import React from 'react';

import classNames from 'classnames';

import {
  tabContainer
} from './Tabbed.less';


export default function TabContainer(props) {

  return (
    <div className={ classNames(tabContainer, props.className) }>
      { props.children }
    </div>
  );
}