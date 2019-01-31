var PADDING = 100;
var MOVE_THRESHOLD = 15;

/**
 * Moves diagram contents to the origin (PADDING,PADDING) upon diagram export.
 *
 * @param {didi.Injector} injector
 */
export default function FixOrigin(injector) {

  // dmn-js: access editor parent to hook into saveXML.start event
  var parent = injector.get('_parent', false);

  var eventBus = parent ? parent._eventBus : injector.get('eventBus');

  var canvas = injector.get('canvas', false);
  var modeling = injector.get('modeling', false);

  if (!eventBus || !canvas || !modeling) {
    // required components not there, bail out
    return;
  }


  eventBus.on('saveXML.start', function() {

    var viewbox = canvas.viewbox();

    var bounds = viewbox.inner;

    var rootElements = canvas.getRootElement().children;

    var dx = -bounds.x + PADDING;
    var dy = -bounds.y + PADDING;

    if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) {
      // no adjustment needed, skipping
      return;
    }

    modeling.moveElements(
      rootElements,
      {
        x: dx,
        y: dy
      }
    );

    canvas.scroll({
      dx: -dx * viewbox.scale,
      dy: -dy * viewbox.scale
    });

  });

}

FixOrigin.$inject = [ 'injector' ];