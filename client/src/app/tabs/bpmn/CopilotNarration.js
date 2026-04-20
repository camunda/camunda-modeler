/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';

import * as css from './GuidedStart.less';

const CHAR_MS = 25;

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CopilotNarration({ text }) {
  const [ displayed, setDisplayed ] = useState('');
  const rafRef = useRef(null);

  useEffect(() => {
    if (!text) {
      setDisplayed('');
      return;
    }
    if (prefersReducedMotion()) {
      setDisplayed(text);
      return;
    }
    let i = 0;
    let lastTs = 0;
    function tick(ts) {
      if (ts - lastTs >= CHAR_MS) {
        i = Math.min(text.length, i + Math.max(1, Math.floor((ts - lastTs) / CHAR_MS)));
        setDisplayed(text.slice(0, i));
        lastTs = ts;
      }
      if (i < text.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ text ]);

  return (
    <div
      className={ css.copilotNarration }
      aria-live="polite"
      aria-atomic="true"
    >
      { displayed || '\u00A0' }
    </div>
  );
}
