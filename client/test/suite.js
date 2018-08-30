import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

var scopedTests = require.context('../src', true, /\/__tests__\/.*Spec\.js$/);

scopedTests.keys().forEach(scopedTests);

var allTests = require.context('.', true, /(spec|integration).*Spec\.js$/);

allTests.keys().forEach(allTests);