/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const fs = require('fs');

const mri = require('mri');

const exec = require('execa').sync;

const {
  collectLicenses,
  createLicenseBook,
  generateSummary,
  processLicenses
} = require('./license-book-handlers');

const {
  help,
  ...args
} = mri(process.argv, {
  alias: {
    output: [ 'o' ],
    help: [ 'h' ],
    commit: [ 'c' ]
  },
  default: {
    help: false,
    commit: false
  }
});


if (help) {
  console.log(`usage: node tasks/license-book.js [-o FILE_NAME] [-c]

Analyze and/or generate license book/third party notices.

Options:

  -o, --output=FILE_NAME        write to FILE_NAME
  -c, --commit                  commit book

  -h, --help                    print this help
`);

  process.exit(0);
}


run(args).then(
  () => console.log('Done.'),
  (err) => {
    console.error(err);

    process.exit(1);
  }
);


async function run(args) {

  const {
    output,
    commit
  } = args;

  console.log('Collecting dependencies...');

  const combinedLicenses = await collectLicenses();

  console.log();
  console.log('Processing licenses...');

  const {
    processedLicenses,
    warnings
  } = processLicenses(combinedLicenses);

  const summary = generateSummary(processedLicenses, warnings);

  console.log();
  console.log(summary);
  console.log();

  if (!output) {
    return;
  }

  console.log('Creating license book...');

  const licenseBook = createLicenseBook(processedLicenses);

  fs.writeFileSync(output, licenseBook, 'utf-8');

  console.log('Wrote license book to ' + output);
  console.log();

  if (!commit) {
    return;
  }

  const changes = exec('git', [ 'status', '--short' ]).stdout.trim();

  if (!changes) {
    console.log('No license book changes, skipping commit');
  } else {
    console.log('Committing license book...');

    exec('git', [ 'add', output ]);

    exec('git', [ 'commit', '-m', 'chore(project): update THIRD_PARTY_NOTICES' ]);
  }

  console.log();
}
