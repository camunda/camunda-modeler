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
 * A simple history that allows to
 * add and remove elements as well as
 * navigating forward / backward through
 * operations.
 */
export default class History {

  constructor(elements = [], idx = -1) {
    this.elements = elements;
    this.idx = idx;
  }

  /**
   * Add element to history.
   */
  push(element) {
    this.elements = [
      ...this.elements.slice(0, this.idx + 1),
      element
    ];

    this.idx++;
  }

  /**
   * Remove last element from history.
   */
  pop() {
    const element = this.elements.pop();

    this.idx = Math.min(this.elements.length - 1, this.idx);

    return element;
  }

  /**
   * Get current element.
   */
  get() {
    return this.elements[this.idx];
  }

  /**
   * Replace all instances of element with new element.
   */
  replace(element, newElement) {

    this.elements = this.elements.map(e => {
      if (e === element) {
        return newElement;
      }

      return e;
    });
  }

  navigate(direction, nextFn) {

    let newIndex = this.idx + direction;

    // insert element to front
    if (newIndex === -1) {

      const next = nextFn();

      if (next) {
        this.elements = [
          next,
          ...this.elements
        ];

        newIndex = 0;
      }
    }

    // add element to end
    if (newIndex === this.elements.length) {
      const next = nextFn(direction);

      this.elements = [
        ...this.elements,
        next
      ];
    }

    this.idx = newIndex;

    return this.get();
  }

  /**
   * Remove all instances of element in the history.
   */
  purge(element) {

    var idx = this.idx;

    this.elements = this.elements.filter((e, i) => {

      if (e !== element) {
        return true;
      }

      if (i <= this.idx) {
        idx--;
      }

      return false;
    });

    this.idx = idx;
  }
}