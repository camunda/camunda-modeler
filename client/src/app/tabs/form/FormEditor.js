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

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import css from './FormEditor.less';

import { getFormEditMenu } from './getFormEditMenu';

import { active as isInputActive } from '../../../util/dom/isInput';

import { createFormEditor } from './editor/FormEditor';

import { isFunction } from 'min-dash';

export class FormEditor extends CachedComponent {
  constructor(props) {
    super(props);

    this.ref = createRef();

    this.state = {};
  }

  componentDidMount() {
    let {
      attachForm,
      form
    } = this.getCached();

    if (this.ref.current) {
      attachForm(this.ref.current);
    }

    this.checkImport();

    this.listen('on', form);
  }

  componentWillUnmount() {
    const {
      detachForm,
      form
    } = this.getCached();

    detachForm();

    this.listen('off', form);
  }

  componentDidUpdate(prevProps) {
    this.checkImport(prevProps);
  }

  checkImport(prevProps) {
    if (!this.isImportNeeded(prevProps)) {
      return;
    }

    this.importSchema();
  }

  isImportNeeded(prevProps) {
    const { xml: schema } = this.props;

    if (prevProps && prevProps.xml === schema) {
      return false;
    }

    const { lastSchema } = this.getCached();

    return schema !== lastSchema;
  }

  importSchema() {
    const { container } = this.getCached();

    const { xml: schema } = this.props;

    let form = null,
        error = null;

    try {
      form = createFormEditor({
        container,
        schema: JSON.parse(schema)
      });
    } catch (err) {
      error = err;
    }

    this.handleImport(form, error);
  }

  handleImport(form, error) {
    const {
      onImport,
      xml: schema
    } = this.props;

    if (error) {
      this.setCached({
        form: null,
        lastSchema: null
      });
    } else {
      this.setCached({
        form,
        lastSchema: schema
      });

      this.listen('on', form);
    }

    onImport(error);
  }

  listen(fn, form) {
    if (!form) {
      return;
    }

    // TODO(philippfromme): Refactor dirty checking once we have commands
    form[ fn ]('changed', this.setDirty);

    [
      'propertiesPanel.focusin',
      'propertiesPanel.focusout',
      'selection.changed'
    ].forEach((event) => form[ fn ](event, this.handleChanged));
  }

  handleChanged = (dirty = false) => {
    const { onChanged } = this.props;

    const inputActive = isInputActive();

    const newState = {
      dirty: dirty || this.isDirty(),
      inputActive,
      save: true
    };

    if (isFunction(onChanged)) {
      onChanged({
        ...newState,
        editMenu: getFormEditMenu(newState)
      });
    }

    this.setState(newState);
  }

  setDirty = () => {
    this.setCached({ dirty: true });

    this.handleChanged(true);
  }

  isDirty() {
    const { dirty = false } = this.getCached();

    return dirty;
  }

  getXML() {
    const { form } = this.getCached();

    const schema = JSON.stringify(form.getSchema(), null, 2);

    this.setCached({
      dirty: false,
      lastSchema: schema
    });

    return schema;
  }

  triggerAction() {}

  render() {
    return (
      <div
        className={ css.FormEditor }
        onFocus={ this.handleChanged }
        ref={ this.ref } />
    );
  }

  static createCachedState() {
    const container = document.createElement('div');

    container.classList.add('container');

    const attachForm = (parentNode) => {
      parentNode.appendChild(container);
    };

    const detachForm = () => {
      container.remove();
    };

    return {
      __destroy: () => {},
      container,
      attachForm,
      detachForm,
      dirty: false,
      lastSchema: null
    };
  }
}

export default WithCache(WithCachedState(FormEditor));