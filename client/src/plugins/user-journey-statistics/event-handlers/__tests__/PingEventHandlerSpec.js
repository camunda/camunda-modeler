/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import MixpanelHandler from '../../MixpanelHandler';
import PingEventHandler from '../PingEventHandler';

import Flags from '../../../../util/Flags';


describe('<PingEventHandlerSpec>', () => {

  let track = sinon.spy();

  beforeEach(() => {
    const getGlobal = () => ({
      appPlugins: [ { name: 'pluginName' } ]
    });

    new PingEventHandler({ track, getGlobal });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });

  afterEach(sinon.restore);


  describe('should send', () => {

    it('should send initially', () => {

      // then
      expect(track).to.have.been.called;
    });


    it('should send on interval', async () => {

      // when
      new Promise(resolve => setTimeout(resolve, 1000)).then(() => {

        // then
        expect(track).to.have.been.calledOnce;
      });
    });

  });


  describe('plugins', () => {

    it('should send installed plugins', () => {

      // then
      expect(track).to.have.been.calledWith('ping', {
        flags: {},
        plugins: [ 'pluginName' ]
      });
    });
  });


  describe('flags', () => {

    afterEach(() => {
      Flags.reset();
    });

    it('should send set flags', () => {

      // given
      Flags.init({
        myFlagA: true,
        myFlagB: false
      });

      const track = sinon.spy();

      // when
      new PingEventHandler({ track, getGlobal: () => ({}) });

      // then
      expect(track).to.have.been.calledWith('ping', {
        flags: {
          myFlagA: true,
          myFlagB: false
        },
        plugins: []
      });
    });


    it('should mask non-boolean flags', () => {

      // given
      Flags.init({
        flagWithPrivateDataSet: 'my/custom/filepath'
      });

      const track = sinon.spy();

      // when
      new PingEventHandler({ track, getGlobal: () => ({}) });

      // then
      expect(track).to.have.been.calledWith('ping', {
        flags: { flagWithPrivateDataSet: true },
        plugins: []
      });
    });


    it('should not overwrite original Flags through masking', () => {

      // given
      Flags.init({
        flagWithPrivateDataSet: 'my/custom/filepath'
      });

      const track = sinon.spy();

      // when
      new PingEventHandler({ track, getGlobal: () => ({}) });

      // then
      expect(Flags.data.flagWithPrivateDataSet).to.eql('my/custom/filepath');
    });

  });

});