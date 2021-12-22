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

import css from './StartInstanceConfigOverlay.less';

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
      title,
      anchor,
      ref,height
    } = this.props;

    return (
      <Overlay className={ css.StartInstanceDetailsOverlay } onClose={ onClose } anchor={ anchor } ref={ ref }>
        <Formik
          initialValues={ values }
          onSubmit={ onSubmit }
        >
          { form => (
            <form onSubmit={ form.handleSubmit } style={ { height: height } }>

              <Section>
                <Section.Header>
                  {
                    title || 'Start Process Instance'
                  }
                </Section.Header>

                <Section.Body>
                  <p className="intro">
                    Enter details to start a process instance on Camunda Platform. Alternatively, you can start a process instance <a href="https://docs.camunda.org/get-started/quick-start/deploy/#start-a-process-instance">via a Rest Client</a>.
                  </p>

                  <fieldset>
                    <div className="fields">
                      <Field
                        name="businessKey"
                        component={ TextInput }
                        label="Business Key"
                        hint="A business key is a domain-specific identifier of a process instance."
                        autoFocus
                      />
                      <Field
                        name="variables"
                        component={ TextInput }
                        multiline={ true }
                        label="Variables (optional)"
                        description={ <p>Must be a proper JSON object. <a href="https://docs.camunda.io/docs/components/concepts/variables/">Learn more about variables</a>.</p> }
                        hint="A JSON object containing the variables the process is to be initialized with."
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
