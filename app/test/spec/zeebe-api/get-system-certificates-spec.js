/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const sinon = require('sinon');
const tls = require('node:tls');

const modulePath = require.resolve('../../../lib/zeebe-api/get-system-certificates');


describe('getSystemCertificates', function() {

  let getCACertificates, getSystemCertificates;

  beforeEach(function() {
    getCACertificates = sinon.stub(tls, 'getCACertificates');

    getCACertificates.withArgs('system').returns([ 'system-1', 'shared' ]);
    getCACertificates.withArgs('default').returns([ 'default-1', 'shared' ]);

    // bypass module-level cache
    delete require.cache[modulePath];
    getSystemCertificates = require(modulePath);
  });

  afterEach(function() {
    getCACertificates.restore();

    delete require.cache[modulePath];
  });


  it('should return system and bundled certificates, without duplicates', async function() {

    // when
    const certificates = await getSystemCertificates();

    // then
    expect(certificates).to.eql([ 'system-1', 'shared', 'default-1' ]);
  });


  it('should cache result', async function() {

    // when
    const first = await getSystemCertificates();
    const second = await getSystemCertificates();

    // then
    expect(second).to.equal(first);
    expect(getCACertificates).to.have.callCount(2);
  });

});


describe('getSystemCertificates (real trust store)', function() {

  it('should return PEM certificates', async function() {

    // given
    const getSystemCertificates = require(modulePath);

    // when
    const certificates = await getSystemCertificates();

    // then
    expect(certificates).to.not.be.empty;

    certificates.forEach(certificate => {
      expect(certificate).to.match(/^-----BEGIN CERTIFICATE-----/);
    });
  });


  (process.platform === 'win32' ? it : it.skip)('should read Windows certificate store', function() {

    // then
    expect(tls.getCACertificates('system')).to.not.be.empty;
  });

});

