export default function create() {
  let value;

  return {
    attachTo() {},
    detach() {},
    destroy() {},
    execCommand() {},
    on() {},
    off() {},
    getValue() {
      return value;
    },
    setValue(newValue) {
      value = newValue;
    },
    refresh() {},
    lastXML: null,
    doc: {
      clearHistory() {},
      historySize() {
        return {
          undo: 0,
          redo: 0
        };
      },
      undo() {},
      redo() {}
    }
  };
}