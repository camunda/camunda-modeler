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

  function moddleExtensionsMiddleware(options, logWarning) {

    var registeredModdleExtensions = getPlugins('bpmn.modeler.moddleExtension');

    if (platformKey) {
      registeredModdleExtensions = registeredModdleExtensions.concat(getPlugins('bpmn.' + platformKey + '.modeler.moddleExtension'));
    }

    const moddleExtensions = registeredModdleExtensions.reduce((extensions, extension) => {
      let {
        name
      } = extension;

      if (typeof name !== 'string') {
        logWarning('A bpmn moddle extension plugin is missing a <name> property');

        return extensions;
      }

      extensions = extensions || {};

      if (name in extensions) {
        logWarning('A bpmn moddle extension with name <' + name + '> was overriden due to a clash');
      }

      return {
        ...extensions,
        [name]: extension
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

  function additionalModulesMiddleware(options) {

    const additionalModules = [
      ...getPlugins('bpmn.modeler.additionalModules'),
      ...(platformKey ? getPlugins('bpmn.' + platformKey + '.modeler.additionalModules') : [])
    ];

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
  }

  const middlewares = [
    additionalModulesMiddleware,
    moddleExtensionsMiddleware,
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
