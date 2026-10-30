/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';

import Settings from '../../Settings';

import { migrateStartPage } from '../migrateStartPage';

import {
  schema,
  SETTINGS_KEY_PREFER_CAMUNDA_7
} from '../../../plugins/settings/useBuiltInSettings';


describe('migrateStartPage', function() {

  it('should prefer Camunda 7 if a Camunda 7 file was used recently', async function() {

    // given
    const { settings, config } = setup({
      recentTabs: [
        { type: 'cloud-bpmn', file: { path: 'a.bpmn' } },
        { type: 'dmn', file: { path: 'b.dmn' } }
      ]
    });

    // when
    await migrateStartPage(settings, config);

    // then
    expect(settings.get(SETTINGS_KEY_PREFER_CAMUNDA_7)).to.be.true;
  });


  it('should NOT prefer Camunda 7 if only Camunda 8 files were used recently', async function() {

    // given
    const { settings, config } = setup({
      recentTabs: [
        { type: 'cloud-bpmn', file: { path: 'a.bpmn' } },
        { type: 'cloud-form', file: { path: 'b.form' } }
      ]
    });

    // when
    await migrateStartPage(settings, config);

    // then
    expect(config.stored).to.have.property(SETTINGS_KEY_PREFER_CAMUNDA_7, false);
  });


  it('should NOT prefer Camunda 7 without recent files', async function() {

    // given
    const { settings, config } = setup({});

    // when
    await migrateStartPage(settings, config);

    // then
    expect(config.stored).to.have.property(SETTINGS_KEY_PREFER_CAMUNDA_7, false);
  });


  it('should keep a stored choice', async function() {

    // given
    const { settings, config } = setup({
      settings: { [ SETTINGS_KEY_PREFER_CAMUNDA_7 ]: false },
      recentTabs: [
        { type: 'bpmn', file: { path: 'a.bpmn' } }
      ]
    });

    // when
    await migrateStartPage(settings, config);

    // then
    expect(settings.get(SETTINGS_KEY_PREFER_CAMUNDA_7)).to.be.false;
  });

});


// helpers //////////

function setup(values) {
  const config = {
    stored: { ...values.settings },
    get: async (key) => key === 'settings' ? config.stored : values[key],
    set: (key, value) => {
      if (key === 'settings') {
        config.stored = { ...value };
      }
    }
  };

  const settings = new Settings({ config });

  settings.register(schema);

  return { settings, config };
}
