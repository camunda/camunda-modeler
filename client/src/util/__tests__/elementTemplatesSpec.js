/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { map } from 'min-dash';

import templates from './fixtures/templates.json';

import { getPlatformTemplates, getCloudTemplates } from '../elementTemplates';


describe('util - elementTemplates', function() {

  it('should get platform templates', function() {

    // when
    const platformTemplates = getPlatformTemplates(templates);

    // then
    expect(withNames(platformTemplates)).to.eql([
      'Platform Task 1',
      'Platform Task 2',
      'No schema',
      'Platform Task 3'
    ]);
  });


  it('should get cloud templates', function() {

    // when
    const cloudTemplates = getCloudTemplates(templates);

    // then
    expect(withNames(cloudTemplates)).to.eql([
      'Cloud Task 1',
      'Cloud Task 2',
      'Cloud Task 3'
    ]);
  });

});


// helper /////////////

function withNames(templates) {
  return map(templates, template => template.name);
}