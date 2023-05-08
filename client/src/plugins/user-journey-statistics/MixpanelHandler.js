/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import mixpanel from 'mixpanel-browser';
import Metadata from '../../util/Metadata';

export default class MixpanelHandler {

  constructor() {
    this.enabled = false;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new MixpanelHandler();
    }

    return this.instance;
  }

  isEnabled() {
    return this.enabled;
  }

  track(name, props) {
    if (this.enabled) {
      return mixpanel.track(`desktopModeler:${name}`, props);
    }
  }

  enable(token, id, stage) {
    const debug = stage === 'prod' ? false : true;

    mixpanel.init(token, {
      property_blacklist: [ '$current_url' ],
      debug
    });

    mixpanel.identify(id);

    mixpanel.register(getCommonProps(stage));

    this.verifyOptIn();

    this.enabled = true;
  }

  disable() {
    if (this.enabled) {
      mixpanel.opt_out_tracking();
    }

    this.enabled = false;
  }

  verifyOptIn() {
    if (!mixpanel.has_opted_in_tracking()) {
      mixpanel.opt_in_tracking();
    }
  }
}


// helper

const getCommonProps = (stage) => {
  const version = Metadata.data.version;

  return {
    stage,
    version
  };
};
