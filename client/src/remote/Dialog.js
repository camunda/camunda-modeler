export default class Dialog {

  constructor(backend) {
    this.backend = backend;
  }

  openFile(cwd) {
    return this.backend.send('file:open', cwd).then(function(files) {

      // files may be null on user cancel
      files = files || [];

      return files;
    });
  }

  askSave(file) {
    return this.backend.send('dialog:close-tab', file);
  }

  askExportAs(file, filters) {
    return this.backend.send('file:export-as', file, filters);
  }

}