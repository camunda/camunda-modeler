/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { createRef, Fragment } from 'react';

import { isFunction } from 'min-dash';

import debounce from '../../../util/debounce';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import { Loader } from '../../primitives';

import css from './FormEditor.less';

import { getFormEditMenu } from './getFormEditMenu';

import { active as isInputActive } from '../../../util/dom/isInput';

import { FormEditor as Form } from './editor/FormEditor';

import {
  EngineProfile,
  getEngineProfileFromForm
} from '../EngineProfile';

import EngineProfileHelper from '../EngineProfileHelper';

import { ENGINES } from '../../../util/Engines';

import { Linting } from '../Linting';

import Panel from '../panel/Panel';

import LintingTab from '../panel/tabs/LintingTab';

const LOW_PRIORITY = 500;

export const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.PLATFORM
};


export class FormEditor extends CachedComponent {
  constructor(props) {
    super(props);

    this.ref = createRef();

    this.state = {
      importing: false
    };

    this.engineProfile = new EngineProfileHelper({
      get: () => {
        const { form } = this.getCached();

        const schema = form.getSchema();

        return getEngineProfileFromForm(schema, DEFAULT_ENGINE_PROFILE);
      },
      set: (engineProfile) => {
        const { form } = this.getCached();

        const root = form._state.schema;

        const modeling = form.get('modeling');

        modeling.editFormField(root, engineProfile);
      },
      getCached: () => this.getCached(),
      setCached: (state) => this.setCached(state)
    });

    this.handleLintingDebounced = debounce(this.handleLinting.bind(this));
  }

  componentDidMount() {
    this._isMounted = true;

    let { form } = this.getCached();

    if (this.ref.current) {
      form.attachTo(this.ref.current);
    }

    this.checkImport();

    this.listen('on');
  }

  componentWillUnmount() {
    this._isMounted = false;

    const { form } = this.getCached();

    form.detach();

    this.listen('off');
  }

  componentDidUpdate(prevProps) {
    console.log("formeditor component did update");
    this.checkImport(prevProps);

    if (isCacheStateChanged(prevProps, this.props)) {
      this.handleChanged();
    }
  }

  checkImport(prevProps) {
    if (!this.isImportNeeded(prevProps)) {
      return;
    }

    const { xml: schema } = this.props;

    this.importSchema(schema);
  }

  isImportNeeded(prevProps = {}) {
    const { importing } = this.state;

    if (importing) {
      return false;
    }

    const { xml: schema } = this.props;

    const { xml: prevSchema } = prevProps;

    if (schema === prevSchema) {
      return false;
    }

    const { lastSchema } = this.getCached();

    return schema !== lastSchema;
  }

  async importSchema(schema) {
    console.log("importing schema");
    this.setState({
      importing: true
    });

    const { form } = this.getCached();

    let error = null,
        warnings = null;

    try {
      const schemaJSON = JSON.parse(schema);

      ({ error, warnings } = await form.importSchema(schemaJSON));
    } catch (err) {
      error = err;

      if (err.warnings) {
        warnings = err.warnings;
      }
    }

    if (this._isMounted) {
      this.handleImport(error, warnings);
    }
  }

  handleImport(error, warnings) {
    const { form } = this.getCached();

    const commandStack = form.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    const {
      onImport,
      xml: schema
    } = this.props;

    let engineProfile = null;

    try {
      engineProfile = this.engineProfile.get(true);
    } catch (err) {
      error = err;
    }

    if (error) {
      this.setCached({
        engineProfile: null,
        lastSchema: null
      });
    } else {
      this.setCached({
        engineProfile,
        lastSchema: schema,
        stackIdx
      });

      this.handleLinting();
    }

    this.setState({
      importing: false
    });

    onImport(error, warnings);
  }

