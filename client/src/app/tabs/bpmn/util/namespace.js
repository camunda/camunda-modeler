import BpmnModdle from 'bpmn-moddle';

import {
  find,
  forEach
} from 'min-dash';


function isNamespaceAttr(attr) {
  return attr.includes('xmlns:');
}

function getPrefix(attr) {
  const [ prefix, name ] = attr.split(':');

  // if name doesn't exist attr has no prefix
  return name && prefix;
}

function getName(attr) {
  const [ prefix, name ] = attr.split(':');

  // if name doesn't exist attr has no prefix
  return name || prefix;
}

/**
 * Create { definitions, elements, moddle } from XML string.
 *
 * @param {String} XML - XML string or object with definitions and elements.
 *
 * @return {Promise}
 */
export async function fromXML(xml) {
  return new Promise((resolve, reject) => {

    let moddle = new BpmnModdle();

    moddle.fromXML(xml, 'bpmn:Definitions', (err, definitions, context) => {
      if (err) {
        reject(err);
      }

      const { elementsById } = context;

      resolve({
        elements: elementsById,
        definitions,
        moddle
      });
    });

  });
}

/**
 * Create XML from definitions.
 *
 * @param {Object} definitions - Definitions.
 * @param {Object} moddle - BpmnModdle instance.
 *
 * @returns {Promise}
 */
export async function toXML(definitions, moddle) {
  return new Promise((resolve, reject) => {
    moddle.toXML(definitions, { format: true }, (err, xml) => {
      if (err) {
        reject(err);
      }

      resolve(xml);
    });
  });
}

/**
 * Returns true if either
 * targetNamespace="namespace" or
 * xmlns:prefix="namespace".
 *
 * @param {String} xml - XML string.
 * @param {String} namespaceUrl - Namespace URL.
 *
 * @param {Promise}
 */
export async function hasNamespaceUrl(xml, namespaceUrl) {
  const { definitions } = await fromXML(xml);

  return new Promise(resolve => {

    if (definitions.get('targetNamespace') === namespaceUrl) {
      resolve(true);
    }

    const found = find(definitions.$attrs, (value, attr) => {
      return isNamespaceAttr(attr) && value === namespaceUrl;
    });

    resolve(!!found);

  });
}

/**
 * Replaces all namespace prefixes.
 *
 * @param {String} definitions - Definitions.
 * @param {Array|Object} elements - Collection of all elements.
 * @param {String} oldNamespacePrefix - Old namespace prefix.
 * @param {String} newNamespacePrefix - New namespace prefix.
 */
export function replaceNamespacePrefix(definitions, elements, oldNamespacePrefix, newNamespacePrefix) {
  forEach(definitions.$attrs, (value, attr) => {

    const prefix = getPrefix(attr),
          name = getName(attr);

    if (name && name === oldNamespacePrefix) {

      // delete attr with old prefix
      delete definitions.$attrs[ attr ];

      // add attr with new prefix
      definitions.$attrs[ `${ prefix }:${ newNamespacePrefix }` ] = value;
    }

  });

  forEach(elements, element => {

    forEach(element.$attrs, (value, attr) => {
      const prefix = getPrefix(attr),
            name = getName(attr);

      if (prefix && prefix === oldNamespacePrefix) {

        // delete attr with old prefix
        delete element.$attrs[ attr ];

        // add attr with new prefix
        element.$attrs[ `${ newNamespacePrefix }:${ name }` ] = value;
      }
    });

  });
}

/**
 * Replaces all namespace URLs.
 *
 * @param {Object} definitions - Definitions.
 * @param {String} oldNamespaceUrl - Old namespace URL.
 * @param {String} newNamespaceUrl - New namespace URL.
 */
export function replaceNamespaceUrl(definitions, oldNamespaceUrl, newNamespaceUrl) {
  if (definitions.get('targetNamespace') === oldNamespaceUrl) {
    definitions.set('targetNamespace', newNamespaceUrl);
  }

  forEach(definitions.$attrs, (value, attr) => {
    if (value === oldNamespaceUrl) {
      definitions.$attrs[ attr ] = newNamespaceUrl;
    }
  });
}

/**
 * Replaces all namespace prefixes and URLs.
 *
 * @param {String} xml - XML string.
 * @param {Object} options - Options.
 * @param {String} [options.oldNamespaceUrl] - Old namespace URL.
 * @param {String} [options.newNamespaceUrl] - New namespace URL.
 * @param {String} [options.oldNamespacePrefix] - Old namespace prefix.
 * @param {String} [options.newNamespacePrefix] - New namespace prefix.
 *
 * @returns {Promise}
 */
export async function replaceNamespace(xml, options) {
  const {
    newNamespacePrefix,
    newNamespaceUrl,
    oldNamespacePrefix,
    oldNamespaceUrl
  } = options;

  const {
    definitions,
    elements,
    moddle
  } = await fromXML(xml);

  if (oldNamespacePrefix && newNamespacePrefix) {
    replaceNamespacePrefix(definitions, elements, oldNamespacePrefix, newNamespacePrefix);
  }

  if (oldNamespaceUrl && newNamespaceUrl) {
    replaceNamespaceUrl(definitions, oldNamespaceUrl, newNamespaceUrl);
  }

  return toXML(definitions, moddle);
}