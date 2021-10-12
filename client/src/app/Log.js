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

import css from './Log.less';

import classNames from 'classnames';

import { isFunction } from 'min-dash';

import { Fill } from './slot-fill';

import dragger from '../util/dom/dragger';

import {
  throttle
} from '../util';

export const DEFAULT_LAYOUT = {
  height: 130,
  open: false
};

export const MIN_HEIGHT = 25;
export const MAX_HEIGHT = 300;

export const KEYCODE_ESCAPE = 27;


/**
 * A log component.
 *
 * <Log
 *   entries={ [ { message, category }, ... ] }
 *   layout={ { log: { height, open } } }
 *   onClear={ () => { } }
 *   onLayoutChanged= { () => { } }
 *   onUpdateMenu = { () => { } } />
 *
 */
export default class Log extends PureComponent {
  constructor(props) {
    super(props);

    this.handleResize = throttle(this.handleResize);

    this.ref = new React.createRef();
    this.focusRef = React.createRef();

    this.context = {};
  }

  handleResizeStart = (event) => {
    const onDragStart = dragger(this.handleResize);

    onDragStart(event);

    const {
      height,
      open
    } = getLayoutFromProps(this.props);

    this.context = {
      open,
      startHeight: height
    };
  }

  handleResize = (_, delta) => {
    const { y: dy } = delta;

    if (dy === 0) {
      return;
    }

    const { startHeight } = this.context;

    const {
      height,
      open
    } = getLayout(dy, startHeight);

    this.context = {
      ...this.context,
      height,
      open
    };

    if (this.ref.current) {
      this.ref.current.classList.toggle('open', open);
      this.ref.current.style.height = `${ open ? height : 0 }px`;
    }
  }

  handleResizeEnd = () => {
    const {
      height,
      open
    } = this.context;

    this.context = {};

    this.changeLayout({
      log: {
        height,
        open
      }
    });
  }

  handleToggle = () => {
    const { layout = {} } = this.props;

    const { log = {} } = layout;

    this.changeLayout({
      log: {
        ...DEFAULT_LAYOUT,
        ...log,
        open: !log.open
      }
    });
  }

  changeLayout = (layout = {}) => {
    const { onLayoutChanged } = this.props;

    if (isFunction(onLayoutChanged)) {
      onLayoutChanged(layout);
    }
  }

  checkFocus = () => {
    const panel = this.focusRef.current;

    const { entries } = this.props;

    const lastIdx = entries.length - 1;

    if (lastIdx !== -1) {
      const node = panel.querySelector(`*[data-idx='${ lastIdx }']`);

      node.scrollIntoView();
    }
  }

  componentDidUpdate = (prevProps) => {
    const {
      entries,
      layout
    } = this.props;

    if (layout.open && prevProps.entries !== entries) {
      this.checkFocus();
    }
  }

  handleKeyDown = (event) => {
    const { keyCode } = event;

    if (keyCode === KEYCODE_ESCAPE) {
      event.preventDefault();

      return this.handleToggle();
    }
  }

  handleCopy = () => {
    selectText(this.focusRef.current);

    document.execCommand('copy');
  }

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
  }

  render() {
    const {
      entries = [],
      onClear
    } = this.props;

    const {
      height,
      open
    } = getLayoutFromProps(this.props);

    return (
      <div
        className={ classNames(
          css.Log, {
            open
          }
        ) }>

        <Fill slot="status-bar__app" group="9_log">
          <button
            className={ classNames('btn', 'toggle-button', { 'btn--active': open }) }
            title="Toggle log"
            onClick={ this.handleToggle }
          >Log</button>
        </Fill>

        { open &&
          <React.Fragment>
            <div
              className="resizer"
              onDragStart={ this.handleResizeStart }
              onDragEnd={ this.handleResizeEnd }
              draggable
            ></div>
            <div
              className="body"
              ref={ this.ref }
              style={ { height } }>

              <div
                tabIndex="0"
                className="entries"
                ref={ this.focusRef }
                onKeyDown={ this.handleKeyDown }
                onFocus={ this.updateMenu }
              >
                <div className="controls">
                  <button className="copy-button" onClick={ this.handleCopy }>Copy</button>
                  <button className="clear-button" onClick={ onClear }>Clear</button>
                </div>

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
            </div>
          </React.Fragment>
        }
      </div>
    );
  }

}


// helpers //////////

function getLayout(dy, initialHeight) {
  let height = Math.min(initialHeight - dy, MAX_HEIGHT);

  const open = height >= MIN_HEIGHT;

  if (!open) {
    height = DEFAULT_LAYOUT.height;
  }

  return {
    height,
    open
  };
}

function getLayoutFromProps(props) {
  const layout = props.layout || {};

  const log = layout.log || DEFAULT_LAYOUT;

  const { open } = log;

  const height = open ? log.height : 0;

  return {
    height,
    open
  };
}

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
