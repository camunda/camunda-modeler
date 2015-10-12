module.exports = function() {

  return {
    restrict: 'A',
    scope: {
      control: '='
    },
    link: function(scope, element) {

      var control = scope.control;

      if (!control) {
        throw new Error('no control given');
      }

      control.attach(scope, element[0]);

      scope.$on('$destroy', function() {
        control.detach();
      });
    }
  };
};
