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
  Modal
} from '../../../shared/ui';

import { Loader } from '../../primitives';

import {
  getFieldKey,
  getFieldGroups,
  getVisibleProperties
} from './credentialForm';

import {
  getFieldError,
  isFieldRequired
} from './config';

import {
  generateCredentialIdSuffix,
  getUniqueCredentialIdentity,
  getCredentialIdError,
  toRandomCredentialId
} from './credentialId';

import * as css from './CredentialModal.css';

import { debounce } from '../../../util';

const TITLES = {
  create: 'Add credential',
  edit: 'Edit credential',
  upgrade: 'Upgrade credential'
};

const SUBMIT_LABELS = {
  create: 'Create and select',
  edit: 'Save',
  upgrade: 'Save'
};

const SECRET_REFERENCE_PLACEHOLDER = 'camunda.secrets.SECRET_NAME';

const SECRET_REFERENCE_PREFIX = 'camunda.secrets.';

class CredentialModal extends PureComponent {
  constructor(props) {
    super(props);

    const credentialIdSuffix = props.mode === 'create'
      ? generateCredentialIdSuffix()
      : null;
    const identity = props.mode === 'create'
      ? getUniqueCredentialIdentity(
        props.displayName || '',
        props.existingCredentials,
        credentialIdSuffix
      )
      : {
        displayName: props.displayName || '',
        credentialId: props.credentialName || ''
      };

    this.state = {
      displayName: identity.displayName,
      credentialName: identity.credentialId,
      credentialIdSuffix,
      initialValues: props.initialValues,
      values: props.initialValues || {},
      checkedValues: props.initialValues || {},
      changedValues: false,
      submitting: false,
      error: null
    };

    this.commitCheckedValues = debounce(() => this.setState(state => ({ checkedValues: state.values })));
  }

  static getDerivedStateFromProps(props, state) {
    if (props.initialValues === state.initialValues) {
      return null;
    }

    if (state.changedValues) {
      return { initialValues: props.initialValues };
    }

    return {
      initialValues: props.initialValues,
      values: props.initialValues || {},
      checkedValues: props.initialValues || {}
    };
  }

  componentWillUnmount() {
    this.commitCheckedValues.cancel();
  }

  getProperties() {
    const { configurationTemplate } = this.props;

    return (configurationTemplate && configurationTemplate.properties) || [];
  }

  getVisibleFields() {
    return getVisibleProperties(this.getProperties(), this.state.values);
  }

  getVisibleFieldGroups() {
    const { configurationTemplate } = this.props;

    return getFieldGroups(
      this.getVisibleFields(),
      configurationTemplate && configurationTemplate.groups
    );
  }

  getCredentialName() {
    return this.state.credentialName;
  }

  canSubmit() {
    const { credentialName, values, submitting } = this.state;
    const { loading } = this.props;

    if (
      loading
      || submitting
      || getCredentialIdError(credentialName)
      || this.getDuplicateDisplayNameError()
      || this.getDuplicateCredentialNameError()
    ) {
      return false;
    }

    return this.getVisibleFields().every(
      field => !getFieldError(field, values[ getFieldKey(field) ])
    );
  }

  getOtherCredentials() {
    const { credentialName, existingCredentials = [], mode } = this.props;

    return mode === 'create'
      ? existingCredentials
      : existingCredentials.filter(credential => credential.name !== credentialName);
  }

  getDuplicateDisplayNameError() {
    const displayName = this.state.displayName.trim();

    if (!displayName) {
      return null;
    }

    const duplicate = this.getOtherCredentials().some(
      credential => credential.metadata?.displayName?.trim() === displayName
    );

    return duplicate
      ? 'A credential with this name already exists. Choose a different name.'
      : null;
  }

  getDuplicateCredentialNameError() {
    const duplicate = this.getOtherCredentials().some(
      credential => credential.name === this.state.credentialName
    );

    return duplicate
      ? 'A credential with this ID already exists. Choose a different ID.'
      : null;
  }

  handleDisplayNameChange = (event) => {
    const displayName = event.target.value;

    this.setState(({ credentialIdSuffix, credentialName }) => ({
      displayName,
      credentialName: this.props.mode === 'create'
        ? toRandomCredentialId(displayName, credentialIdSuffix)
        : credentialName
    }));
  };

  handleFieldChange(id, value) {
    this.setState(state => ({
      values: {
        ...state.values,
        [ id ]: value
      },
      changedValues: true
    }));

    this.commitCheckedValues();
  }

  handleSubmit = async () => {
    this.setState({ submitting: true, error: null });

    try {
      await this.props.onSubmit({
        displayName: this.state.displayName.trim(),
        name: this.getCredentialName(),
        values: this.state.values
      });

      // on success the parent unmounts this modal
    } catch (error) {
      this.setState({
        submitting: false,
        error: error.message || 'Something went wrong.'
      });
    }
  };

