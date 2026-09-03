/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useSyncExternalStore } from 'react';

import { FeelPlayground } from '@camunda/feel-playground';

import '@camunda/feel-playground/style.css';

const DIALECT = 'expression';
const EMPTY_CONTEXT = '{}';

/**
 * The React side of the FEEL playground popup.
 *
 * The expression is owned by the properties panel entry and passed through as a
 * prop; the evaluation context is owned by the playground service so it
 * survives closing and re-opening the popup.
 */
export default function FeelPlaygroundEditor(props) {
  const {
    contextKey,
    feelLanguageContext,
    feelPlayground,
    onInput,
    value,
    variables
  } = props;

  const config = useSyncExternalStore(feelPlayground.subscribe, feelPlayground.getConfig);
  const context = useSyncExternalStore(
    feelPlayground.subscribeContext,
    () => feelPlayground.getContext(contextKey) ?? EMPTY_CONTEXT
  );

  useEffect(() => {
    return () => {
      feelPlayground.saveContexts();
    };
  }, [ feelPlayground ]);

  const handleExpressionChange = (nextExpression) => {
    onInput(nextExpression);
  };

  const handleContextChange = (nextContext) => {
    feelPlayground.setContext(contextKey, nextContext);
  };

  return (
    <div className="feel-playground-popup__editor">
      <FeelPlayground
        expression={ value }
        onExpressionChange={ handleExpressionChange }
        context={ context }
        onContextChange={ handleContextChange }
        dialect={ DIALECT }
        feelLanguageContext={ feelLanguageContext }
        variables={ variables }
        onEvaluate={ config.onEvaluate }
        evaluationUnavailable={ config.evaluationUnavailable }
      />
    </div>
  );
}
