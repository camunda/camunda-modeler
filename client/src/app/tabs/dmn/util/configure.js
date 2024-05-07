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
    getPlugins, defaultOptions = {}, handleMiddlewareExtensions, platformKey
) {

  const warnings = [];

  function logWarning(warning) {

    if (typeof warning === 'string') {
      warning = new Error(warning);
    }

    warnings.push(warning);
  }

  const dynamicMiddlewares = getPlugins('dmn.modeler.configure').map(fn => {

    return function wrappedMiddleware(options, logWarning) {

      try {
        const newOptions = fn(options, logWarning);

        if (!newOptions) {
          logWarning('dmn.modeler.configure does not return options');
        }

        return newOptions || options;
      } catch (err) {
        logWarning(err);
      }

      return options;
    };
  });

  function moddleExtensionsMiddleware(options, logWarning) {
    let registeredModdleExtensions = getPlugins('dmn.modeler.moddleExtension');

    if (platformKey) {
      registeredModdleExtensions = registeredModdleExtensions.concat(getPlugins(`dmn.${platformKey}.modeler.moddleExtension`));
    }

    const moddleExtensions = registeredModdleExtensions.reduce((extensions, extension) => {
      let {
        name
      } = extension;

      if (typeof name !== 'string') {
        logWarning('A dmn moddle extension plugin is missing a <name> property');

        return extensions;
      }

      extensions = extensions || {};

      if (name in extensions) {
        logWarning(`A dmn moddle extension with name <${name}> was overriden due to a clash`);
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
  }

  function additionalModulesMiddleware(component) {

    return function(options) {
      const additionalModules = [
        ...getPlugins(`dmn.modeler.${component}.additionalModules`),
        ...(platformKey ? getPlugins(`dmn.${platformKey}.modeler.${component}.additionalModules`) : [])
      ];

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
    moddleExtensionsMiddleware,
    additionalModulesMiddleware('boxedExpression'),
    additionalModulesMiddleware('drd'),
    additionalModulesMiddleware('decisionTable'),
    additionalModulesMiddleware('literalExpression'),
    ...dynamicMiddlewares
  ];

  let options = {
    ...defaultOptions
  };

  if (typeof handleMiddlewareExtensions === 'function') {
    handleMiddlewareExtensions(middlewares);
  }

  middlewares.forEach(fn => {
    options = fn(options, logWarning);
  });

  return {
    options,
    warnings
  };
}
