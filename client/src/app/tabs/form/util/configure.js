/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Plug-in points for additional form-js modules, by playground option.
 */
const ADDITIONAL_MODULES = [
  [ 'editor', 'editorAdditionalModules' ],
  [ 'viewer', 'viewerAdditionalModules' ]
];

/**
 * Create the options of the form playground, applying
 * registered plug-ins and `form.modeler.configure` middlewares.
 *
 * @param {Function} getPlugins
 * @param {Object} [defaultOptions]
 * @param {Function} [handleMiddlewareExtensions]
 * @param {'cloud'|'platform'} [platformKey]
 *
 * @return {{ options: Object, warnings: Error[] }}
 */
export default function configureEditor(
    getPlugins, defaultOptions = {}, handleMiddlewareExtensions, platformKey
) {

  const warnings = [];

  function logWarning(warning) {

    if (typeof warning === 'string') {
      warning = new Error(warning);
    }

    warnings.push(warning);
  }

  const dynamicMiddlewares = getPlugins('form.modeler.configure').map(fn => {

    return function wrappedMiddleware(options, logWarning) {

      try {
        const newOptions = fn(options, logWarning);

        if (!newOptions) {
          logWarning('form.modeler.configure does not return options');
        }

        return newOptions || options;
      } catch (err) {
        logWarning(err);
      }

      return options;
    };
  });

  function additionalModulesMiddleware(component, optionKey) {

    return function(options) {
      const additionalModules = [
        ...getPlugins(`form.modeler.${component}.additionalModules`),
        ...(platformKey ? getPlugins(`form.${platformKey}.modeler.${component}.additionalModules`) : [])
      ];

      if (additionalModules.length) {
        return {
          ...options,
          [ optionKey ]: [
            ...(options[ optionKey ] || []),
            ...additionalModules
          ]
        };
      }

      return options;
    };
  }

  const middlewares = [
    ...ADDITIONAL_MODULES.map(([ component, optionKey ]) => additionalModulesMiddleware(component, optionKey)),
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
