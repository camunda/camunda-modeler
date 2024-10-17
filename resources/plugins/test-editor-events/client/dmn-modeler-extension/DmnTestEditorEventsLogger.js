/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function EditorEventsLogger(eventBus) {

  eventBus.on('shape.added', function(event) {
    console.log('[EditorEventsLogger]', 'shape got added', event);
  });

  eventBus.on('col.add', function(event) {
    console.log('[EditorEventsLogger]', 'col got added', event);
  });

  eventBus.on('row.add', function(event) {
    console.log('[EditorEventsLogger]', 'row got added', event);
  });

}

EditorEventsLogger.$inject = [ 'eventBus' ];
