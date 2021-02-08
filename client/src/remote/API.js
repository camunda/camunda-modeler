/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class API {

  constructor(backend) {
    this.backend = backend;
  }

  /**
   * Return the results of a long-running task performed in the client to the REST API
   *
   * @param targetRoute the route of the request the result belongs to
   * @param id the id identifying the request the result belongs to uniquely
   * @param args the result
   */
  sendResult(targetRoute, id, args) {
    console.log('Sending result for API request at route: ' + targetRoute);
    return this.backend.send('api:add-result', targetRoute, id, args);
  }
}
