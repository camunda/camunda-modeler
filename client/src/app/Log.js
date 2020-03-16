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

import dragger from '../util/dom/dragger';

import {
  throttle
} from '../util';

const DEFAULT_LAYOUT = {
  height: 130,
  open: false
};


/**
 * A log component
 *
 * <Log
 *   entries={ [ { message, category }, ... ] }
 *   layout={ height, open }
 *   onClear={ () => { } }
 *   onLayoutChanged= { () => { } }
 *   onUpdateMenu = { () => { } } />
 *
 */
export default class Log extends PureComponent {
  static defaultProps = {
    entries: [],
    layout: DEFAULT_LAYOUT
  };

  constructor(props) {
    super(props);

    this.panelRef = React.createRef();

    this.handleResize = throttle(this.handleResize);
  }

  changeLayout = (newLayout) => {
    this.props.onLayoutChanged({
      log: newLayout
    });
  }

  toggle = () => {
    const {
      layout
    } = this.props;

    this.changeLayout({
      ...layout,
      open: !layout.open
    });
  }

  handleResizeStart = event => {
    const onDragStart = dragger(this.handleResize);

    this.originalHeight = this.currentHeight;

    onDragStart(event);
  }

  handleResize = (_, delta) => {
    const {
      y
    } = delta;

    if (y === 0) {
      return;
    }

    const newHeight = this.originalHeight - y;

    const open = newHeight > 25;

    const height = open ? newHeight : DEFAULT_LAYOUT.height;

    this.changeLayout({
      open,
      height
    });
  }

  checkFocus = () => {

    const panel = this.panelRef.current;

    const {
      entries
    } = this.props;

    const lastIdx = entries.length - 1;

    if (lastIdx !== -1) {
      const node = panel.querySelector(`*[data-idx='${lastIdx}']`);

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

    const {
      keyCode,
      ctrlKey,
      metaKey
    } = event;

    if (keyCode === 27) { // ESC
      event.preventDefault();

      return this.toggle();
    }

    if (keyCode === 65 && (ctrlKey || metaKey)) { // <A>
      event.preventDefault();

      return this.handleCopy();
    }
  }

  handleCopy = (event) => {
    selectText(this.panelRef.current);

    document.execCommand('copy');
  }

  updateMenu = () => {

    const {
      onUpdateMenu
    } = this.props;

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
      entries,
      layout,
      onClear
    } = this.props;

    const {
      height,
      open
    } = layout;

    this.currentHeight = height;

    return (
      <div
        className={ classNames(
          css.Log, {
            open
          }
        ) }>

        <div className="header">
          <button
            className="toggle-button"
            title="Toggle log open state"
            onClick={ this.toggle }
          >Log</button>
        </div>

        <div
          className="resizer"
          onDragStart={ this.handleResizeStart }
          draggable
        ></div>

        { open &&
          <div
            className="body"
            style={ { height } }>

            <div
              tabIndex="0"
              className="entries"
              ref={ this.panelRef }
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

                  var msg;

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
        }
      </div>
    );
  }

}



// helpers /////////////////////////////////

function selectText(element) {
  let range, selection;

  selection = window.getSelection();
  range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

function hasSelection() {
  return window.getSelection().toString() !== '';
}
