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

import {
  Button,
  Checkbox,
  Label
} from '@camunda/design-system';

import {
  Modal
} from '../../shared/ui';

import * as css from './PrivacyPreferencesView.css';

import {
  PRIVACY_TEXT_FIELD,
  PRIVACY_POLICY_URL,
  LEARN_MORE_TEXT,
  PRIVACY_POLICY_TEXT,
  PREFERENCES_LIST,
  OK_BUTTON_TEXT,
  CANCEL_BUTTON_TEXT,
  TITLE,
  DEFAULT_VALUES
} from './constants';

class PrivacyPreferencesView extends PureComponent {
  constructor(props) {
    super(props);

    this.state = { ...props.preferences };
  }

  isEnabled = (key) => {
    const {
      preferences
    } = this.props;

    if (!preferences) {
      return DEFAULT_VALUES[key];
    }

    return preferences[key];
  };

  hasAutoFocus(key) {
    const {
      autoFocusKey
    } = this.props;

    return key === autoFocusKey;
  }

  renderPreferences() {

    return PREFERENCES_LIST.map((item) => (
      <div className="privacy-preference" key={ item.key }>
        <Checkbox
          id={ item.key }
          defaultChecked={ this.isEnabled(item.key) }
          autoFocus={ this.hasAutoFocus(item.key) }
          aria-describedby={ `${ item.key }-description` }
          onCheckedChange={ (checked) => {
            this.setState({ [item.key]: checked === true });
          } } />
        <div className="privacy-preference__text">
          <Label htmlFor={ item.key }>{ item.title }</Label>
          <p className="privacy-preference__description" id={ `${ item.key }-description` }>
            { item.explanation }
          </p>
        </div>
      </div>
    ));
  }

  render() {

    const {
      onClose,
      onSaveAndClose,
      canCloseWithoutSave
    } = this.props;

    return (
      <Modal className={ css.View } onClose={ canCloseWithoutSave && onClose }>

        <Modal.Title>{ TITLE }</Modal.Title>

        <Modal.Body>
          <p>
            { PRIVACY_TEXT_FIELD }
          </p>

          <div className="privacy-preferences">
            { this.renderPreferences() }
          </div>

          <p>
            { LEARN_MORE_TEXT }{' '}
            <a href={ PRIVACY_POLICY_URL }>
              { PRIVACY_POLICY_TEXT }
            </a>
          </p>
        </Modal.Body>

        <Modal.Footer>
          { canCloseWithoutSave && (
            <Button variant="secondary" type="button" onClick={ onClose }>
              { CANCEL_BUTTON_TEXT }
            </Button>
          ) }
          <Button type="button" onClick={ () => {
            onSaveAndClose(this.state);
          } }>
            { OK_BUTTON_TEXT }
          </Button>
        </Modal.Footer>

      </Modal>
    );
  }
}

export default PrivacyPreferencesView;
