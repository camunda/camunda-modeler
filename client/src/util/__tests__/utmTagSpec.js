/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { utmTag } from '../utmTag';


describe('util/utmTag', function() {

  it('should tag URL', function() {

    // when
    const taggedURL = utmTag('http://localhost/');

    // then
    expect(taggedURL).to.eql('http://localhost/?utm_source=modeler&utm_medium=referral');
  });


  it('should tag URL, overriding existing tags', function() {

    // when
    const taggedURL = utmTag('http://localhost/?utm_source=foo&utm_medium=bar');

    // then
    expect(taggedURL).to.eql('http://localhost/?utm_source=modeler&utm_medium=referral');
  });


  it('should tag URL, adding <category>', function() {

    // when
    const taggedURL = utmTag('http://localhost/', { campaign: 'baz' });

    // then
    expect(taggedURL).to.eql('http://localhost/?utm_source=modeler&utm_medium=referral&utm_campaign=baz');
  });

});
