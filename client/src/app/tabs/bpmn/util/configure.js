/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function configureModeler(
    getPlugins, defaultOptions = {}, handleMiddlewareExtensions
) {

  const warnings = [];

  function logWarning(warning) {

    if (typeof warning === 'string') {
      warning = new Error(warning);
    }

    warnings.push(warning);
  }

  const dynamicMiddlewares = getPlugins('bpmn.modeler.configure').map(fn => {

    return function wrappedMiddleware(options, logWarning) {

      try {
        const newOptions = fn(options, logWarning);

        if (!newOptions) {
          logWarning('bpmn.modeler.configure does not return options');
        }

        return newOptions || options;
      } catch (err) {
        logWarning(err);
      }

      return options;
    };
  });

  const middlewares = [

    function moddleExtensionsMiddleware(options, logWarning) {
      const plugins = getPlugins('bpmn.modeler.moddleExtension');

      const moddleExtensions = plugins.reduce((extensions, extension) => {
        let {
          name
        } = extension;

        if (typeof name !== 'string') {
          logWarning('bpmn.modeler.moddleExtension is missing <name> property');

          return extensions;
        }

        extensions = extensions || {};

        if (name in extensions) {
          logWarning('bpmn.modeler.moddleExtension overrides moddle extension with name <' + name + '>');
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

    function additionalModulesMiddleware(options) {
      const additionalModules = getPlugins('bpmn.modeler.additionalModules');

      if (additionalModules.length) {
        return {
          ...options,
          additionalModules: [
            ...(options.additionalModules || []),
            ...additionalModules
          ]
        };
      }

      return options;
    },

    ...dynamicMiddlewares
  ];

  if (typeof handleMiddlewareExtensions === 'function') {
    handleMiddlewareExtensions(middlewares);
  }

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