  renderField(field) {
    const { values, checkedValues } = this.state;
    const { secretReferences } = this.props;

    const fieldKey = getFieldKey(field);
    const id = `credential-field-${ fieldKey }`;
    const errorId = `${ id }-error`;
    const warningId = `${ id }-warning`;
    const value = values[ fieldKey ] ?? '';
    const required = isFieldRequired(field);

    const validationError = getFieldError(field, value);

    const secretField = isSecretField(field);

    const missingSecret = secretField
      ? getMissingSecretReference(checkedValues[ fieldKey ] ?? '', secretReferences)
      : null;

    const fieldError = validationError;

    // Non-blocking nudges, distinct from `fieldError`: a plain-text value (no
    // reference anywhere in the value), a bare prefix (an incomplete reference,
    // stored verbatim by the engine), or a reference to a not-yet-existing secret
    // is still saved (there is no create-secret API to redirect the user to), so
    // these are flagged as hints rather than treated as invalid. Plain text takes
    // precedence: the value contains no reference at all.
    const plainTextSecret = isPlainTextSecretValue(field, value);
    const incompleteReference = !plainTextSecret && isIncompleteSecretReference(field, value);

    const fieldWarning = !fieldError && (plainTextSecret
      ? (
        <>
          Storing this as plaintext exposes sensitive information on the connected
          { ' Camunda instance. Reference a secret instead, e.g. ' }
          <code>{ SECRET_REFERENCE_PREFIX }NAME</code>.
        </>
      )
      : incompleteReference
        ? (
          <>
            Incomplete secret reference: <code>{ SECRET_REFERENCE_PREFIX }</code> is missing the secret name.
          </>
        )
        : missingSecret
          ? (
            <>
              Secret <code>{ missingSecret }</code> does not exist on the connected Camunda instance.
            </>
          )
          : null);

    const describedBy = fieldError ? errorId : (fieldWarning ? warningId : undefined);

    let controlClassName = 'form-control';

    if (fieldError) {
      controlClassName += ' is-invalid';
    } else if (fieldWarning) {
      controlClassName += ' is-warning';
    }

    let groupClassName = 'form-group';

    if (fieldError) {
      groupClassName += ' has-error';
    } else if (fieldWarning) {
      groupClassName += ' has-warning';
    }

    return (
      <div className={ groupClassName } key={ fieldKey }>
        <label htmlFor={ id }>
          { field.label || fieldKey }
          { required && <span> *</span> }
        </label>
        {
          field.type === 'Dropdown'
            ? (
              <select
                id={ id }
                className={ controlClassName }
                value={ value }
                aria-invalid={ fieldError ? 'true' : undefined }
                aria-describedby={ describedBy }
                onChange={ event => this.handleFieldChange(fieldKey, event.target.value) }
              >
                { field.optional && <option value=""></option> }
                {
                  (field.choices || []).map(choice => (
                    <option key={ choice.value } value={ choice.value }>{ choice.name }</option>
                  ))
                }
              </select>
            )
            : (
              <input
                id={ id }
                className={ controlClassName }
                type="text"
                value={ value }
                placeholder={ field.secret ? SECRET_REFERENCE_PLACEHOLDER : undefined }
                aria-invalid={ fieldError ? 'true' : undefined }
                aria-describedby={ describedBy }
                onChange={ event => this.handleFieldChange(fieldKey, event.target.value) }
              />
            )
        }
        { fieldError && (
          <p className="credential-modal-error" id={ errorId }>
            { fieldError }
          </p>
        ) }
        {

          /*
           * Mounted for every secret field, not only once a warning exists: several screen
           * readers only announce a change to a live region already in the accessible tree,
           * not one inserted together with its content already set.
           */

          isSecretField(field) && (
            <p className="credential-modal-warning" id={ warningId } role="status">
              { fieldWarning }
            </p>
          )
        }
        { field.description && <p className="form-text">{ renderDescription(field.description) }</p> }
      </div>
    );
  }

