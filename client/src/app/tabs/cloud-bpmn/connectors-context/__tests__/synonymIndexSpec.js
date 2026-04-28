/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  buildSynonymIndex,
  normalize
} from '../synonymIndex';


describe('connectors-context/synonymIndex', function() {

  describe('normalize', function() {

    it('lowercases and collapses non-alphanumeric runs', function() {
      expect(normalize('Send_Message To Channel!')).to.equal('send message to channel');
    });


    it('handles null and undefined safely', function() {
      expect(normalize(null)).to.equal('');
      expect(normalize(undefined)).to.equal('');
    });


    it('strips leading and trailing whitespace', function() {
      expect(normalize('  hello world  ')).to.equal('hello world');
    });

  });


  describe('buildSynonymIndex', function() {

    it('indexes top-level keywords (the surface used by the PRD templates)', function() {

      // given
      const templates = [
        {
          id: 'io.camunda.connectors.Slack.v1',
          name: 'Slack Connector',
          keywords: [ 'send message', 'post message', 'channel message' ]
        }
      ];

      // when
      const index = buildSynonymIndex(templates);

      // then
      expect(index.entries.length).to.be.greaterThan(0);
      expect(index.templateMatchesQuery('io.camunda.connectors.Slack.v1', 'send message')).to.be.true;
      expect(index.templateMatchesQuery('io.camunda.connectors.Slack.v1', 'send_message')).to.be.true;
      expect(index.templateMatchesQuery('io.camunda.connectors.Slack.v1', 'unrelated phrase')).to.be.false;
    });


    it('indexes per-operation synonyms when present', function() {

      // given
      const templates = [
        {
          id: 'io.camunda.connectors.GitHub.v1',
          name: 'GitHub Connector',
          synonyms: {
            'issues create_issue': [ 'create issue', 'open issue', 'file issue' ],
            'releases create_release': [ 'cut release', 'publish release' ]
          }
        }
      ];

      // when
      const index = buildSynonymIndex(templates);

      // then
      expect(index.templateMatchesQuery('io.camunda.connectors.GitHub.v1', 'open issue')).to.be.true;
      expect(index.templateMatchesQuery('io.camunda.connectors.GitHub.v1', 'cut release')).to.be.true;

      const matches = index.findMatches('cut release');
      expect(matches[0].source).to.equal('synonym');
      expect(matches[0].operationKey).to.equal('releases create_release');
    });


    it('surfaces multiple connectors for a shared phrase (the demo case)', function() {

      // given — three templates with overlapping "send message" semantics
      const templates = [
        {
          id: 'io.camunda.connectors.Slack.v1',
          name: 'Slack',
          keywords: [ 'send message', 'chat' ]
        },
        {
          id: 'io.camunda.connectors.Kafka.v1',
          name: 'Kafka',
          keywords: [ 'produce', 'send message', 'publish event' ]
        },
        {
          id: 'io.camunda.connectors.Twilio.v1',
          name: 'Twilio',
          keywords: [ 'send sms', 'send message' ]
        },
        {
          id: 'io.camunda.connectors.Salesforce.v1',
          name: 'Salesforce',
          keywords: [ 'create record', 'update opportunity' ]
        }
      ];

      // when
      const index = buildSynonymIndex(templates);
      const matches = index.findMatches('send message');
      const matchedIds = new Set(matches.map(m => m.templateId));

      // then — all three message-capable connectors surface; Salesforce does not
      expect(matchedIds.has('io.camunda.connectors.Slack.v1')).to.be.true;
      expect(matchedIds.has('io.camunda.connectors.Kafka.v1')).to.be.true;
      expect(matchedIds.has('io.camunda.connectors.Twilio.v1')).to.be.true;
      expect(matchedIds.has('io.camunda.connectors.Salesforce.v1')).to.be.false;
    });


    it('matches via name and description as a fallback', function() {

      // given — a template with NO keywords or synonyms (regression for our
      // 4 PRD templates if any of them ship without curated keywords)
      const templates = [
        {
          id: 'io.camunda.connectors.Bare.v1',
          name: 'Slack Outbound',
          description: 'Post a message to Slack'
        }
      ];

      // when
      const index = buildSynonymIndex(templates);

      // then
      expect(index.templateMatchesQuery('io.camunda.connectors.Bare.v1', 'slack')).to.be.true;
      expect(index.templateMatchesQuery('io.camunda.connectors.Bare.v1', 'post a message')).to.be.true;
    });


    it('ignores malformed templates without crashing', function() {

      // given
      const templates = [
        null,
        undefined,
        {},
        { id: null },
        { id: 'io.camunda.connectors.OK.v1', name: 'OK', keywords: [ 'good' ] }
      ];

      // when
      const index = buildSynonymIndex(templates);

      // then
      expect(index.templateMatchesQuery('io.camunda.connectors.OK.v1', 'good')).to.be.true;
      expect(index.entries.every(e => e.templateId === 'io.camunda.connectors.OK.v1')).to.be.true;
    });


    it('returns empty results for empty queries', function() {

      // given
      const index = buildSynonymIndex([
        { id: 'x', keywords: [ 'foo' ] }
      ]);

      // then
      expect(index.findMatches('')).to.eql([]);
      expect(index.templateMatchesQuery('x', '')).to.be.false;
    });

  });

});
