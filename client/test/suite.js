/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

var scopedTests = require.context('../src', true, /\/__tests__\/[a-zA-Z]+Spec\.js$/);

scopedTests.keys().forEach(scopedTests);

var allTests = require.context('.', true, /(spec|integration)[a-zA-Z]+Spec\.js$/);

allTests.keys().forEach(allTests);