import DmnJS from 'dmn-js/lib/Modeler';


export default class CamundaDmnEditor extends DmnJS {

  constructor(options) {
    super(options);

    this.on('viewer.created', ({ viewer }) => {

      viewer.on('commandStack.changed', event => {
        this._emit('view.contentChanged', event);
      });

      viewer.on('selection.changed', event => {
        this._emit('view.selectionChanged', event);
      });

      viewer.on('error', ({ error }) => {
        this._emit('error', {
          viewer,
          error
        });
      });

    });

  }

}