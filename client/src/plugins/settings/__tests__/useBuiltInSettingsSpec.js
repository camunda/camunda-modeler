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
import { schema } from '../useBuiltInSettings';
import { CustomTemplateSources, OOTBTemplatesToggle } from '../ElementTemplatesSettings';


describe('useBuiltInSettings', function() {

  it('should configure independent restart-required template settings', function() {

    // then
    expect(schema.sections.elementTemplates).to.exist;
    expect(schema.properties['app.disableConnectorTemplates']).to.include({
      type: 'custom',
      component: OOTBTemplatesToggle,
      default: false,
      flag: 'disable-connector-templates',
      label: 'OOTB connector templates',
      restartRequired: true,
      section: 'elementTemplates'
    });
    expect(schema.properties['app.customTemplateSources']).to.deep.include({
      type: 'custom',
      component: CustomTemplateSources,
      default: [],
      restartRequired: true,
      section: 'elementTemplates'
    });
    expect(schema.properties['app.customTemplateSources'].flag).not.to.exist;
  });


  it('should use latest stable versions', function() {

    // then
    expect(schema.properties['app.defaultC8Version'].default).to.equal('8.10.0');
    expect(schema.properties['app.defaultC7Version'].default).to.equal('7.24.0');
  });

});
