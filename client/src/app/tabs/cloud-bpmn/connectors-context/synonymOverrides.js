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
 * Synonym overrides for marketplace element templates.
 *
 * Background — the auto-fetched marketplace bundle
 * (`<userPath>/resources/element-templates/.camunda-connector-templates.json`)
 * ships ~459 connector templates. Of those, only ~69 carry curated
 * `metadata.keywords`; the other 390 rely on name-match alone. That breaks
 * the "send message" demo: typing it surfaces nothing because no Slack /
 * Kafka / Twilio template has those words in its keywords.
 *
 * Rather than fork the marketplace bundle (and lose updates) or duplicate
 * templates locally (and inflate the catalog), we layer a small per-id
 * override map at index build time. Adding synonym coverage to any of the
 * 459 marketplace templates becomes a one-line addition here.
 *
 * Keys MUST match marketplace template ids exactly. Values are flat
 * keyword/synonym strings the Synonym Index will fold into the search
 * corpus alongside name + description.
 */
export const SYNONYM_OVERRIDES = {

  // Slack outbound — empty `metadata.keywords` upstream. Cover the common
  // intents used in IDM demos: notify, send message, post, etc.
  'io.camunda.connectors.Slack.v1': [
    'send message',
    'post message',
    'channel message',
    'notify channel',
    'notify slack',
    'slack notification',
    'send to channel',
    'chat message',
    'slack alert',
    'slack update',
    'dm',
    'direct message',
    'team notification'
  ],

  // Kafka producer — covers the "send message" demo fan-out.
  'io.camunda.connectors.KAFKA.v1': [
    'send message',
    'produce',
    'publish event',
    'kafka producer',
    'queue message',
    'event stream',
    'stream message'
  ],

  // Twilio (SMS / messaging).
  'io.camunda.connectors.Twilio.v1': [
    'send sms',
    'send message',
    'text message',
    'sms notification',
    'phone notification',
    'twilio'
  ],

  // GitHub — issue + release flows are the common modeling intents.
  'io.camunda.connectors.GitHub.v1': [
    'create issue',
    'open issue',
    'file issue',
    'github issue',
    'cut release',
    'publish release',
    'tag release',
    'manage repository'
  ],

  // Generic REST connector — hits a lot of "call API" intents.
  'io.camunda.http-json.v1': [
    'call api',
    'http request',
    'rest call',
    'webhook call',
    'invoke endpoint',
    'fetch data',
    'post json'
  ],

  // Microsoft Teams — same "notify channel" family as Slack.
  'io.camunda.connectors.MSTeams.v1': [
    'send message',
    'post in channel',
    'teams notification',
    'notify team',
    'team chat',
    'microsoft teams alert'
  ],

  // SendGrid — email sending.
  'io.camunda.connectors.SendGrid.v2': [
    'send email',
    'email notification',
    'transactional email',
    'mail'
  ]
};