  listen(fn) {
    const { form } = this.getCached();

    [
      'attach',
      'form.init',
      'commandStack.changed',
      'import.done',
      'propertiesPanel.focusin',
      'propertiesPanel.focusout',
      'selection.changed'
    ].forEach((event) => {
      console.log("here because of ", fn, event);

      form[ fn ](event, this.handleChanged);
    }
    );

    if (fn === 'on') {
      form.on('commandStack.changed', LOW_PRIORITY, this.handleLintingDebounced);
    } else if (fn === 'off') {
      form.off('commandStack.changed', this.handleLintingDebounced);
    }
  }

  handleChanged = () => {
    const { onChanged } = this.props;

    console.log(this);

    console.log(onChanged);

    const { form } = this.getCached();

    const commandStack = form.get('commandStack');

    const inputActive = isInputActive();

    const newState = {
      defaultUndoRedo: inputActive,
      dirty: this.isDirty(),
      inputActive,
      redo: commandStack.canRedo(),
      save: true,
      undo: commandStack.canUndo()
    };

    if (isFunction(onChanged)) {
      onChanged({
        ...newState,
        editMenu: getFormEditMenu(newState)
      });
    }

    this.setState(newState);

    try {
      const engineProfile = this.engineProfile.get();

      this.engineProfile.setCached(engineProfile);
    } catch (err) {

      // TODO
    }
  }

  handleLinting = () => {
    const engineProfile = this.engineProfile.getCached();

    const { form } = this.getCached();

    if (!engineProfile || !engineProfile.executionPlatformVersion) {
      return;
    }

    const contents = form.getSchema();

    const { onAction } = this.props;

    onAction('lint-tab', { contents });
  }

  isDirty() {
    const {
      form,
      stackIdx
    } = this.getCached();

    const commandStack = form.get('commandStack');

    return commandStack._stackIdx !== stackIdx;
  }

  getXML() {
    const {
      form,
      lastSchema
    } = this.getCached();

    const commandStack = form.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    if (!this.isDirty()) {
      return lastSchema || this.props.xml;
    }

    const schema = JSON.stringify(form.saveSchema(), null, 2);

    this.setCached({
      lastSchema: schema,
      stackIdx
    });

    return schema;
  }

  triggerAction(action, context) {
    const { form } = this.getCached();

    const editorActions = form.get('editorActions');

    if (action === 'selectElement') {
      editorActions.trigger('selectFormField', context);
    }

    if (editorActions.isRegistered(action)) {
      return editorActions.trigger(action, context);
    }
  }

  render() {
    console.log("formEditor render is called");
    const engineProfile = this.engineProfile.getCached();

    this.handleChanged();

    const {
      layout,
      linting = [],
      onAction,
      onLayoutChanged
    } = this.props;

    const { importing } = this.state;

    return (
      <div className={ css.FormEditor }>
        <Loader hidden={ !importing } />

        <div
          className="form"
          onFocus={ this.handleChanged }
          ref={ this.ref }
        ></div>

        { engineProfile && <EngineProfile
          engineProfile={ engineProfile }
          onChange={ (engineProfile) => this.engineProfile.set(engineProfile) } /> }

        {
          engineProfile && <Fragment>
            <Panel
              layout={ layout }>
              <LintingTab
                layout={ layout }
                linting={ linting }
                onAction={ onAction }
                onLayoutChanged={ onLayoutChanged } />
            </Panel>
            <Linting
              layout={ layout }
              linting={ linting }
              onLayoutChanged={ onLayoutChanged } />
          </Fragment>
        }
      </div>
    );
  }

  static createCachedState(props) {

    const {
      onAction,
    } = props;

    const form = new Form({});

    const commandStack = form.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    onAction('emit-event', {
      type: 'form.modeler.created',
      payload: form
    });

    return {
      __destroy: () => {
        form.destroy();
      },
      engineProfile: null,
      form,
      lastSchema: null,
      stackIdx
    };
  }
}

export default WithCache(WithCachedState(FormEditor));

// helpers //////////

function isCacheStateChanged(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}
