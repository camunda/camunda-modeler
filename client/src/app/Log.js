/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
 *   onLayoutChanged= () => { } } />
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
                    msg = message + '  [' + category + ']';
                  } else {
                    msg = ' ';
                  }

                  return (
                    <div className="entry" key={ idx } data-idx={ idx }>
                      {
                        action
                          ? <a href="#" onClick={ action }>{ msg }</a>
                          : <span>{ msg }</span>
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
  var range, selection;

  selection = window.getSelection();
  range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}
