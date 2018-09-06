export function isInput(element) {
  return (
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'INPUT' ||
    element.contentEditable === 'true'
  );
}

export function active(element) {
  element = element || document.activeElement;

  if (!element) {
    element = document.getSelection().focusNode;
  }

  return isInput(element);
}