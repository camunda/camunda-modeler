import {
  fromXML,
  hasNamespaceUrl,
  replaceNamespace,
  replaceNamespacePrefix,
  replaceNamespaceUrl,
  toXML
} from '../namespace';

import activitiXML from './activiti.bpmn';

const NAMESPACE_URL_ACTIVITI = 'http://activiti.org/bpmn',
      NAMESPACE_URL_CAMUNDA = 'http://camunda.org/schema/1.0/bpmn',
      NAMESPACE_PREFIX_ACTIVITI = 'activiti',
      NAMESPACE_PREFIX_CAMUNDA = 'camunda';


describe('namespace', function() {

  describe('#fromXML', function() {

    it('should create { definitions, elements, moddle } from XML', async function() {

      // when
      const {
        definitions,
        elements,
        moddle
      } = await fromXML(activitiXML);

      // then
      expect(definitions).to.exist;
      expect(elements).to.exist;
      expect(moddle).to.exist;
    });

  });


  describe('#toXML', function() {

    it('should create XML from definitions ', async function() {

      // given
      const {
        definitions,
        moddle
      } = await fromXML(activitiXML);

      // when
      const xml = await toXML(definitions, moddle);

      // then
      expect(xml).to.exist;
    });

  });


  describe('#hasNamespaceUrl', function() {

    it('should have namespace URL', async function() {

      // when
      const result = await hasNamespaceUrl(activitiXML, NAMESPACE_URL_ACTIVITI);

      // then
      expect(result).to.be.true;
    });

  });


  describe('#replaceNamespacePrefix', function() {

    it('should replace namespace prefix (activiti -> camunda)', async function() {

      // given
      const {
        definitions,
        elements,
        moddle
      } = await fromXML(activitiXML);

      // when
      replaceNamespacePrefix(definitions, elements, NAMESPACE_PREFIX_ACTIVITI, NAMESPACE_PREFIX_CAMUNDA);

      // then
      const xml = await toXML(definitions, moddle);

      expect(xml.includes('xmlns:activiti="http://activiti.org/bpmn"')).to.be.false;
      expect(xml.includes('xmlns:camunda="http://activiti.org/bpmn"')).to.be.true;

      expect(xml.includes('activiti:assignee')).to.be.false;
      expect(xml.includes('camunda:assignee')).to.be.true;
    });

  });


  describe('#replaceNamespaceUrl', function() {

    it('should replace namespace url (http://activiti.org/bpmn -> http://camunda.org/schema/1.0/bpmn)', async function() {

      // given
      const {
        definitions,
        moddle
      } = await fromXML(activitiXML);

      // when
      replaceNamespaceUrl(definitions, NAMESPACE_URL_ACTIVITI, NAMESPACE_URL_CAMUNDA);

      // then
      const xml = await toXML(definitions, moddle);

      expect(xml.includes('xmlns:activiti="http://activiti.org/bpmn"')).to.be.false;
      expect(xml.includes('xmlns:activiti="http://camunda.org/schema/1.0/bpmn"')).to.be.true;

      expect(xml.includes('targetNamespace="http://activiti.org/bpmn"')).to.be.false;
      expect(xml.includes('targetNamespace="http://camunda.org/schema/1.0/bpmn"')).to.be.true;
    });

  });


  describe('#replaceNamespace', function() {

    it('should replace namespace prefixes and URLs', async function() {

      // when
      const xml = await replaceNamespace(activitiXML, {
        newNamespacePrefix: NAMESPACE_PREFIX_CAMUNDA,
        newNamespaceUrl: NAMESPACE_URL_CAMUNDA,
        oldNamespacePrefix: NAMESPACE_PREFIX_ACTIVITI,
        oldNamespaceUrl: NAMESPACE_URL_ACTIVITI
      });

      // then
      expect(xml.includes('xmlns:activiti="http://activiti.org/bpmn"')).to.be.false;
      expect(xml.includes('xmlns:camunda="http://camunda.org/schema/1.0/bpmn"')).to.be.true;

      expect(xml.includes('targetNamespace="http://activiti.org/bpmn"')).to.be.false;
      expect(xml.includes('targetNamespace="http://camunda.org/schema/1.0/bpmn"')).to.be.true;

      expect(xml.includes('activiti:assignee')).to.be.false;
      expect(xml.includes('camunda:assignee')).to.be.true;
    });

  });

});