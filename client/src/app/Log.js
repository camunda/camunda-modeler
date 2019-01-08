import React, { Component } from 'react';

import css from './Log.less';

import classNames from 'classnames';

import dragger from '../util/dom/dragger';

import {
  throttle
} from 'min-dash';


const DEFAULT_HEIGHT = 130;

const RESIZE_THROTTLE = 10;

/**
 * A log component
 *
 * <Log
 *   entries={ [ { message, category }, ... ] }
 *   expanded={ true | false}
 *   onToggle={ (expanded) => ... }
 *   onClear={ () => { } } />
 *
 */
export default class Log extends Component {

  constructor(props) {
    super(props);

    this.state = {};

    this.panelRef = React.createRef();

    if (process.env.NODE_ENV !== 'test') {
      this.handleResize = throttle(this.handleResize, RESIZE_THROTTLE);
    }
  }

  toggleLog = () => {
    const {
      expanded,
      onToggle
    } = this.props;

    onToggle(!expanded);
  }

  handleHover = () => {
    this.setState({
      hover: true
    });
  }

  handleOut = () => {
    this.setState({
      hover: false
    });
  }

  handleFocus = () => {
    this.setState({
      focus: true
    });
  }

  handleBlur = () => {
    this.setState({
      focus: false
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

    const newExpanded = newHeight > 25;

    const height = (newExpanded ? newHeight : DEFAULT_HEIGHT);

    const {
      expanded,
      onToggle
    } = this.props;

    this.setState({
      height
    });

    if (expanded !== newExpanded) {
      onToggle(newExpanded);
    }
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
      expanded
    } = this.props;

    if (expanded && prevProps.entries !== entries) {
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

      return this.toggleLog();
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

  handleClear = () => {
    const {
      onClear
    } = this.props;

    onClear();

    this.toggleLog();
  }

  render() {

    const {
      expanded,
      entries
    } = this.props;

    const {
      hover,
      focus,
      height
    } = this.state;

    const focussed = expanded && (hover || focus);

    const logHeight = height || DEFAULT_HEIGHT;

    this.currentHeight = logHeight;

    return (
      <div
        className={ classNames(
          css.Log, {
            expanded,
            focussed
          }
        ) }>

        <div className="header">
          <button
            className="toggle-button"
            title="Toggle log open state"
            onClick={ this.toggleLog }
          >Log</button>
        </div>

        <div
          className="resizer"
          onDragStart={ this.handleResizeStart }
          draggable
        ></div>

        { expanded &&
          <div
            className="body"
            onMouseEnter={ this.handleHover }
            onMouseLeave={ this.handleOut }
            onFocus={ this.handleFocus }
            onBlur={ this.handleBlur }
            style={ { height: logHeight } }>

            <div
              tabIndex="0"
              className="entries"
              ref={ this.panelRef }
              onKeyDown={ this.handleKeyDown }
            >
              <div className="controls">
                <button className="copy-button" onClick={ this.handleCopy }>Copy</button>
                <button className="clear-button" onClick={ this.handleClear }>Clear</button>
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
