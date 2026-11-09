/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  resolveProjectResources,
  selectResources
} = require('..');

const FIXTURE_SETS = [

  // shared with c8ctl, copied verbatim from c8ctl `tests/fixtures/deploy-resources-parity`
  'deploy-resources-parity',

  // additional Desktop Modeler cases, same format
  'deploy-resources-modeler'
];

const CASE_FILES = [ 'files.txt', 'expected.json' ];


/**
 * Acceptance criterion: "The same configured project resolves to the same
 * resource set in Desktop Modeler and c8ctl, verified with shared fixtures
 * covering defaults, negation, ordered overrides, hidden files, and descendant
 * re-inclusion."
 */
describe('project-resources - parity fixtures', function() {

  let tmpPath;

  beforeEach(function() {
    tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-resources-parity-'));
  });

  afterEach(function() {
    fs.rmSync(tmpPath, { recursive: true, force: true });
  });


  for (const fixtureSet of FIXTURE_SETS) {

    const fixtureSetPath = path.join(__dirname, 'fixtures', fixtureSet);

    const cases = fs.readdirSync(fixtureSetPath)
      .filter(name => fs.statSync(path.join(fixtureSetPath, name)).isDirectory())
      .sort();

    describe(fixtureSet, function() {

      it('should cover defaults, negation, ordered overrides, hidden files and descendant re-inclusion', function() {
        expect(cases).not.to.be.empty;

        if (fixtureSet === 'deploy-resources-parity') {
          expect(cases).to.include.members([
            'worked-example',
            'defaults-excluded',
            'defaults-overridden-by-matching-pattern',
            'negation',
            'ordered-overrides',
            'hidden-files',
            'hidden-directories',
            'descendant-reinclusion',
            'absent-field-default-scan',
            'absent-field-c8ignore'
          ]);
        }
      });


      for (const name of cases) {

        const casePath = path.join(fixtureSetPath, name);

        const { expected } = readCase(casePath);

        describe(name, function() {

          it(`should resolve from file system${ expected.description ? ` (${ expected.description })` : '' }`, async function() {

            // given
            const projectFilePath = createProject(casePath, tmpPath);

            // when
            const resources = await resolveProjectResources(projectFilePath);

            // then
            expectResolution(resources, expected, tmpPath);
          });


          it('should resolve from file list', function() {

            // given
            const { descriptor, c8ignore, files } = readCase(casePath);

            // assume
            // invalid JSON, a descriptor with byte order mark (decoded when
            // read from disk) or an unreadable `.c8ignore` (a directory) can
            // not be expressed as a file list, covered by file system resolution
            if (
              descriptor === undefined ||
              (!('deployResources' in descriptor) && files.some(file => file.startsWith('.c8ignore/')))
            ) {
              return this.skip();
            }

            // when
            const resources = selectResources([ ...files, 'camunda.json' ], descriptor, c8ignore);

            // then
            expectResolution(resources, expected);
          });

        });
      }

    });
  }

});


// helpers //////////

function readCase(casePath) {
  const files = fs.readFileSync(path.join(casePath, 'files.txt'), 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const literalFiles = listFiles(casePath).filter(file => !CASE_FILES.includes(file));

  if (!literalFiles.includes('camunda.json')) {
    literalFiles.push('camunda.json');
  }

  let descriptor;

  try {
    descriptor = JSON.parse(readFileOr(path.join(casePath, 'camunda.json'), '{}'));
  } catch (error) {
    descriptor = undefined;
  }

  const c8ignore = readFileOr(path.join(casePath, '.c8ignore'), null);

  const expected = JSON.parse(fs.readFileSync(path.join(casePath, 'expected.json'), 'utf8'));

  return {
    c8ignore,
    descriptor,
    expected,
    files: [ ...files, ...literalFiles.filter(file => file !== 'camunda.json') ],
    literalFiles
  };
}

/**
 * Build the project of a case as described in the parity fixtures README.
 *
 * @return {string} path of the project file
 */
function createProject(casePath, projectPath) {
  const { files, literalFiles } = readCase(casePath);

  // copy literal files byte for byte, e.g. a `camunda.json` with byte order mark
  for (const file of literalFiles) {
    const sourcePath = path.join(casePath, ...file.split('/'));

    writeFile(path.join(projectPath, ...file.split('/')), fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath) : '{}');
  }

  for (const file of files.filter(file => !literalFiles.includes(file))) {
    writeFile(path.join(projectPath, ...file.split('/')), '');
  }

  return path.join(projectPath, 'camunda.json');
}

function expectResolution(resources, expected, projectPath) {
  if (expected.error) {
    expect(resources.error, 'error').to.exist;
    expect(resources.errorType).to.eql(expected.error);
    expect(resources.selected).to.be.empty;

    return;
  }

  expect(resources.error).not.to.exist;

  const selected = projectPath
    ? resources.selected.map(filePath => path.relative(projectPath, filePath).split(path.sep).join('/'))
    : resources.selected;

  expect([ ...selected ].sort()).to.eql([ ...expected.selected ].sort());
}

function listFiles(directoryPath, prefix = '') {
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap(entry => {
    const relativePath = prefix ? `${ prefix }/${ entry.name }` : entry.name;

    return entry.isDirectory()
      ? listFiles(path.join(directoryPath, entry.name), relativePath)
      : [ relativePath ];
  });
}

function readFileOr(filePath, defaultValue) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : defaultValue;
}

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}
