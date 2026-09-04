/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { FeelPlayground } from '@camunda/feel-playground';

import '@camunda/feel-playground/style.css';

const DIALECT = 'expression';
const EMPTY_CONTEXT = '{}';

/**
 * The React side of the FEEL playground popup.
 *
 * The expression is owned by the properties panel entry and passed through as a
 * prop; contexts changed by the user are owned by the playground service so
 * they survive closing and re-opening the popup.
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

  const [ expression, setExpression ] = useState(value);
  const initializingContext = useRef(true);
  const config = useSyncExternalStore(feelPlayground.subscribe, feelPlayground.getConfig);
  const storedContext = useSyncExternalStore(
    feelPlayground.subscribeContext,
    () => feelPlayground.getContext(contextKey)
  );
  const [ context, setContext ] = useState(storedContext ?? EMPTY_CONTEXT);

  useEffect(() => {
    setExpression(value);
  }, [ value ]);

  useEffect(() => {
    setContext(storedContext ?? EMPTY_CONTEXT);
  }, [ contextKey, storedContext ]);

  useEffect(() => {
    initializingContext.current = false;
  }, []);

  useEffect(() => {
    return () => {
      feelPlayground.saveContexts();
    };
  }, [ feelPlayground ]);

  const handleExpressionChange = (nextExpression) => {
    setExpression(nextExpression);
    onInput(nextExpression);
  };

  const handleContextChange = (nextContext) => {
    setContext(nextContext);

    if (!initializingContext.current) {
      feelPlayground.setContext(contextKey, nextContext);
    }
  };

  return (
    <div className="feel-playground-popup__editor">
      <FeelPlayground
        expression={ expression }
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
