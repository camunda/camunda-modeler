/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function configureModeler(getPlugins, defaultOptions = {}) {

  const warnings = [];

  function logWarning(warning) {

    if (typeof warning === 'string') {
      warning = new Error(warning);
    }

    warnings.push(warning);
  }

  function additionalModulesMiddleware(component) {

    return function(options) {
      const additionalModules = getPlugins(`dmn.modeler.${component}.additionalModules`);

      if (additionalModules.length) {
        return {
          ...options,
          [component]: {
            ...options[component],
            additionalModules: [
              ...((options[component] || {}).additionalModules || []),
              ...additionalModules
            ]
          }
        };
      }

      return options;
    };
  }

  const middlewares = [

    function moddleExtensionsMiddleware(options, logWarning) {
      const plugins = getPlugins('dmn.modeler.moddleExtension');

      const moddleExtensions = plugins.reduce((extensions, extension) => {
        let {
          name
        } = extension;

        if (typeof name !== 'string') {
          logWarning('dmn.modeler.moddleExtension is missing <name> property');

          return extensions;
        }

        extensions = extensions || {};

        if (name in extensions) {
          logWarning('dmn.modeler.moddleExtension overrides moddle extension with name <' + name + '>');
        }

        return {
          ...extensions,
          [ name ]: extension
        };
      }, options.moddleExtensions);

      if (moddleExtensions) {
        return {
          ...options,
          moddleExtensions
        };
      }

      return options;
    },

    additionalModulesMiddleware('drd'),
    additionalModulesMiddleware('decisionTable'),
    additionalModulesMiddleware('literalExpression')
  ];

  let options = {
    ...defaultOptions
  };

  middlewares.forEach(fn => {
    options = fn(options, logWarning);
  });

  return {
    options,
    warnings
  };
}
