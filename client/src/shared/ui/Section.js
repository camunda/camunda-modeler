/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { isString } from 'min-dash';

import React from 'react';

import classNames from 'classnames';

import * as css from './Section.less';

export function Section(props) {

  const {
    children,
    className,
    maxHeight,
    relativePos
  } = props;

  let style = {};

  if (maxHeight) {

    if (maxHeight === true) {
      style = {
        'overflow-y': 'hidden'
      };
    } else {
      style = {
        '--section-max-height': isString(maxHeight) ? maxHeight : `${maxHeight}px`
      };
    }
  }

  if (relativePos) {
    style = {
      'position': 'relative',
      ...style
    };
  }

  return (
    <section
      className={ classNames(css.Section, 'section', {
        [ className ]: className
      }) }
      style={ style }
    >
      { children }
    </section>
  );
}


Section.Header = function Header(props) {
  return (
    <h3 className="section__header">
      { props.children }
    </h3>
  );
};

Section.Actions = function Actions(props) {
  return (
    <span className="section__actions">{ props.children }</span>
  );
};

Section.Body = function Body(props) {
  return (
    <div className="section__body">
      { props.children }
    </div>
  );
};