  render() {
    const { loading, mode, onClose } = this.props;
    const {
      credentialName,
      displayName,
      submitting,
      error
    } = this.state;

    const displayNameError = this.getDuplicateDisplayNameError();

    return (
      <Modal onClose={ submitting ? null : onClose }>

        <Modal.Title>{ TITLES[ mode ] || TITLES.create }</Modal.Title>

        <Modal.Body>
          <div className={ css.credentialModal }>
            { loading ? (
              <div className="credential-modal-loading" role="status" aria-label="Loading credential">
                <Loader />
              </div>
            ) : <>
              <div className={ displayNameError ? 'form-group has-error' : 'form-group' }>
                <label htmlFor="credential-display-name">Credential name</label>
                <input
                  id="credential-display-name"
                  className={ displayNameError ? 'form-control is-invalid' : 'form-control' }
                  type="text"
                  value={ displayName }
                  aria-invalid={ displayNameError ? 'true' : undefined }
                  aria-describedby={ displayNameError ? 'credential-display-name-error' : undefined }
                  onChange={ this.handleDisplayNameChange }
                />
                { displayNameError && (
                  <p
                    className="credential-modal-error"
                    id="credential-display-name-error"
                  >
                    { displayNameError }
                  </p>
                ) }
                { credentialName && (
                  <p className="form-text" id="credential-id-help">
                    Referenced as <code>=camunda.vars.env.{ credentialName }</code>
                  </p>
                ) }
              </div>

              { this.getVisibleFieldGroups().map(group => (
                <section className="credential-modal-group" key={ group.id }>
                  <h3>{ group.label }</h3>
                  { group.properties.map(field => this.renderField(field)) }
                </section>
              )) }

              { error && <p className="credential-modal-error" role="alert">{ error }</p> }
            </> }
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="buttonDiv">
            <button className="btn btn-secondary" onClick={ onClose } disabled={ submitting }>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={ this.handleSubmit } disabled={ !this.canSubmit() }>
              { SUBMIT_LABELS[ mode ] || SUBMIT_LABELS.edit }
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default CredentialModal;


// helpers //////////

const ANCHOR_PATTERN = /<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;

/**
 * Render a configuration-template field description, turning `<a href>` links
 * into real anchors. Only http(s) links are linkified; text is rendered by
 * React and thus escaped, so no markup injects.
 *
 * @param {string} description
 * @returns {Array<string|JSX.Element>}
 */
function renderDescription(description) {
  const nodes = [];

  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = ANCHOR_PATTERN.exec(description)) !== null) {
    const [ full, href, text ] = match;

    if (match.index > lastIndex) {
      nodes.push(description.slice(lastIndex, match.index));
    }

    if (/^https?:\/\//i.test(href)) {
      nodes.push(
        <a key={ key++ } href={ href } target="_blank" rel="noopener noreferrer">{ text }</a>
      );
    } else {
      nodes.push(text);
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < description.length) {
    nodes.push(description.slice(lastIndex));
  }

  return nodes;
}

/**
 * Whether a field is one where a `camunda.secrets.<name>` reference is expected,
 * i.e. not a `Dropdown` (its value is choice-constrained, not free text).
 *
 * @param {Object} field
 *
 * @returns {boolean}
 */
function isSecretField(field) {
  return !!field.secret && field.type !== 'Dropdown';
}

/**
 * A `camunda.secrets.<name>` occurrence. The name charset `[A-Za-z0-9_-]` mirrors
 * the engine's (`[\p{Alnum}_-]+` restricted to ASCII), so detection agrees with
 * resolution: any occurrence in the value is detected and substituted at runtime,
 * literal surroundings included.
 */
const SECRET_REFERENCE_PATTERN = /camunda\.secrets\.[A-Za-z0-9_-]+/;

/**
 * Whether a secret field's current value holds no complete `camunda.secrets.<name>`
 * reference, i.e. is stored and resolved as plain text verbatim. The bare prefix
 * (`camunda.secrets.` with no name) is reported separately as an incomplete
 * reference. The raw (untrimmed) value is classified: padding is stored too, so
 * ` camunda.secrets.X ` is plain text, not a reference.
 *
 * @param {Object} field
 * @param {string} value
 *
 * @returns {boolean}
 */
function isPlainTextSecretValue(field, value) {
  return isSecretField(field)
    && typeof value === 'string'
    && value !== ''
    && value !== SECRET_REFERENCE_PREFIX
    && !SECRET_REFERENCE_PATTERN.test(value);
}

/**
 * Whether a secret field's current value is the bare `camunda.secrets.` prefix,
 * i.e. a reference without a name. The engine stores it verbatim, so it is
 * flagged as incomplete rather than treated as a valid reference.
 *
 * @param {Object} field
 * @param {string} value
 *
 * @returns {boolean}
 */
function isIncompleteSecretReference(field, value) {
  return isSecretField(field)
    && typeof value === 'string'
    && value === SECRET_REFERENCE_PREFIX;
}

/**
 * The `camunda.secrets.<name>` reference that is missing from the cluster, or
 * null when the value references no secret, the referenced secret exists, or the
 * existence check is unavailable (`secretReferences` is not an array).
 *
 * @param {string} value
 * @param {string[]|null} secretReferences
 *
 * @returns {string|null}
 */
function getMissingSecretReference(value, secretReferences) {
  if (!Array.isArray(secretReferences) || typeof value !== 'string') {
    return null;
  }

  const match = value.match(SECRET_REFERENCE_PATTERN);

  if (!match) {
    return null;
  }

  const reference = match[0];

  return secretReferences.includes(reference) ? null : reference;
}