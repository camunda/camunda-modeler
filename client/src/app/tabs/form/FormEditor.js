/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { createRef } from 'react';

import { isFunction, keys } from 'min-dash';

import debounce from '../../../util/debounce';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import { Loader } from '../../primitives';

import * as css from './FormEditor.less';

import { getFormEditMenu } from './getFormEditMenu';

import { getFormWindowMenu } from './getFormWindowMenu';

import { active as isInputActive } from '../../../util/dom/isInput';

import { FormPlayground as Form } from './editor/FormEditor';

import Metadata from '../../../util/Metadata';

import {
  EngineProfile,
  getEngineProfileFromForm
} from '../EngineProfile';

import EngineProfileHelper from '../EngineProfileHelper';

import { ENGINES } from '../../../util/Engines';

import { FormPreviewToggle } from './FormPreviewToggle';

const LOW_PRIORITY = 500;

export const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.PLATFORM
};

const FORM_LAYOUT_KEY = 'formEditor';

const DEFAULT_LAYOUT = {
  'form-preview': { open: false },
  'form-input': { open: false },
  'form-output': { open: false }
};

export const FORM_PREVIEW_TRIGGER = {
  KEYBOARD_SHORTCUT: 'keyboardShortcut',
  PREVIEW_PANEL: 'previewPanel',
  STATUS_BAR: 'statusBar',
  WINDOW_MENU: 'windowMenu'
};


export class FormEditor extends CachedComponent {
  constructor(props) {
    super(props);

    const {
      layout = {}
    } = props;

    this.ref = createRef();

    this.state = {
      lastFormPreviewState: null,
      lastInputData: null,
      importing: false,
      previewOpen: isValidation(getInitialFormLayout(layout)),
      triggeredBy: null
    };

    this.engineProfile = new EngineProfileHelper({
      get: () => {
        const { form } = this.getCached();

        const schema = form.getSchema();

        return getEngineProfileFromForm(schema, DEFAULT_ENGINE_PROFILE);
      },
      set: (engineProfile) => {
        const { form } = this.getCached();

        const editor = form.getEditor();

        const root = editor._state.schema;

        const modeling = editor.get('modeling');

        modeling.editFormField(root, engineProfile);
      },
      getCached: () => this.getCached(),
      setCached: (state) => this.setCached(state)
    });

    this.handleLintingDebounced = debounce(this.handleLinting.bind(this));
  }

