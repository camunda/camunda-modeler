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
    id,
    children,
    className,
    maxHeight,
    relativePos
  } = props;

  let style = {};

  if (maxHeight) {

    if (maxHeight === true) {
      style = {
        'overflowY': 'hidden'
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
      id={ id }
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
  const { className } = props;

  return (
    <h3 className={ classNames('section__header', {
      [ className ]: className
    }) }>
      { props.children }
    </h3>
  );
};

Section.Actions = function Actions(props) {
  const { className } = props;
  return (
    <span className={ classNames('section__actions', {
      [ className ]: className
    }) }>{ props.children }</span>
  );
};

Section.Body = function Body(props) {
  const { className } = props;

  return (
    <div className={ classNames('section__body', {
      [ className ]: className
    }) }>
      { props.children }
    </div>
  );
};
