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

  show(options) {
    return this.backend.send('dialog:show', options);
  }

  showUnrecognizedFileErrorDialog = async (options) => {
    const {
      file,
      types
    } = options;

    const typesString = types.reduce((string, type, index) => {
      const isLast = index === types.length - 1;

      const seperator = isLast ? ' or' : ',';

      return string.concat(`${ seperator } ${ type.toUpperCase() }`);
    });

    await this.show({
      type: 'error',
      title: 'Unrecognized file format',
      buttons: [
        { id: 'cancel', label: 'Close' }
      ],
      message: 'The file "' + file.name + '" is not a' + typesString + ' file.'
    });
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
      message: [
        'The file "' + file.name + '" is empty.',
        'Would you like to create a new ' + typeUpperCase + ' diagram?'
      ].join('\n')
    });
  }

}