/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

import * as css from './CopilotPreview.less';

/**
 * In-pane preview of the scenario being built. Uses NavigatedViewer
 * (read-only, lightweight) and renders progressively by re-importing
 * trimmed XML on each step.
 *
 * Imperative API (via ref):
 *   - showXml(xml): Promise<void> — import and fit-viewport
 *   - reset(): void — clear the viewer
 */
const CopilotPreview = forwardRef(function CopilotPreview(props, ref) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    const viewer = new NavigatedViewer({ container: containerRef.current });
    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async showXml(xml) {
      const viewer = viewerRef.current;
      if (!viewer) return;
      await viewer.importXML(xml);
      viewer.get('canvas').zoom('fit-viewport', 'auto');
    },
    reset() {
      const viewer = viewerRef.current;
      if (!viewer) return;
      viewer.clear();
    }
  }), []);

  return <div ref={ containerRef } className={ css.copilotPreview } />;
});

export default CopilotPreview;
