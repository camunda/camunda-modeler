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

import { Modal } from '../../shared/ui';

import { SettingsForm } from './SettingsForm';

import * as css from './SettingsPlugin.less';

export default function SettingsPlugin(props) {

  const {
    settings: settingsProvider,
    subscribe,
  } = props;

  const [ open, setOpen ] = useState(false);
  const [ schema, setSchema ] = useState({});
  const [ values, setValues ] = useState({});

  const loadSettings = () => {
    setSchema(settingsProvider.getSchema());
    setValues(settingsProvider.getAll());
  };

  const handleSave = (values) => {
    const flattenValues = {};

    forEach(values, (properties, prefix) => {
      forEach(properties, (value, name) => {
        flattenValues[`${prefix}.${name}`] = value;
      });
    });

    settingsProvider.set(flattenValues);
  };

  useEffect(() => {
    subscribe('app.settings-open', () => {
      setOpen(true);
    });
  }, [ ]);

  useEffect(() => {
    loadSettings();
  }, [ open ]);

  if (!open) {
    return null;
  }

  return (
    <Modal onClose={ () => setOpen(false) }>
      <div className={ css.SettingsPlugin }>
        <h1>Settings</h1>
        <Formik
          initialValues={ { } }
          onSubmit={ handleSave }
        >
          <SettingsForm schema={ schema } values={ values } />
        </Formik>
      </div>
    </Modal>
  );
}