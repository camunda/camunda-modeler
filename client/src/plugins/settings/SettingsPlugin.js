/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';

import { forEach, debounce, map, reduce } from 'min-dash';

import { omitBy } from 'lodash';

import { Formik } from 'formik';

import debug from 'debug';

import Flags from '../../util/Flags';

import { Modal } from '../../shared/ui';

import { SettingsForm } from './SettingsForm';

import useBuiltInSettings from './useBuiltInSettings';

import * as css from './SettingsPlugin.less';

const log = debug('Settings');

/**
 * Provides UI for the settings API.
 *
 * @param {Object} props
 * @param {import('../../app/Settings').Settings} props.settings
 *
 * @returns {JSX.Element}
 *
 */
export default function SettingsPlugin(props) {

  const {
    subscribe,
    triggerAction,
    _getGlobal
  } = props;

  const [ open, setOpen ] = useState(false);
  const [ showRestartWarning, setShowRestartWarning ] = useState(false);

  const [ settings, _ ] = useState(_getGlobal('settings'));
  const [ schema, setSchema ] = useState();
  const [ values, setValues ] = useState({});
  const [ targetElement, setTargetElement ] = useState(null);

  useBuiltInSettings(settings);

  useEffect(() => {
    const subscription = subscribe('app.settings-open', (options) => {
      if (options?.scrollToEntry) {
        setTargetElement(options.scrollToEntry);
        requestAnimationFrame(() => {
          const element = document.getElementById(options.scrollToEntry);

          if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'start' });
            element.focus();
          }
        });
      } else {
        setTargetElement(null);
      }
      setOpen(true);
    });

    return () => subscription.cancel();
  }, [ subscribe ]);

  useEffect(() => {
    if (!open) return;

    // Schema is settings metadata e.g. type, default value, etc.
    setSchema(settings.getSchema());
  }, [ open, settings ]);

  useEffect(() => {
    if (!schema) return;

    log('Settings#updateSchema %o', schema);

    const values = settings.get();

    // Setting can specify a flag
    // which will override the setting value if set
    // e.g. "app.disablePlugins": { ..., flag: 'disable-plugins' }
    map(flattenSchema(schema), ({ flag }, key) => {

      const flagValue = Flags.get(flag);

      if (flagValue !== undefined) {
        values[key] = flagValue;
      }
    });

    setValues(values);
  }, [ schema, settings ]);

  const handleSave = (data) => {
    const formikValues = flattenFormikValues(data);

    const changedValues = omitBy(formikValues, (value, key) => values[key] === value);

    if (!Object.keys(changedValues).length) {
      return;
    }

    const restart = Object.keys(changedValues).some(key => {
      const flatSchema = flattenSchema(schema);
      return flatSchema[key].restartRequired;
    });

    setShowRestartWarning(restart);

    settings.set(changedValues);
    setValues({ ...values, ...changedValues });

    log('Settings#handleSave %o', changedValues);
  };

  const handleRestart = () => {
    triggerAction('restart-modeler');
  };

  const handleClose = () => {
    triggerAction('emit-event', { type: 'settings.closed' });
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <Modal adaptive={ true } onClose={ handleClose }>
      <div className="modal-header">
        <h2 className="modal-title">Settings</h2>
      </div>
      <div className={ `${css.SettingsPlugin} modal-body` }>

        {showRestartWarning &&
          <div className="restart-warning">Restart the modeler to apply the changes.&nbsp;
            <button className="btn-restart" onClick={ handleRestart }>Restart now.</button>
          </div>
        }

        <Formik
          initialValues={ { } }
        >
          <SettingsForm
            schema={ schema }
            values={ values }
            onChange={ debounce(handleSave, 200) }
            targetElement={ targetElement }
          />
        </Formik>

      </div>
      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          type="button"
          onClick={ handleClose }
        >
          Done
        </button>
      </div>
    </Modal>
  );
}


// helpers

/**
 * Returns a flat dictionary of Formik values.
 *
 * Values submitted by the Formik form are nested based on the dots in field names.
 * Settings API uses dots to group settings, but we want a flat dictionary.
 *
 * @param {Object} formikValues
 * @returns {Object<string, string|boolean>}
 */
function flattenFormikValues(formikValues) {

  return reduce(formikValues, (acc, properties, key) => {

    forEach(properties, (value, name) => {
      acc[`${key}.${name}`] = value;
    });

    return acc;

  }, {});
}

/**
 * Returns all schema properties as a flat dictionary.
 * @param {Object} schema
 * @returns {Object<string, Object>}
 */
function flattenSchema(schema) {
  return reduce(schema, (acc, { properties }) => {
    return { ...acc, ...properties };
  }, {});
}
