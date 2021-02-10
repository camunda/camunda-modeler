/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent, createContext } from 'react';

export const KeyboardInteractionTrapContext = createContext(() => {});

/**
 * A wrapper around a react component that ensures that
 * default keyboard shortcuts are enabled on inputs:
 *
 * * SELECT_ALL
 * * COPY
 * * CUT
 * * PASTE
 *
 * This only works under the assumption that the child component
 * is a modal that user and keyboard focus.
 */
export default function KeyboardInteractionTrap(props) {
  return (
    <KeyboardInteractionTrapContext.Consumer>
      { triggerAction => (
        <KeyboardInteractionTrapComponent triggerAction={ triggerAction }>
          { props.children || null }
        </KeyboardInteractionTrapComponent>
      )}
    </KeyboardInteractionTrapContext.Consumer>
  );
}

class KeyboardInteractionTrapComponent extends PureComponent {

  handleFocus = (event) => {
    this.updateMenu(event.target);
  }

  updateMenu(element) {

    const enabled = ['INPUT', 'TEXTAREA'].includes(element.tagName);

    const editMenu = [
      [
        {
          role: 'undo',
          enabled
        },
        {
          role: 'redo',
          enabled
        },
      ],
      [
        {
          role: 'copy',
          enabled
        },
        {
          role: 'cut',
          enabled
        },
        {
          role: 'paste',
          enabled
        },
        {
          role: 'selectAll',
          enabled
        }
      ]
    ];

    this.props.triggerAction('update-menu', { editMenu });
  }

  componentDidMount() {
    window.addEventListener('focus', this.handleFocus);

    this.updateMenu(document.activeElement);
  }

  componentWillUnmount() {
    window.removeEventListener('focus', this.handleFocus);
  }

  render() {
    return this.props.children;
  }
}
