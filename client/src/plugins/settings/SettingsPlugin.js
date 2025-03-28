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

import { forEach } from 'min-dash';

import { Formik } from 'formik';

import Flags from '../../util/Flags';

import { Modal } from '../../shared/ui';

import { SettingsForm } from './SettingsForm';

import * as css from './SettingsPlugin.less';

import { flattenFormikValues } from './helpers';

export default function SettingsPlugin(props) {

  const {
    settings: settingsProvider,
    subscribe,
    triggerAction
  } = props;

  const [ open, setOpen ] = useState(false);
  const [ reload, setReload ] = useState(false);

  const [ schema, setSchema ] = useState({});
  const [ values, setValues ] = useState({});
  const [ flags, setFlags ] = useState([]);

  useEffect(() => {
    subscribe('app.settings-open', () => {
      setOpen(true);
    });
  }, [ ]);

  useEffect(() => {
    loadSettings();
  }, [ open ]);

  const loadSettings = () => {
    setSchema(settingsProvider.getSchema());

    const values = settingsProvider.get();
    const flags = [];

    // Override values controlled by flags
    forEach(schema, ({ properties }) => {
      Object.keys(properties).forEach(property => {
        if (Flags.get(properties[property].flag) !== undefined) {
          values[property] = Flags.get(properties[property].flag);
          flags.push(property);
        }
      }
      );
    });

    setValues(values);
    setFlags(flags);
  };

  const handleSave = (data) => {
    const flattenValues = flattenFormikValues(data, flags);

    const changedFields = Object.keys(flattenValues).filter(
      (key) => flattenValues[key] !== values[key]
    );

    const requireReload = changedFields.some(item => {
      const schema = settingsProvider.getSchema(item);
      return !!schema.requireReload;
    });
    setReload(requireReload);

    console.log('changedFields', changedFields);

    settingsProvider.set(flattenValues);
  };

  const handleReload = () => {
    triggerAction('reload-modeler');
  };

  if (!open) {
    return null;
  }

  return (
    <Modal onClose={ () => setOpen(false) }>
      <div className={ css.SettingsPlugin }>
        <h1>Settings</h1>
        {reload &&
          <div className="reload-warning">Reload the modeler to apply the changes.
            <button className="btn-reload" onClick={ handleReload }>Reload now</button>
          </div>
        }
        <Formik
          initialValues={ { } }
          onSubmit={ handleSave }
        >
          <SettingsForm
            schema={ schema }
            values={ values }
            setReload={ setReload }
            handleClose={ () => setOpen(false) }
          />
        </Formik>
      </div>
    </Modal>
  );
}