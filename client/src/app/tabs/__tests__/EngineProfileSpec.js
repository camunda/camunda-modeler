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

import React from 'react';

import { mount } from 'enzyme';

import {
  SlotFillRoot,
  Slot
} from '../../slot-fill';

import { EngineProfile } from '../EngineProfile';

import { engineProfile as bpmnEngineProfile } from '../bpmn/BpmnEditor';
import { engineProfile as cloudBpmnEngineProfile } from '../cloud-bpmn/BpmnEditor';
import { engineProfile as dmnEngineProfile } from '../dmn/DmnEditor';

const spy = sinon.spy;


describe('<EngineProfile>', function() {

  let wrapper;

  afterEach(function() {
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });


  it('should render', function() {

    // given
    wrapper = renderEngineProfile({
      type: 'bpmn',
      engineProfile: {
        executionPlatform: 'Camunda Platform'
      }
    });

    // then
    expect(wrapper.exists()).to.be.true;
  });


  it('should open', function() {

    // given
    wrapper = renderEngineProfile({
      type: 'bpmn',
      engineProfile: {
        executionPlatform: 'Camunda Platform'
      }
    });

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
  });


  it('should close', function() {

    // given
    wrapper = renderEngineProfile({
      type: 'bpmn',
      engineProfile: {
        executionPlatform: 'Camunda Platform'
      }
    });

    wrapper.find('button').simulate('click');

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.false;
  });


  describe('BPMN', function() {

    it('should show description', function() {

      // given
      wrapper = renderEngineProfile({
        type: 'bpmn',
        engineProfile: bpmnEngineProfile
      });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
      expect(wrapper.find('EngineProfileDescription').exists()).to.be.true;
      expect(wrapper.find('Link').exists()).to.be.true;
      expect(wrapper.find('Link').prop('href')).to.equal('https://docs.camunda.org/manual/latest/');
    });

  });


  describe('Cloud BPMN', function() {

    it('should show description', function() {

      // given
      wrapper = renderEngineProfile({
        type: 'cloud-bpmn',
        engineProfile: cloudBpmnEngineProfile
      });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
      expect(wrapper.find('EngineProfileDescription').exists()).to.be.true;
      expect(wrapper.find('Link').exists()).to.be.true;
      expect(wrapper.find('Link').prop('href')).to.equal('https://docs.camunda.io/');
    });

  });


  describe('DMN', function() {

    it('should show description', function() {

      // given
      wrapper = renderEngineProfile({
        type: 'dmn',
        engineProfile: dmnEngineProfile
      });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
      expect(wrapper.find('EngineProfileDescription').exists()).to.be.true;
      expect(wrapper.find('Link').exists()).to.be.true;
      expect(wrapper.find('Link').prop('href')).to.equal('https://docs.camunda.org/manual/latest/');
    });

  });


  describe('Form', function() {

    it('should show selection', function() {

      // given
      wrapper = renderEngineProfile({
        type: 'form'
      });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
      expect(wrapper.find('EngineProfileSelection').exists()).to.be.true;
      expect(wrapper.find('Link').exists()).to.be.true;
      expect(wrapper.find('Link').prop('href')).to.equal('https://docs.camunda.org/manual/latest/');
    });


    describe('show selected engine profile', function() {

      it('should show selected engine profile (Camunda Platform 7.15)', function() {

        // given
        wrapper = renderEngineProfile({
          type: 'form',
          engineProfile: {
            executionPlatform: 'Camunda Platform',
            executionPlatformVersion: '7.15'
          }
        });

        // when
        wrapper.find('button').simulate('click');

        // then
        expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
        expect(wrapper.find('EngineProfileSelection').exists()).to.be.true;

        expect(wrapper.find('input').filterWhere((item) => item.prop('id') === 'execution-platform-camunda-platform').prop('checked')).to.be.true;
      });


      it('should show selected engine profile (Camunda Cloud 1.1)', function() {

        // given
        wrapper = renderEngineProfile({
          type: 'form',
          engineProfile: {
            executionPlatform: 'Camunda Cloud',
            executionPlatformVersion: '1.1'
          }
        });

        // when
        wrapper.find('button').simulate('click');

        // then
        expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
        expect(wrapper.find('EngineProfileSelection').exists()).to.be.true;

        expect(wrapper.find('input').filterWhere((item) => item.prop('id') === 'execution-platform-camunda-cloud').prop('checked')).to.be.true;
        expect(wrapper.find('select').prop('value')).to.equal('1.1');
      });


      it('should show selected engine profile (Camunda Cloud 1.0)', function() {

        // given
        wrapper = renderEngineProfile({
          type: 'form',
          engineProfile: {
            executionPlatform: 'Camunda Cloud',
            executionPlatformVersion: '1.0'
          }
        });

        // when
        wrapper.find('button').simulate('click');

        // then
        expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
        expect(wrapper.find('EngineProfileSelection').exists()).to.be.true;

        expect(wrapper.find('input').filterWhere((item) => item.prop('id') === 'execution-platform-camunda-cloud').prop('checked')).to.be.true;
        expect(wrapper.find('select').prop('value')).to.equal('1.0');
      });

    });


    describe('set engine profile', function() {

      it('should set engine profile (Camunda Platform 7.15)', function() {

        // given
        const setEngineProfileSpy = spy();

        wrapper = renderEngineProfile({
          type: 'form',
          setEngineProfile: setEngineProfileSpy
        });

        wrapper.find('button').simulate('click');

        // when
        wrapper.find('input').filterWhere((item) => item.prop('id') === 'execution-platform-camunda-platform').simulate('click');

        wrapper.find('.apply').simulate('click');

        // then
        expect(setEngineProfileSpy).to.have.been.calledOnce;
        expect(setEngineProfileSpy).to.have.been.calledWith({
          executionPlatform: 'Camunda Platform',
          executionPlatformVersion: '7.15'
        });
      });


      it('should set engine profile (Camunda Cloud 1.1)', function() {

        // given
        const setEngineProfileSpy = spy();

        wrapper = renderEngineProfile({
          type: 'form',
          setEngineProfile: setEngineProfileSpy
        });

        wrapper.find('button').simulate('click');

        // when
        wrapper.find('input').filterWhere((item) => item.prop('id') === 'execution-platform-camunda-cloud').simulate('click');

        wrapper.find('.apply').simulate('click');

        // then
        expect(setEngineProfileSpy).to.have.been.calledOnce;
        expect(setEngineProfileSpy).to.have.been.calledWith({
          executionPlatform: 'Camunda Cloud',
          executionPlatformVersion: '1.1'
        });
      });


      it('should set engine profile (Camunda Cloud 1.0)', function() {

        // given
        const setEngineProfileSpy = spy();

        wrapper = renderEngineProfile({
          type: 'form',
          setEngineProfile: setEngineProfileSpy
        });

        wrapper.find('button').simulate('click');

        // when
        wrapper.find('input').filterWhere((item) => item.prop('id') === 'execution-platform-camunda-cloud').simulate('click');

        wrapper.find('select').simulate('change', { target: { value : '1.0' } });

        wrapper.find('.apply').simulate('click');

        // then
        expect(setEngineProfileSpy).to.have.been.calledOnce;
        expect(setEngineProfileSpy).to.have.been.calledWith({
          executionPlatform: 'Camunda Cloud',
          executionPlatformVersion: '1.0'
        });
      });

    });


    describe('error', function() {

      it('should show error if no engine profile selected', function() {

        // given
        const setEngineProfileSpy = spy();

        wrapper = renderEngineProfile({
          type: 'form',
          setEngineProfile: setEngineProfileSpy
        });

        wrapper.find('button').simulate('click');

        // when
        wrapper.find('.apply').simulate('click');

        // then
        expect(setEngineProfileSpy).not.to.have.been.called;

        expect(wrapper.find('.error').exists()).to.be.true;
      });


      it('should hide error if engine profile selected', function() {

        // given
        const setEngineProfileSpy = spy();

        wrapper = renderEngineProfile({
          type: 'form',
          setEngineProfile: setEngineProfileSpy
        });

        wrapper.find('button').simulate('click');

        wrapper.find('.apply').simulate('click');

        // assume
        expect(setEngineProfileSpy).not.to.have.been.called;

        expect(wrapper.find('.error').exists()).to.be.true;

        // when
        wrapper.find('input').filterWhere((item) => item.prop('id') === 'execution-platform-camunda-platform').simulate('click');

        // then
        expect(wrapper.find('.error').exists()).to.be.false;
      });

    });

  });

});


// helpers //////////

function renderEngineProfile(options = {}) {
  const {
    type,
    engineProfile,
    setEngineProfile
  } = options;

  return mount(
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      <EngineProfile
        type={ type }
        engineProfile={ engineProfile }
        setEngineProfile={ setEngineProfile } />
    </SlotFillRoot>
  );
}
