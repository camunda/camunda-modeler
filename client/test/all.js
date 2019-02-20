/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

var scopedTests = require.context('../src', true, /\/__tests__\/.*Spec\.js$/);

scopedTests.keys().forEach(scopedTests);

var allTests = require.context('.', true, /(spec|integration).*Spec\.js$/);

allTests.keys().forEach(allTests);

// we exclude remote stubs + utilities during coverage
// reporting to not distort the resulting report
var allSources = require.context('../src/app', true, /\.js$/);

allSources.keys().forEach(allSources);