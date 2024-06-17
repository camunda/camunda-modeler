/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import { Fill } from '../../../slot-fill';

import * as css from './LogTab.less';

import CopyIcon from '../../../../../resources/icons/Copy.svg';
import DeleteIcon from '../../../../../resources/icons/Delete.svg';

export const KEYCODE_ESCAPE = 27;

export default class LogTab extends PureComponent {
  constructor(props) {
    super(props);

    this.focusRef = React.createRef();

    this.context = {};
  }

  checkFocus = () => {
    const panel = this.focusRef.current;

    const { entries } = this.props;

    const lastIdx = entries.length - 1;

    if (lastIdx !== -1) {
      const node = panel.querySelector(`*[data-idx='${ lastIdx }']`);

      node.scrollIntoView();
    }
  };

  componentDidUpdate = (prevProps) => {
    const {
      entries,
      layout
    } = this.props;

    if (layout.open && prevProps.entries !== entries) {
      this.checkFocus();
    }
  };

  handleKeyDown = (event) => {
    const { keyCode } = event;

    if (keyCode === KEYCODE_ESCAPE) {
      event.preventDefault();

      return this.handleToggle();
    }
  };

  handleCopy = () => {
    selectText(this.focusRef.current);

    document.execCommand('copy');
  };

  updateMenu = () => {
    const { onUpdateMenu } = this.props;

    const enabled = hasSelection();

    const editMenu = [
      [
        {
          role: 'undo',
          enabled: false
        },
        {
          role: 'redo',
          enabled: false
        },
      ],
      [
        {
          role: 'copy',
          enabled
        },
        {
          role: 'cut',
          enabled: false
        },
        {
          role: 'paste',
          enabled: false
        },
        {
          role: 'selectAll',
          enabled: true
        }
      ]
    ];

    onUpdateMenu({ editMenu });
  };

  render() {
    const {
      entries = [],
      onClear,
    } = this.props;

    return (
      <>
        <Fill slot="bottom-panel"
          id="log"
          label="Output"
          priority={ 20 }
          actions={
            [
              {
                onClick: this.handleCopy,
                icon: CopyIcon,
                title: 'Copy output'
              },
              {
                onClick: onClear,
                icon: DeleteIcon,
                title: 'Clear output'
              }
            ]
          }>
          <div
            className={ css.LogTab }
            ref={ this.focusRef }
            onKeyDown={ this.handleKeyDown }
            onFocus={ this.updateMenu }
          >
            {
              entries.map((entry, idx) => {
                const {
                  message,
                  action,
                  category
                } = entry;

                let msg;

                if (message) {
                  msg = message;
                } else {
                  msg = ' ';
                }

                return (
                  <div className="entry" key={ idx } data-idx={ idx }>
                    {
                      <span>
                        {
                          action
                            ? <a className="action" href="#" onClick={ action }>{ msg }</a>
                            : msg
                        }

                        { category && <span className="category"> [ { category } ]</span> }
                      </span>
                    }
                  </div>
                );
              })
            }
          </div>
        </Fill>
      </>
    );
  }
}


// helpers //////////

function hasSelection() {
  return window.getSelection().toString() !== '';
}

function selectText(element) {
  let range, selection;

  selection = window.getSelection();

  range = document.createRange();
  range.selectNodeContents(element);

  selection.removeAllRanges();
  selection.addRange(range);
}
