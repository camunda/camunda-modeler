export function electronRequire(component) {
  return window.require('electron')[component];
}