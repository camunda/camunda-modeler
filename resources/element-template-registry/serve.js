#!/usr/bin/env node

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
 * Serves the templates in `./templates` as a local element template registry,
 * e.g. to try out custom element template sources (cf. Settings > Element
 * template sources).
 *
 * Usage:
 *
 *   node resources/element-template-registry/serve.js [port]
 *
 * Then add `http://localhost:<port>/index.json` as a custom element template
 * source and restart the modeler.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');

const port = Number(process.argv[2]) || 8081;

const server = http.createServer((req, res) => {
  console.log(`${ req.method } ${ req.url }`);

  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname === '/' || pathname === '/index.json') {
    return sendJson(res, createIndex());
  }

  let decodedPathname;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {

    // malformed percent-encoding
    console.log(`-> 400 ${ pathname }`);

    res.writeHead(400).end('Bad request');

    return;
  }

  const file = path.join(TEMPLATES_DIR, path.normalize(decodedPathname));

  let stat;

  try {
    stat = fs.statSync(file);
  } catch {
    stat = null;
  }

  if (!file.startsWith(TEMPLATES_DIR) || !stat?.isFile()) {
    console.log(`-> 404 ${ pathname }`);

    res.writeHead(404).end('Not found');

    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' }).end(fs.readFileSync(file));
});

server.listen(port, 'localhost', () => {
  console.log(`Element template registry: http://localhost:${ port }/index.json`);
});

/**
 * Builds the registry index: template metadata grouped by template id.
 *
 * @returns {Object<string, Array<{ version: number, ref: string, engine?: Object }>>}
 */
function createIndex() {
  const index = {};

  for (const fileName of fs.readdirSync(TEMPLATES_DIR)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    const template = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, fileName), 'utf8'));

    const metadata = {
      version: template.version,
      ref: `http://localhost:${ port }/${ encodeURIComponent(fileName) }`
    };

    if (template.engines) {
      metadata.engine = template.engines;
    }

    (index[template.id] = index[template.id] || []).push(metadata);
  }

  return index;
}

function sendJson(res, body) {
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(body, null, 2));
}
