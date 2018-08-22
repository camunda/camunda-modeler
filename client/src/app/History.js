
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

    this.navigate(-1);

    return element;
  }

  /**
   * Get current element.
   */
  get() {
    return this.elements[this.idx];
  }

  replace(element, newElement) {

    const elementIdx = this.elements.indexOf(element);

    if (elementIdx !== -1) {
      this.elements[elementIdx] = newElement;
    }
  }

  navigate(direction, newElement) {

    let newIndex = this.idx + direction;

    // insert element to front
    if (newIndex === -1) {
      this.elements = [
        newElement,
        ...this.elements
      ];

      newIndex = 0;
    }

    // add element to end
    if (newIndex === this.elements.length) {
      this.elements = [
        ...this.elements,
        newElement
      ];

      newIndex = this.elements.length - 1;
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

      if (i < this.idx) {
        idx--;
      }

      return false;
    });

    this.idx = idx;
  }
}