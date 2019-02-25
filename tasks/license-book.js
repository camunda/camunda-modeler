/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const path = require('path');

const fs = require('fs');

const mri = require('mri');

const exec = require('execa').sync;

const licenseChecker = require('license-checker');

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

  console.log('Collecting client dependencies...');

  const clientDependencies = await collectClientDependencies();

  console.log('Analyzing dependencies...');

  const appLicenses = await collectLicenses('app');
  const clientLicenses = await collectLicenses('client', name => clientDependencies[name]);

  const combinedLicenses = {
    ...appLicenses,
    ...clientLicenses
  };

  console.log();
  console.log('Processing licenses...');

  const processedLicenses = processLicenses(combinedLicenses);

  console.log();
  console.log('Summary of used third party licenses:');
  console.log(licenseChecker.asSummary(processedLicenses));
  console.log('* = license name is deduced from README and/or license text');
  console.log();

  if (!output) {
    return;
  }

  console.log('Creating license book...');

  fs.writeFileSync(output, createLicenseBook_Plain(processedLicenses), 'utf-8');

  console.log('Wrote license book to ' + output);
  console.log();

  if (!commit) {
    return;
  }

  console.log('Committing license book...');

  exec('git', [ 'add', output ]);

  exec('git', [ 'commit', '-m', 'chore(project): update THIRD_PARTY_NOTICES' ]);

  console.log();
}

async function collectClientDependencies() {

  exec('npm', [ 'run', 'build' ], {
    cwd: path.join(process.cwd(), 'client'),
    env: {
      LICENSE_CHECK: '1'
    }
  });

  return JSON.parse(fs.readFileSync('app/public/dependencies.json', 'utf-8'));
}

async function collectLicenses(pkg, filter) {
  console.log(`${pkg}: scanning licenses`);

  const licenses = await scanLicenses(pkg);

  if (!filter) {
    return licenses;
  }

  return Object.entries(licenses).filter(
    (entry) => {
      const [ name ] = entry;

      return filter(name);
    }
  ).reduce(
    (result, entry) => {
      const [ name, details ] = entry;

      return {
        ...result,
        [name]: details
      };
    }, {}
  );
}


function scanLicenses(pkg) {

  const args = {
    production: true,
    start: path.join(process.cwd(), pkg),
    excludePrivatePackages: true
  };

  return new Promise(function(resolve, reject) {

    licenseChecker.init(args, function(err, json) {

      if (err) {
        return reject(err);
      }

      return resolve(json);

    });

  });

}

function processLicenses(dependencies) {

  function isValidFile(file) {
    return file && !/README(\.md)?/i.test(file);
  }

  return Object.entries(dependencies).map(([ name, details ]) => {

    const {
      licenseFile,
      repository,
      licenses
    } = details;

    if (!repository) {
      console.warn('missing repository: %s', name);
    }

    const licenseFileValid = isValidFile(licenseFile);

    if (!licenseFileValid) {
      console.warn('missing license file: %s', name);
    }

    const licenseText = licenseFileValid
      ? fs.readFileSync(licenseFile, 'utf-8')
      : licenses;

    return {
      ...details,
      name,
      repository,
      licenseText
    };
  });

}

function createLicenseBook_Plain(dependencies) {

  function createShortEntry(dependency) {

    const {
      name,
      repository
    } = dependency;

    return `${name}${repository ? ` (${repository})` : ''}`;
  }

  function createEntry(dependency) {

    const {
      name,
      licenseText
    } = dependency;

    return `%% ${name} NOTICES AND INFORMATION BEGIN HERE
==========================================
${licenseText}
==========================================
END OF ${name} NOTICES AND INFORMATION`;
  }

  return `camunda-modeler

THIRD-PARTY SOFTWARE NOTICES AND INFORMATION
Do Not Translate or Localize

This project incorporates components from the projects listed below. The original copyright notices and the licenses under which Camunda received such components are set forth below.

${dependencies.map(createShortEntry).map((val, idx) => `${ rightPad(`${idx + 1}.`, 6) }${val}`).join('\n')}


${dependencies.map(createEntry).join('\n\n\n')}
`;
}

/* eslint-disable-next-line no-unused-vars */
function createLicenseBook_HTML(dependencies) {

  function createEntry(dependency) {

    const {
      name,
      repository,
      licenseText
    } = dependency;

    return `
<div class="product">
<span class="title">${name}</span>
<a class="show" href="#">show license</a>
${
  repository ? `<span class="homepage"><a href="${repository}">homepage</a></span>` : ''
}
<div class="licence">
<pre>${ licenseText.replace(/</g, '&lt;') }</pre>
</div>
</div>
    `;
  }


  return `
<!-- Generated by tasks/create-license-book.js; do not edit. -->
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Camunda Modeler Credits</title>
<style>
body {
  background-color: white;
  font-size: 84%;
  max-width: 1020px;
}
.page-title {
  font-size: 164%;
  font-weight: bold;
}
.product {
  background-color: #c3d9ff;
  border-radius: 5px;
  margin-top: 16px;
  overflow: auto;
  padding: 2px;
}
.product .title {
  float: left;
  font-size: 110%;
  font-weight: bold;
  margin: 3px;
}
.product .homepage {
  float: right;
  margin: 3px;
  text-align: right;
}
.product .homepage::after {
  content: " - ";
}
.product .show {
  float: right;
  margin: 3px;
  text-align: right;
}
.licence {
  background-color: #e8eef7;
  border-radius: 3px;
  clear: both;
  display: none;
  padding: 16px;
}
.licence h3 {
  margin-top: 0;
}
.licence pre {
  white-space: pre-wrap;
}
.dialog #print-link,
.dialog .homepage {
  display: none;
}
</style>
</head>
<body>
<span class="page-title" style="float:left;">Credits</span>
<a id="print-link" href="#" style="float:right;">Print</a>
<div style="clear:both; overflow:auto;">

<!-- We <3 the following projects -->
${
  dependencies.map(createEntry).join('\n\n')
}
</div>
<script>
function $(id) { return document.getElementById(id); }

function toggle(o) {
  var licence = o.nextSibling;

  while (licence.className != 'licence') {
    if (!licence) return false;
    licence = licence.nextSibling;
  }

  if (licence.style && licence.style.display == 'block') {
    licence.style.display = 'none';
    o.textContent = 'show license';
  } else {
    licence.style.display = 'block';
    o.textContent = 'hide license';
  }
  return false;
}

document.addEventListener('DOMContentLoaded', function() {
  var links = document.querySelectorAll('a.show');
  for (var i = 0; i < links.length; ++i) {
    links[i].onclick = function() { return toggle(this); };
  }

  $('print-link').onclick = function() {
    window.print();
    return false;
  };
});
</script>
</body>
</html>
  `;
}


function rightPad(str, length) {

  str = String(str);

  while (str.length < length) {
    str += ' ';
  }

  return str;
}