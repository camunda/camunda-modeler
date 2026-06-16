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

import * as css from './C8ctlTerminal.css';

const TOGGLE_KEY = '`';

const EDITABLE_TAGS = [ 'INPUT', 'TEXTAREA', 'SELECT' ];

// roll-up (slide-up) animation duration; keep in sync with the CSS `.closing`
// animation. A fallback timer finalizes the unmount in case `animationend`
// never fires (e.g. animations disabled).
const CLOSE_ANIMATION_MS = 150;
const CLOSE_FALLBACK_MS = CLOSE_ANIMATION_MS + 80;

/**
 * A Quake-style pop-over terminal that toggles with the backtick key and
 * executes c8ctl commands on the backend, streaming the output back into the
 * terminal log.
 */
export default class C8ctlTerminal extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      closing: false,
      prompt: 'c8ctl >',
      input: '',
      lines: [],
      history: [],
      historyIndex: -1,
      busy: false
    };

    this.inputRef = React.createRef();
    this.logRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleGlobalKeyDown);

    this.loadInfo();
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleGlobalKeyDown);

    if (this._closeTimer) {
      clearTimeout(this._closeTimer);
    }
  }

  async loadInfo() {
    try {
      const info = await this.props.c8ctl.getInfo();

      this.setState({
        prompt: info.prompt || 'c8ctl >',
        lines: [
          { type: 'system', text: 'c8ctl terminal — type `help` for commands, `clear` to reset, `Esc` to close.' }
        ]
      });
    } catch {

      // terminal still works; info is best-effort
    }
  }

  /**
   * Whether the event originates from an editable element outside the terminal.
   *
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  isEditableTarget(event) {
    const target = event.target;

    if (!target) {
      return false;
    }

    return EDITABLE_TAGS.includes(target.tagName) || target.isContentEditable;
  }

  handleGlobalKeyDown = (event) => {
    if (event.key !== TOGGLE_KEY || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // when closed, do not steal the backtick from editable fields
    if (!this.state.open && this.isEditableTarget(event)) {
      return;
    }

    event.preventDefault();

    this.toggle();
  };

  toggle = () => {
    if (this.state.closing) {
      return;
    }

    if (this.state.open) {
      this.close();

      return;
    }

    this.setState({ open: true }, () => {
      if (this.inputRef.current) {
        this.inputRef.current.focus();
      }
    });
  };

  close = () => {
    if (!this.state.open || this.state.closing) {
      return;
    }

    // keep mounted so the roll-up animation can play; unmount on its end
    this.setState({ closing: true });

    // fallback in case `animationend` never fires
    this._closeTimer = setTimeout(this.finishClose, CLOSE_FALLBACK_MS);
  };

  finishClose = () => {
    if (this._closeTimer) {
      clearTimeout(this._closeTimer);
      this._closeTimer = null;
    }

    this.setState({ open: false, closing: false });
  };

  handleAnimationEnd = () => {
    if (this.state.closing) {
      this.finishClose();
    }
  };

  appendLines(newLines) {
    this.setState(
      (state) => ({ lines: [ ...state.lines, ...newLines ] }),
      this.scrollToBottom
    );
  }

  scrollToBottom = () => {
    if (this.logRef.current) {
      this.logRef.current.scrollTop = this.logRef.current.scrollHeight;
    }
  };

  /**
   * Whether the command clears the local scrollback. Handled in the renderer
   * (the scrollback is UI state); never sent to the backend.
   *
   * @param {string} command
   * @returns {boolean}
   */
  isClearCommand(command) {
    const normalized = command.trim().toLowerCase();

    return normalized === 'clear' || normalized === 'cls';
  }

  async runCommand(command) {
    if (this.isClearCommand(command)) {
      this.setState((state) => ({
        lines: [],
        history: [ ...state.history, command ],
        historyIndex: -1
      }));

      return;
    }

    const echo = { type: 'input', text: `${this.state.prompt} ${command}` };

    this.appendLines([ echo ]);

    this.setState((state) => ({
      busy: true,
      history: [ ...state.history, command ],
      historyIndex: -1
    }));

    try {
      const result = await this.props.c8ctl.execute(command);

      const output = (result && result.output) || '';

      const outputLines = output.length
        ? output.split('\n').map((text) => ({
          type: result.isError ? 'error' : 'output',
          text
        }))
        : [];

      this.appendLines(outputLines);

      if (result && result.prompt) {
        this.setState({ prompt: result.prompt });
      }
    } catch (error) {
      this.appendLines([ { type: 'error', text: `✗ ${error.message || error}` } ]);
    } finally {
      this.setState({ busy: false }, () => {
        if (this.inputRef.current) {
          this.inputRef.current.focus();
        }
      });
    }
  }

  async complete() {
    const { input } = this.state;

    const prefix = input.trim();

    if (!prefix) {
      return;
    }

    try {
      const backendMatches = await this.props.c8ctl.complete(input);

      const matches = [ ...(backendMatches || []) ];

      // `clear` is a renderer-local command, so complete it here too
      if ('clear'.startsWith(prefix.toLowerCase()) && prefix.toLowerCase() !== 'clear') {
        matches.push('clear');
      }

      if (matches.length === 0) {
        return;
      }

      if (matches.length === 1) {
        this.setState({ input: matches[0] });
      } else {
        this.appendLines([ { type: 'system', text: matches.join('   ') } ]);
      }
    } catch {

      // completion is best-effort
    }
  }

  navigateHistory(direction) {
    const { history, historyIndex } = this.state;

    if (history.length === 0) {
      return;
    }

    let nextIndex;

    if (historyIndex === -1) {
      nextIndex = direction < 0 ? history.length - 1 : -1;
    } else {
      nextIndex = historyIndex + direction;
    }

    if (nextIndex < 0 || nextIndex >= history.length) {
      this.setState({ historyIndex: -1, input: '' });

      return;
    }

    this.setState({ historyIndex: nextIndex, input: history[nextIndex] });
  }

  handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      const command = this.state.input.trim();

      this.setState({ input: '' });

      if (command) {
        this.runCommand(command);
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();

      this.close();

      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();

      this.complete();

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      this.navigateHistory(-1);

      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      this.navigateHistory(1);
    }
  };

  handleInputChange = (event) => {
    this.setState({ input: event.target.value });
  };

  render() {
    const { open, closing, prompt, input, lines, busy } = this.state;

    if (!open && !closing) {
      return null;
    }

    const className = closing
      ? `${css.C8ctlTerminal} ${css.closing}`
      : css.C8ctlTerminal;

    return (
      <div
        className={ className }
        role="dialog"
        aria-label="c8ctl terminal"
        onAnimationEnd={ this.handleAnimationEnd }
      >
        <div className={ css.log } ref={ this.logRef }>
          {
            lines.map((line, index) => (
              <div key={ index } className={ css[line.type] || css.output }>
                { line.text }
              </div>
            ))
          }
        </div>
        <div className={ css.prompt }>
          <span className={ css.promptLabel }>{ prompt }</span>
          <input
            ref={ this.inputRef }
            className={ css.input }
            value={ input }
            spellCheck={ false }
            autoComplete="off"
            disabled={ busy }
            onChange={ this.handleInputChange }
            onKeyDown={ this.handleInputKeyDown }
          />
        </div>
      </div>
    );
  }
}
