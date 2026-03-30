/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect, useState } from 'react';

/**
 * Hook that observes an element's parent width via ResizeObserver.
 *
 * @param {React.RefObject} ref
 * @returns {number} width (px)
 */
export default function useParentWidth(ref) {
  const [ width, setWidth ] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });

    ro.observe(ref.current.parentElement);

    return () => ro.disconnect();
  }, [ ref ]);

  return width;
}
