/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import * as css from './StartInstanceConfigOverlay.less';

import {
  Overlay,
  TextInput,
  Section
} from '../../../shared/ui';

import {
  Field,
  Formik
} from 'formik';

export default class StartInstanceConfigOverlay extends React.PureComponent {

  onClose = (action = 'cancel', data) => this.props.onClose(action, data);

  onCancel = () => this.onClose('cancel', null);

  onSubmit = (values) => this.onClose('start', values);


  render() {

    const {
      onClose,
      onSubmit
    } = this;

    const {
      configuration: values,
      anchor,
      ref
    } = this.props;

    return (
      <Overlay className={ css.StartInstanceDetailsOverlay } onClose={ onClose } anchor={ anchor } ref={ ref }>
        <Formik
          initialValues={ values }
          onSubmit={ onSubmit }
        >
          { form => (
            <form onSubmit={ form.handleSubmit }>

              <Section>
                <Section.Header>
                  {
                    'Start Process Instance'
                  }
                </Section.Header>

                <Section.Body>

                  <p className="intro">
                    Enter details to start a process instance on Camunda Cloud.
                  </p>

                  <fieldset>
                    <div className="fields">
                      <Field
                        name="variables"
                        component={ TextInput }
                        multiline={ true }
                        label="Variables (optional)"
                        description={ <p>Must be a proper <a href="https://www.w3schools.com/js/js_json_intro.asp">JSON string</a> representing <a href="https://docs.camunda.io/docs/components/concepts/variables/?utm_source=modeler&utm_medium=referral">Zeebe variables</a>.</p> }
                        hint="A JSON string representing the variables the process instance is started with."
                        validate={ (value) => {
                          if (value && value.trim().length > 0) {
                            try {
                              JSON.parse(value);
                            } catch (e) {
                              return 'Variables is not a valid JSON';
                            }
                            return null;
                          }
                        } }
                        spellcheck="false"
                      />
                    </div>
                  </fieldset>

                  <Section.Actions>
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={ form.isSubmitting }>
                      Start
                    </button>
                  </Section.Actions>
                </Section.Body>
              </Section>
            </form>
          )}
        </Formik>
      </Overlay>
    );
  }
}
