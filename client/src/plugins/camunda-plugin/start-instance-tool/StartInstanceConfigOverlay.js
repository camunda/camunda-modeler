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

import { utmTag } from '../../../util/utmTag';


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
      ref,
      height
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
                    Enter details to start a process instance on Camunda Platform. Alternatively, you can start a process instance <a href={ utmTag('https://docs.camunda.org/manual/latest/reference/rest/process-definition/post-start-process-instance/#request') }>via a Rest Client</a>.
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
                        description={ <p>Must be a proper <a href="https://www.w3schools.com/js/js_json_intro.asp">JSON string</a> representing <a href={ utmTag('https://docs.camunda.org/manual/latest/reference/rest/process-definition/post-start-process-instance/#starting-a-process-instance-at-its-default-initial-activity') }>process instance variables</a>.</p> }
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
