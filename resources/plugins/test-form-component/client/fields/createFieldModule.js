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
 * Create a form-js module that registers a custom form field,
 * based on a built-in form field.
 *
 * Built-in form fields are resolved at runtime via the <formFields> service,
 * so that the plug-in re-uses the very same renderers as the Modeler
 * instead of bundling its own copy of form-js.
 *
 * @param {Object} options
 * @param {string} options.id unique module id
 * @param {string} options.baseType type of the built-in form field
 * @param {string} options.type type of the custom form field
 * @param {string} options.name palette name
 * @param {string} options.label default label
 * @param {Object} [options.appearance] appearance to enforce
 * @param {Object} [options.validate] default validation
 * @param {string[]} options.propertiesPanelEntries
 *
 * @return {Object} form-js module
 */
export default function createFieldModule(options) {
  const {
    id,
    baseType,
    type,
    name,
    label,
    appearance,
    validate,
    propertiesPanelEntries
  } = options;

  function FieldModule(formFields) {
    const Base = formFields.get(baseType);

    function Field(props) {
      const { field } = props;

      return Base({
        ...props,
        field: {
          ...field,
          appearance: {
            ...field.appearance,
            ...appearance
          }
        }
      });
    }

    Field.config = {
      ...Base.config,
      type,
      name,

      // also invoked when importing, saved properties must win over defaults
      create: (options = {}) => Base.config.create({
        label,
        ...(validate && { validate }),
        ...options
      }),
      propertiesPanelEntries
    };

    formFields.register(type, Field);
  }

  FieldModule.$inject = [ 'formFields' ];

  return {
    __init__: [ id ],
    [ id ]: [ 'type', FieldModule ]
  };
}