  componentDidMount() {
    let { form, lastSchema } = this.getCached();

    if (this.ref.current) {
      form.attachTo(this.ref.current);
    }

    if (lastSchema) {
      this.handlePlaygroundRendered();
      this.handleInitialPlaygroundLayout();
    } else {

      // wait for proper instantiation
      form.on('formPlayground.rendered', this.handlePlaygroundRendered);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;

    const { form } = this.getCached();

    form.detach();

    // notify current dragula instance to properly destroy from editor
    form.getEditor().get('eventBus').fire('detach');

    this.listen('off');
  }

  componentDidUpdate(prevProps) {
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
    this.setState({
      importing: true
    });

    const { form } = this.getCached();

    let error = null,
        warnings = null;

    try {
      const schemaJSON = JSON.parse(schema);

      /*
       * Note @pinussilvestrus:
       * Consider https://github.com/bpmn-io/form-js/issues/322.
       *
       * In the meanwhile, simply use editor import,
       * the playground is handling the orchestration
       */
      const result = await form.getEditor().importSchema(schemaJSON);

      if (result) {
        ({ error, warnings } = result);
      }
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

    const {
      onImport,
      xml: schema
    } = this.props;

    const editor = form.getEditor();

    const commandStack = editor.get('commandStack');

    const stackIdx = commandStack._stackIdx;

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

      this.handleLinting(engineProfile);
    }

    this.setState({
      importing: false
    });

    onImport(error, warnings);
  }

  listen(fn) {
    const { form } = this.getCached();

    const editor = form.getEditor();

    [
      'attach',
      'commandStack.changed',
      'import.done',
      'propertiesPanel.focusin',
      'propertiesPanel.focusout',
      'selection.changed'
    ].forEach((event) => editor[ fn ](event, this.handleChanged));

    this.handleDataEditorInteraction(fn);
    this.handleFormPreviewInteraction(fn);

    if (fn === 'on') {
      editor.on('commandStack.changed', LOW_PRIORITY, this.handleLintingDebounced);
      form.on('formPlayground.layoutChanged', this.handlePlaygroundLayoutChanged);
    } else if (fn === 'off') {
      editor.off('commandStack.changed', this.handleLintingDebounced);
      form.off('formPlayground.layoutChanged', this.handlePlaygroundLayoutChanged);
    }
  }

  handleDataEditorInteractionStart = () => {
    this.setState({
      lastInputData: this.getInputData()
    });
  };

  handleDataEditorInteractionEnd = () => {
    const {
      onAction
    } = this.props;

    const newData = this.getInputData();

    // fire event once data was touched (changed)
    if (this.state.lastInputData !== newData) {
      onAction('emit-event', {
        type: 'form.modeler.inputDataChanged'
      });
    }

    this.setState({
      lastInputData: null
    });
  };

  handleDataEditorInteraction(fn) {
    const dataEditorNode = this.ref.current.querySelector('.cfp-data-container');

    if (!dataEditorNode) {
      return;
    }

    if (fn === 'on') {
      dataEditorNode.addEventListener('focusin', this.handleDataEditorInteractionStart);
      dataEditorNode.addEventListener('focusout', this.handleDataEditorInteractionEnd);
    } else {
      dataEditorNode.removeEventListener('focusin', this.handleDataEditorInteractionStart);
      dataEditorNode.removeEventListener('focusout', this.handleDataEditorInteractionEnd);
    }
  }

  handleFormPreviewInteractionStart = () => {
    this.setState({
      lastFormPreviewState: this.getFormPreviewState()
    });
  };

  handleFormPreviewInteractionEnd = () => {
    const {
      onAction
    } = this.props;

    const newformPreviewState = this.getFormPreviewState();

    // fire event once preview was touched (changed)
    if (this.state.lastFormPreviewState !== newformPreviewState) {
      onAction('emit-event', {
        type: 'form.modeler.previewChanged'
      });
    }

    this.setState({
      lastFormPreviewState: null
    });
  };

  handleFormPreviewInteraction(fn) {
    const formPreviewNode = this.ref.current.querySelector('.cfp-preview-container');

    if (!formPreviewNode) {
      return;
    }

    if (fn === 'on') {
      formPreviewNode.addEventListener('focusin', this.handleFormPreviewInteractionStart);
      formPreviewNode.addEventListener('focusout', this.handleFormPreviewInteractionEnd);
    } else {
      formPreviewNode.removeEventListener('focusin', this.handleFormPreviewInteractionStart);
      formPreviewNode.removeEventListener('focusout', this.handleFormPreviewInteractionEnd);
    }
  }

  handleChanged = () => {

    const { onChanged } = this.props;

    const { previewOpen } = this.state;

    const { form } = this.getCached();

    const commandStack = form.getEditor().get('commandStack');

    const inputActive = isInputActive() || formOutputFocused();

    const newState = {
      defaultUndoRedo: inputActive,
      dirty: this.isDirty(),
      inputActive,
      previewOpen,
      redo: commandStack.canRedo(),
      removeSelected: inputActive,
      save: true,
      selectAll: true,
      undo: commandStack.canUndo()
    };

    if (isFunction(onChanged)) {
      onChanged({
        ...newState,
        editMenu: getFormEditMenu(newState),
        windowMenu: getFormWindowMenu(newState)
      });
    }

    this.setState(newState);

    try {
      const engineProfile = this.engineProfile.get();

      this.engineProfile.setCached(engineProfile);
    } catch (err) {

      // TODO
    }
  };

  handlePlaygroundRendered = () => {
    const { form } = this.getCached();

    this._isMounted = true;
    this.listen('on');

    // notify current dragula instance to properly re-attach
    form.getEditor().get('eventBus').fire('attach');

    this.checkImport();
  };

  handleInitialPlaygroundLayout() {

    const { form } = this.getCached();

    const { layout } = this.props;

    // adjust collapsible panels state according to global layout
    const formLayout = getInitialFormLayout(layout);

    const openedContainers = getOpenContainers(formLayout);
    openedContainers.length && form.open(openedContainers);

    const collapsedContainers = getCollapsedContainers(formLayout);
    collapsedContainers.length && form.collapse(collapsedContainers);
  }

  handlePlaygroundLayoutChanged = (event) => {
    const {
      layout
    } = event;

    const {
      onAction,
      onLayoutChanged
    } = this.props;

    // (1) persist layout in application
    if (isFunction(onLayoutChanged)) {
      onLayoutChanged({
        [FORM_LAYOUT_KEY]: layout
      });
    }

    // (2) notify interested parties that playground layout has changed
    onAction('emit-event', {
      type: 'form.modeler.playgroundLayoutChanged',
      payload: {
        layout,

        // assumption: everything else is internally triggered by the playground
        triggeredBy: this.state.triggeredBy || FORM_PREVIEW_TRIGGER.PREVIEW_PANEL
      }
    });

    // (3) toggle preview
    this.setState({
      previewOpen: isValidation(layout),
      triggeredBy: null
    });

    // (4) update menus and others
    this.handleChanged();
  };

  onTogglePreview = (open, context = {}) => {
    const {
      triggeredBy,
      triggeredByShortcut
    } = context;

    const { form } = this.getCached();
    open ? form.open() : form.collapse();

    this.setState({
      triggeredBy: triggeredByShortcut ? FORM_PREVIEW_TRIGGER.KEYBOARD_SHORTCUT : triggeredBy
    });
  };

  onCollapsePreview = (context) => this.onTogglePreview(false, context);

  onOpenPreview = (context) => this.onTogglePreview(true, context);

  handleLinting = (engineProfileOverride) => {
    const engineProfile = engineProfileOverride || this.engineProfile.getCached();

    const { form } = this.getCached();

    if (!engineProfile || !engineProfile.executionPlatformVersion) {
      return;
    }

    const contents = form.getEditor().saveSchema();

    const { onAction } = this.props;

    onAction('lint-tab', { contents });
  };

  isDirty() {
    const {
      form,
      stackIdx
    } = this.getCached();

    const commandStack = form.getEditor().get('commandStack');

    return commandStack._stackIdx !== stackIdx;
  }

  getForm() {
    const {
      form
    } = this.getCached();

    return form;
  }

  getXML() {
    const {
      form,
      lastSchema
    } = this.getCached();

    const commandStack = form.getEditor().get('commandStack');

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

  getInputData() {
    const {
      form
    } = this.getCached();

    return form.getDataEditor().getValue();
  }

  getFormPreviewState() {
    const {
      form
    } = this.getCached();

    return form.getForm()._getState();
  }

  triggerAction(action, context) {
    const { form } = this.getCached();

    if (action === 'collapsePreview') {
      return this.onCollapsePreview(context);
    }

    if (action === 'openPreview') {
      return this.onOpenPreview(context);
    }

    // editor is not yet available
    if (!this._isMounted) {
      return;
    }

    const editorActions = form.getEditor().get('editorActions');

    if (action === 'showLintError') {
      editorActions.trigger('selectFormField', context);
    }

    if (editorActions.isRegistered(action)) {
      return editorActions.trigger(action, context);
    }
  }

  render() {
    const engineProfile = this.engineProfile.getCached();

    const {
      importing,
      previewOpen
    } = this.state;

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

        <FormPreviewToggle
          previewOpen={ previewOpen }
          onCollapsePreview={ this.onCollapsePreview }
          onOpenPreview={ this.onOpenPreview } />
      </div>
    );
  }

  static createCachedState(props) {

    const {
      layout = {},
      onAction
    } = props;

    const {
      name,
      version
    } = Metadata;

    const form = new Form({
      schema: {
        components: [],
        type: 'default'
      },
      layout: getInitialFormLayout(layout),
      exporter: {
        name,
        version
      }
    });

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
      stackIdx: -1
    };
  }
}

export default WithCache(WithCachedState(FormEditor));

// helpers //////////

function isCacheStateChanged(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}

function isValidation(layout = {}) {
  return (
    (layout['form-preview'] || {}).open ||
    (layout['form-input'] || {}).open ||
    (layout['form-output'] || {}).open
  );
}

function getInitialFormLayout(layout) {
  const {
    [FORM_LAYOUT_KEY]: formLayout
  } = layout;

  return formLayout || DEFAULT_LAYOUT;
}

function filterContainersByState(formLayout, open) {
  return keys(formLayout).reduce((collapsed, key) => {
    const layout = formLayout[key];

    if (layout.open === open) {
      collapsed.push(key);
    }

    return collapsed;
  }, []);
}

function getCollapsedContainers(formLayout) {
  return filterContainersByState(formLayout, false);
}

function getOpenContainers(formLayout) {
  return filterContainersByState(formLayout, true);
}

function formOutputFocused() {
  const formOutputNode =
    document.body.querySelector('.cfp-collapsible-panel[data-idx="form-output"] .cfp-collapsible-panel-content');

  return !!formOutputNode && formOutputNode.contains(document.activeElement);
}
