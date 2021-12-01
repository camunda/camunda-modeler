/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  isArray,
  isNil,
  isString,
} from 'min-dash';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

import { toSemverMinor } from '../../../EngineProfile';

export function createRule(version, checks) {
  return () => {
    return {
      check: (node, reporter) => {

        // do not lint properties (yet)
        if (!isAny(node, [ 'bpmn:FlowElement', 'bpmn:FlowElementsContainer' ])) {
          return;
        }

        const engineProfile = getEngineProfile(node);

        if (!engineProfile) {
          return;
        }

        const {
          executionPlatform,
          executionPlatformVersion
        } = engineProfile;

        if (!executionPlatformVersion || toSemverMinor(executionPlatformVersion) !== version) {
          return;
        }

        const result = checkNode(node, checks);

        if (result === false) {
          reporter.report(node.get('id'), `Element of type <${ node.$type }> not supported by ${ executionPlatform } ${ toSemverMinor(executionPlatformVersion) }`);
        }

        if (isString(result)) {
          reporter.report(node.get('id'), `Element of type <${ result }> not supported by ${ executionPlatform } ${ toSemverMinor(executionPlatformVersion) }`);
        }
      }
    };
  };
}

function getDefinitions(node) {
  if (is(node, 'bpmn:Definitions')) {
    return node;
  }

  const parent = node.$parent;

  if (!parent) {
    return null;
  }

  return getDefinitions(parent);
}

function getEngineProfile(node) {
  const definitions = getDefinitions(node);

  if (!definitions) {
    return null;
  }

  const executionPlatform = definitions.get('modeler:executionPlatform'),
        executionPlatformVersion = definitions.get('modeler:executionPlatformVersion');

  if (!executionPlatform) {
    return null;
  }

  return {
    executionPlatform,
    executionPlatformVersion
  };
}

/**
 * @param {ModdleElement} node
 * @param {Array<Function>} checks
 *
 * @returns boolean|String
 */
export function checkNode(node, checks) {
  return checks.reduce((previousResult, check) => {
    if (previousResult === true) {
      return previousResult;
    }

    // (1) check using type only
    if (isString(check)) {
      return is(node, check) || previousResult;
    }

    const { type } = check;

    // (2) check using function only
    if (!type) {
      return check.check(node) || previousResult;
    }

    // (3) check using type and function
    if (!is(node, type)) {
      return previousResult;
    }

    return check.check(node) || previousResult;
  }, false);
}

/**
 * If every check returns true return true.
 * Otherwise return the first false or string returned by a check.
 *
 * @param  {Array<Function>} checks
 *
 * @returns boolean|String
 */
export function checkEvery(...checks) {
  return function(node) {
    return checks.reduce((previousResult, check) => {
      if (!isNil(previousResult) && previousResult !== true) {
        return previousResult;
      }

      const result = check(node);

      return result;
    }, null);
  };
}

/**
 * If some check returns true return true.
 * Otherwise return the first false or string returned by a check.
 *
 * @param  {Array<Function>} checks
 *
 * @returns boolean|String
 */
export function checkSome(...checks) {
  return function(node) {
    return checks.reduce((previousResult, check) => {
      if (previousResult === true) {
        return previousResult;
      }

      const result = check(node);

      if (isNil(previousResult) || result === true) {
        return result;
      }

      return previousResult;
    }, null);
  };
}

export function hasEventDefinition(node) {
  const eventDefinitions = node.get('eventDefinitions');

  return eventDefinitions && eventDefinitions.length === 1;
}

export function hasNoEventDefinition(node) {
  const eventDefinitions = node.get('eventDefinitions');

  return !eventDefinitions || !eventDefinitions.length || `${ node.$type} (${ eventDefinitions[ 0 ].$type })`;
}

export function hasEventDefinitionOfType(types) {
  return function(node) {
    if (!isArray(types)) {
      types = [ types ];
    }

    const eventDefinitions = node.get('eventDefinitions');

    if (!eventDefinitions || eventDefinitions.length !== 1) {
      return false;
    }

    const eventDefinition = eventDefinitions[ 0 ];

    return isAny(eventDefinition, types) || `${ node.$type} (${ eventDefinition.$type })`;
  };
}

export function hasLoopCharacteristics(node) {
  const loopCharacteristics = node.get('loopCharacteristics');

  return !!loopCharacteristics;
}

export function hasNoLoopCharacteristics(node) {
  const loopCharacteristics = node.get('loopCharacteristics');

  return !loopCharacteristics || `${ node.$type} (${ loopCharacteristics.$type })`;
}

export function hasLoopCharacteristicsOfType(type) {
  return function(node) {
    const loopCharacteristics = node.get('loopCharacteristics');

    if (!loopCharacteristics) {
      return false;
    }

    return is(loopCharacteristics, type) || `${ node.$type} (${ loopCharacteristics.$type })`;
  };
}

export function isNotBpmn(node) {
  const { $descriptor: descriptor } = node;

  const { ns } = descriptor;

  const { prefix } = ns;

  return prefix !== 'bpmn';
}