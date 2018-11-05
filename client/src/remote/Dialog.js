export default class Dialog {

  constructor(backend) {
    this.backend = backend;
  }

  /**
   * Show open dialog.
   *
   * @param {Object} options Options.
   * @param {String} options.defaultPath Default path.
   * @param {Object} options.filter Extension filter.
   * @param {String} [options.title] Dialog title.
   */
  showOpenFilesDialog(options) {
    return this.backend.send('dialog:open-files', options);
  }

  /**
   * Show save dialog (handles both XML and images).
   *
   * @param {Object} options Options.
   */
  showSaveFileDialog(options) {
    // TODO(philippfromme): implement
  }

  askSave(file) {
    return this.backend.send('dialog:close-tab', file);
  }

  askExportAs(file, filters) {
    return this.backend.send('file:export-as', file, filters);
  }

  show(options) {
    return this.backend.send('dialog:show', options);
  }

  showOpenFileErrorDialog = async (options) => {
    return this.backend.send('dialog:open-file-error', options);
  }

  showEmptyFileDialog = async (options) => {
    const {
      file,
      type
    } = options;

    const typeUpperCase = type.toUpperCase();

    return this.show({
      type: 'info',
      title: [
        'Empty ',
        typeUpperCase,
        ' file'
      ].join(''),
      buttons: [
        { id: 'cancel', label: 'Cancel' },
        { id: 'create', label: 'Create' }
      ],
      message: `The file "${ file.name }" is empty.`,
      detail: `Would you like to create a new ${ type } file?`
    });
  }

}