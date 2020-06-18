/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const TWENTY_FOUR_HOURS_MS = 1000 * 60 * 60 * 24;

// Sends a ping event to ET when it is enabled for the first time
// and once every 24 hours.
export default class PingEventHandler {
  constructor({ onSend }) {
    this.setInterval(() => onSend('ping'));
  }

  setInterval = (func) => {
    setInterval(func, TWENTY_FOUR_HOURS_MS);
  }
}
