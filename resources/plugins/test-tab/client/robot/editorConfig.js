/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

// Adapted from https://github.com/robotframework/robotframework.github.com/blob/98b11f3f630de01931467f2534d77717ab636f18/src/js/code/editorConfig.js
// original copyright robotframework, licnesed under Apache License 2.0.

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import BuiltIn from './Libraries/BuiltIn.json';
import Collections from './Libraries/Collections.json';
import DateTime from './Libraries/DateTime.json';
import String from './Libraries/String.json';
import XML from './Libraries/XML.json';
import OperatingSystem from './Libraries/OperatingSystem.json';

var Libraries = {
  [BuiltIn.name]: BuiltIn,
  [Collections.name]: Collections,
  [DateTime.name]: DateTime,
  [String.name]: String,
  [XML.name]: XML,
  [OperatingSystem.name]: OperatingSystem
};


monaco.languages.register({ id: 'robotframework' });
monaco.languages.setMonarchTokensProvider('robotframework', {
  defaultToken: 'string',
  tokenPostfix: '.robotframework',
  ignoreCase: false,
  keywords: [
    'IF',
    'END',
    'FOR',
    'IN',
    'IN RANGE',
    'IN ENUMERATE',
    'IN ZIP',
    'ELSE IF',
    'ELSE',
    'TRY',
    'EXCEPT',
    'FINALLY',
    'RETURN',
    'BREAK',
    'CONTINUE'
  ],
  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '[', close: ']', token: 'delimiter.bracket' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' }
  ],
  tokenizer: {
    root: [
      { include: '@comment' },
      { include: '@vars' },
      { include: '@tables' },
      { include: '@setting' },
      { include: '@tc_kw_definition' },
      { include: '@keyword' },
      { include: '@numbers' },
      [ /[,:;]/, 'delimiter' ],
      [ /[{}[\]()]/, '@brackets' ]
    ],
    comment: [
      [ /(?: {2,}| ?\t ?)#.*/, 'comment' ],
      [ /^#.*/, 'comment' ]
    ],
    tables: [
      [
        /^(\*+ ?(?:[sS]ettings?|[kK]eywords?|[vV]ariables?|[cC]omments?|[dD]ocumentation|[tT]asks?|[tT]est [cC]ases?)[ *]*)(?= {2,}| ?\t| ?$)/,
        'keyword', '@popall'
      ]
    ],
    setting: [
      [ /^(?: {2,}| ?\t ?)+\[(?:Documentation|Tags|Template|Tags|Arguments)]/, 'tag', '@popall' ],
      [ /^(?: {2,}| ?\t ?)+\[(?:Setup|Teardown)]/, 'tag', '@keywordAssignment' ]
    ],
    tc_kw_definition: [
      [ /^(?! {2,}| ?\t ?).*?(?= {2,}| ?\t ?|$)/, 'type', '@popall' ]
    ],
    constant: [
      [
        /^(?!(?: {2,}| ?\t ?)+(?:(?=[$\\[@&%]|\\.)))(?: {2,}| ?\t ?)+(.*?)(?= {2,}| ?\t ?| ?$)/,
        'constant'
      ]
    ],
    vars: [
      [ /^(?: {2,}| ?\t ?)+[$&%@](?=\{)/, 'delimiter.curly.meta.vars1', '@varBodyAssignment' ],
      [ /^[$&%@](?=\{)/, 'delimiter.curly.meta.vars1', '@varBodyVariables' ],
      [ /[$&%@](?=\{)/, 'delimiter.curly.meta.vars1', '@varBody' ]
    ],
    varBodyVariables: [
      [ /\{/, 'delimiter.curly.meta.varBody2', '@varBody' ],
      [ /\}=?(?= {2,}| ?\t ?| ?$)/, 'delimiter.curly.meta.varBody4', '@popall' ],
      [ /\n| {2}/, 'delimiter.meta.varBody5', '@popall' ]
    ],
    varBodyAssignment: [
      [ /\{/, 'delimiter.curly.meta.varBody2', '@varBody' ],
      [ /\}(?: {2,}| ?\t ?)+[$&%@](?=\{)/, 'delimiter.curly.meta.vars1', '@varBodyAssignment' ],
      [ /\}=?/, 'delimiter.curly.meta.varBody4', '@keywordAssignment' ],
      [ /\n| {2}/, 'delimiter.meta.varBody5', '@popall' ]
    ],
    keywordAssignment: [
      [ / ?=?(?: {2,}| ?\t ?)+[^@$%&]*?(?= {2,}| ?\t ?| ?$)/, 'identifier.keywordassignment1', '@popall' ]
    ],
    varBody: [
      [ /[$&%@](?=\{)/, 'delimiter.curly.meta.varBody1', '@varBody' ],
      [ /\{/, 'delimiter.curly.meta.varBody2', '@varBody' ],
      [ /\}(?=\[)/, 'delimiter.curly.meta.varBody3', '@dictKey' ],
      [ /\}|\]/, 'delimiter.curly.meta.varBody4', '@pop' ],
      [ /\n| {2}/, 'delimiter.meta.varBody5', '@popall' ],
      [ /.*?(?= {2}|[$&%@]\{|\})/, 'variable.meta.varBody5', '@pop' ]
    ],
    dictKey: [
      [ /\[/, 'delimiter.curly.meta.dictKey1' ],
      [ /\]/, 'delimiter.curly.meta.dictKey2', '@popall' ],
      [ /[$&%@](?=\{)/, 'delimiter.curly.meta.dictKey3', '@varBody' ],
      [ /\n| {2}/, 'delimiter.meta.dictKey4', '@popall' ],
      [ /.*?(?= {2}|[$&%@]\{|\])/, 'variable.meta.dictKey4', '@pop' ]
    ],
    keyword: [
      [ /(?: {2,}| ?\t ?)+(IF|END|FOR|IN|IN RANGE|IN ENUMERATE|IN ZIP|ELSE|ELSE IF|TRY|EXCEPT|FINALLY|RETURN|BREAK|WHILE|CONTINUE)(?= {2,}| ?\t ?|$)/, 'keyword', '@popall' ],
      [ /^(?: {2,}| ?\t ?)+[^@$%&]*?(?= {2,}| ?\t ?| ?$)/, 'identifier.keyword1', '@popall' ],
      [ /^(?:(?:(?: {2,}| ?\t ?)(?:[$&@]\{(?:.*?)\}(?: ?=)))*(?: {2,}| ?\t ?))(.+?)(?= {2,}| ?\t ?|$)/, 'identifier.keyword3', '@popall' ]
    ],

    // Recognize hex, negatives, decimals, imaginaries, longs, and scientific notation
    numbers: [
      [ /-?0x([abcdef]|[ABCDEF]|\d)+[lL]?/, 'number.hex' ],
      [ /-?(\d*\.)?\d+([eE][+-]?\d+)?[jJ]?[lL]?/, 'number' ]
    ]
  }
});

const Settings = '*** Settings ***';
const TestCases = '*** Test Cases ***';
const Variables = '*** Variables ***';
const Keywords = '*** Keywords ***';
const Comments = '*** Comment ***';
const Tables = [
  Settings,
  TestCases,
  Keywords,
  Comments,
  Variables
];

const SettingsMatcher = /^(?:\* ?)+(?:Settings? ?)(?:\* ?)*(?:(?: {2,}| ?\t| ?$).*)?$/i;
const TestCasesMatcher = /^(?:\* ?)+(?:Test Cases?|Tasks?) ?(?:\* ?)*(?:(?: {2,}| ?\t| ?$).*)?$/i;
const KeywordsMatcher = /^(?:\* ?)+(?:Keywords? ?)(?:\* ?)*(?:(?: {2,}| ?\t| ?$).*)?$/i;
const CommentsMatcher = /^(?:\* ?)+(?:Comments? ?)(?:\* ?)*(?:(?: {2,}| ?\t| ?$).*)?$/i;
const VariablesMatcher = /^(?:\* ?)+(?:Variables? ?)(?:\* ?)*(?:(?: {2,}| ?\t| ?$).*)?$/i;
const KeywordPosMatcher = /(^(?: {2,}| ?\t ?)+(?:(?:\[(?:Setup|Teardown)]|[$&%@]\{.*?\} ?=?)(?: {2,}| ?\t ?))*).*?(?= {2,}| ?\t ?|$)/;

function createKeywordProposals(range, libraries) {
  function getKeywordProp(keyword, library) {
    var args = '';
    var argDoc = '';
    for (const [ i, argument ] of keyword.args.entries()) {
      if (argument.required) {
        args += `    \${${i + 1}:${argument.name}}`;
      }
      argDoc += ` - \`${argument.name}  ${argument.defaultValue ? '= ' + argument.defaultValue : ''}\`\n`;
    }
    return {
      label: keyword.name,
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: { value: `*(${library}):*\n\n**Arguments:**\n` + argDoc + '\n**Documentation:**\n\n' + keyword.doc },
      insertText: `${keyword.name}${args}`,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range
    };
  }

  var proposals = [];
  for (const lib of libraries) {
    if (lib in Libraries && lib !== 'BuiltIn') {
      for (const keyword of Libraries[lib].keywords) {
        proposals.push(getKeywordProp(keyword, lib));
      }
    }
  }
  for (const keyword of Libraries.BuiltIn.keywords) {
    proposals.push(getKeywordProp(keyword, 'BuiltIn'));
  }

  return proposals;
}

function createTablesProposals(tablesInValue, range) {
  function getTableProp(name) {
    return {
      label: name,
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: '',
      insertText: name,
      range: {
        startLineNumber: range.startLineNumber,
        endLineNumber: range.endLineNumber,
        startColumn: 1,
        endColumn: 1
      }
    };
  }

  const propTables = Tables.filter(n => !tablesInValue.includes(n));
  var proposals = [];
  for (const table of propTables) {
    proposals.push(getTableProp(table));
  }
  return proposals;
}

function createSettingsProposals(settingsLines, range) {
  function getSettingsProp(name) {
    return {
      label: name,
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: '',
      insertText: name + '    ',
      range: {
        startLineNumber: range.startLineNumber,
        endLineNumber: range.endLineNumber,
        startColumn: 1,
        endColumn: 1
      }
    };
  }
  var existingSettings = [];
  for (const { line } of settingsLines) {
    var matcher = line.match(/^(.*?)(?= {2,}| ?\t ?|$)/);
    if (matcher) {
      existingSettings.push(matcher[1]);
    }
  }

  const propSettings = [
    'Metadata',
    'Library',
    'Resource',
    'Variables'
  ];

  const uniquePropSettings = [
    'Documentation',
    'Suite Setup',
    'Suite Teardown',
    'Test Setup',
    'Test Teardown',
    'Test Template',
    'Test Timeout',
    'Force Tags',
    'Default Tags'
  ];

  const notSetSettings = uniquePropSettings.filter(n => !existingSettings.includes(n));
  var proposals = [];
  for (const setting of [ ...propSettings, ...notSetSettings ]) {
    proposals.push(getSettingsProp(setting));
  }
  return proposals;
}

function createTCKWSettingProposals(range, currentTable, lines) {
  function getTCSKWSettingsProp(name, type) {
    return {
      label: name,
      kind: type,
      documentation: '',
      insertText: name,
      range: range
    };
  }
  var existingSettings = [];
  for (const { line } of lines) {
    var matcher = line.match(/^(?: {2,}| ?\t ?)+(\[(?:Documentation|Template|Tags|Arguments|Setup|Teardown)])(?: {2,}| ?\t ?)*.*?(?= {2,}| ?\t ?|$)/);
    if (matcher) {
      existingSettings.push(matcher[1]);
    }
  }

  const testCaseSettings = [
    '[Documentation]    ',
    '[Tags]    ',
    '[Template]    ',
    '[Setup]    ',
    '[Teardown]    '
  ];

  const keywordSettings = [
    '[Documentation]    ',
    '[Tags]    ',
    '[Arguments]    ',
    '[Teardown]    '
  ];

  const langFeatures = [
    'IF    ',
    'ELSE',
    'ELSE IF    ',
    'FOR    ',
    'END',
    'WHILE    ',
    'RETURN    ',
    'TRY',
    'EXCEPT    ',
    'FINALLY',
    'BREAK',
    'CONTINUE'
  ];

  const settingsList = (currentTable === Keywords) ? keywordSettings : testCaseSettings;
  var proposals = [];
  for (const setting of settingsList.filter(n => !existingSettings.includes(n.trim()))) {
    proposals.push(getTCSKWSettingsProp(setting, monaco.languages.CompletionItemKind.Property));
  }
  for (const statement of langFeatures) {
    proposals.push(getTCSKWSettingsProp(statement, monaco.languages.CompletionItemKind.Keyword));
  }
  return proposals;
}

function getCurrentTable(textLinesUntilPosition) {
  var currentTable = null;
  for (const line of textLinesUntilPosition) {
    if (line) {
      switch (line) {
      case line.match(SettingsMatcher)?.input:
        currentTable = Settings;
        break;
      case line.match(TestCasesMatcher)?.input:
        currentTable = TestCases;
        break;
      case line.match(KeywordsMatcher)?.input:
        currentTable = Keywords;
        break;
      case line.match(CommentsMatcher)?.input:
        currentTable = Comments;
        break;
      case line.match(VariablesMatcher)?.input:
        currentTable = Variables;
        break;
      }
    }
  }
  return currentTable;
}

function getTables(model) {
  const textLines = model.getValue().split('\n');
  var tables = {};
  var currentTable = '';
  for (const [ i, line ] of textLines.entries()) {
    var tableHeader = '';
    switch (line) {
    case line.match(SettingsMatcher)?.input:
      tableHeader = Settings;
      break;
    case line.match(TestCasesMatcher)?.input:
      tableHeader = TestCases;
      break;
    case line.match(KeywordsMatcher)?.input:
      tableHeader = Keywords;
      break;
    case line.match(CommentsMatcher)?.input:
      tableHeader = Comments;
      break;
    case line.match(VariablesMatcher)?.input:
      tableHeader = Variables;
      break;
    }
    if (tableHeader) {
      tables[tableHeader] = [];
      currentTable = tableHeader;
    } else if (currentTable) {
      tables[currentTable].push({ nr: i + 1, line: line });
    }
  }
  return tables;
}

function isAtKeywordPos(currentLine) {
  var isKeywordCall = currentLine.match(KeywordPosMatcher);
  if (isKeywordCall) {
    return (currentLine === isKeywordCall[0]);
  }
}

function getImportedLibraries(settingsTable) {
  var imports = [];
  for (const { line } of settingsTable) {
    var libMatch = line.match(/^(?:Resource(?: {2,}| ?\t ?)+(\w+?)(?:\.resource)?|Library(?: {2,}| ?\t ?)+(\w+?)(?:\.py)?)(?: {2,}| ?\t ?|$)+/i);
    if (libMatch) {
      imports.push(libMatch[1] || libMatch[2]);
    }
  }
  return imports;
}

export function getTestCaseRanges(model) {
  const tableContent = getTables(model);
  return (TestCases in tableContent) ? getTestCases(tableContent[TestCases]) : [];
}

function getTestCases(testCaseLines) {
  var testCases = [];
  for (const line of testCaseLines) {
    const isTestCase = line.line.match(/^ ?[^ \t\n\r](.+)$/);
    if (isTestCase) {
      testCases.push({ nr: line.nr, name: line.line.trim() });
    }
  }
  return testCases;
}

monaco.languages.registerCompletionItemProvider('robotframework', {
  provideCompletionItems: (model, position) => {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });
    const textLinesUntilPosition = textUntilPosition.split('\n');
    const currentLine = textLinesUntilPosition.at(-1);

    const currentTable = getCurrentTable(textLinesUntilPosition);
    const tableContent = getTables(model);
    var importedLibraries = (Settings in tableContent) ? getImportedLibraries(tableContent[Settings]) : [];
    const fileName = model.name?.match(/(.*?)\.resource/);
    if (fileName) {
      importedLibraries.push(fileName[1]);
    }
    const existingTables = Object.keys(tableContent);

    const keyword = isAtKeywordPos(currentLine);

    const linestart = currentLine.match(
      /^(?! {2,}| ?\t ?).*/
    );

    if (!keyword && !linestart) {
      return { suggestions: [] };
    }

    if (linestart) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      if (currentTable === Settings) {
        const settingsProp = createSettingsProposals(tableContent[Settings], range);
        const tablesProp = createTablesProposals(existingTables, range);
        return {
          suggestions: [ ...tablesProp, ...settingsProp ]
        };
      } else {
        return {
          suggestions: createTablesProposals(existingTables, range)
        };
      }
    }

    if (keyword && (currentTable === TestCases || currentTable === Keywords)) {
      const kwMatch = model.getValueInRange({
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: 0,
        endColumn: position.column
      }).match(KeywordPosMatcher);
      if (!kwMatch) {
        return { suggestions: [] };
      }

      // const word = model.getWordUntilPosition(position) // TODO: here search for Keyword with spacces not words...
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: kwMatch[1].length + 1,
        endColumn: kwMatch[1].length + 1
      };
      return {
        suggestions: [
          ...createKeywordProposals(range, importedLibraries),
          ...createTCKWSettingProposals(range, currentTable, []) // tableContent[currentTable]) // TODO: Analyse keyword content
        ]
      };
    }
  }
});
