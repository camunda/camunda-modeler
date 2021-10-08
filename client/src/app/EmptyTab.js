/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import CloudIcon from '../../resources/icons/Platform.svg';
import PlatformIcon from '../../resources/icons/Cloud.svg';
import BPMNIcon from '../../resources/icons/file-types/BPMN.svg';
import DMNIcon from '../../resources/icons/file-types/DMN.svg';
import FormIcon from '../../resources/icons/file-types/Form.svg';

import css from './EmptyTab.less';

import {
  Tab
} from './primitives';

import Flags, { DISABLE_DMN, DISABLE_FORM, DISABLE_ZEEBE } from '../util/Flags';


export default class EmptyTab extends PureComponent {

  componentDidMount() {
    this.props.onShown();
  }

  triggerAction() {}

  renderDiagramButton = (action, title, icon) => {

    const {
      onAction
    } = this.props;

    return (
      <button className="btn btn-secondary" onClick={ () => onAction(action) }>
        {icon}
        {title}
      </button>
    );
  }

  renderCloudColumn = () => {

    return (
      <div className="create-buttons">

        <PlatformIcon className="engineIcon" />

        <span className="engine">Camunda Cloud</span>
        <p>Create a new file</p>

        {this.renderDiagramButton('create-cloud-bpmn-diagram', 'BPMN diagram', <BPMNIcon />)}
        {
          !Flags.get(DISABLE_FORM) && (
            this.renderDiagramButton('create-form', 'Form', <FormIcon />)
          )
        }
      </div>
    );
  }

  renderPlatformColumn = () => {

    return (
      <div className="create-buttons">

        <CloudIcon className="engineIcon" />

        <span className="engine">Camunda Platform</span>
        <p>Create a new file</p>

        {this.renderDiagramButton('create-bpmn-diagram', 'BPMN diagram', <BPMNIcon />)}
        {
          !Flags.get(DISABLE_DMN) && (
            this.renderDiagramButton('create-dmn-diagram', 'DMN diagram', <DMNIcon />)
          )
        }
        {
          !Flags.get(DISABLE_FORM) && (
            this.renderDiagramButton('create-form', 'Form', <FormIcon />)
          )
        }
      </div>
    );
  }

  render() {

    return (
      <Tab className={ css.EmptyTab }>
        {this.renderPlatformColumn()}

        {
          !Flags.get(DISABLE_ZEEBE) && (
            this.renderCloudColumn()
          )
        }
      </Tab>
    );
  }
}
