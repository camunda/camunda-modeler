/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { debounce } from 'min-dash';

export const LINTING_DEBOUNCE_WAIT = 300;


/**
 * Schedules (debounced) linting for an editor and manages it across the
 * editor's mount lifecycle.
 *
 * Linting is a follow-up computation that only makes sense for the tab the
 * user is looking at: it is always scheduled (never run synchronously, e.g. on
 * import) and coalesces bursts of triggers - a fresh import, element templates
 * loading, engine profile changes - into a single run. Deferring the lint also
 * lets the editor state (e.g. the imported document and its engine profile)
 * settle before it runs.
 *
 * A lint scheduled while the tab is shown is cancelled when the tab is hidden
 * (the editor unmounts) and resumed when it is shown again, so linting never
 * runs for a hidden tab yet an owed lint is not lost.
 *
 * The pending marker lives in the (tab-scoped) editor cache so it survives the
 * editor remounting when switching away and back to the tab.
 */
export default class LintingHelper {
  constructor({ lint, getCached, setCached, timeout = LINTING_DEBOUNCE_WAIT }) {
    this._getCached = getCached;
    this._setCached = setCached;

    this._scheduled = false;

    this._debounced = debounce(() => {
      this._scheduled = false;

      lint();
    }, timeout);

    this.schedule = this.schedule.bind(this);
    this.cancel = this.cancel.bind(this);
    this.resume = this.resume.bind(this);
    this.flush = this.flush.bind(this);
  }

  /**
   * Schedule a (debounced) lint.
   */
  schedule() {
    this._scheduled = true;

    this._debounced();
  }

  /**
   * Cancel a pending lint, remembering it so it can be resumed once the tab is
   * shown again. Call on unmount.
   */
  cancel() {
    if (!this._scheduled) {
      return;
    }

    this._debounced.cancel();

    this._scheduled = false;

    this._setCached({ lintingPending: true });
  }

  /**
   * Resume a lint that was pending when the tab was last hidden. Call on mount.
   */
  resume() {
    if (!this._getCached().lintingPending) {
      return;
    }

    this._setCached({ lintingPending: false });

    this.schedule();
  }

  /**
   * Immediately run a scheduled lint (if any). Primarily useful in tests.
   */
  flush() {
    this._debounced.flush();
  }
}
