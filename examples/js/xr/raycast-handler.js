AFRAME.registerComponent('raycast-handler', {
    init: function() {
      var el = this.el;
      var marker = document.querySelector('#debug-marker');

      el.addEventListener('raycaster-intersection', function(evt) {
        var intersection = evt.detail.intersections[0];
        marker.setAttribute('position', intersection.point);
        marker.setAttribute('visible', true);
      });

      el.addEventListener('raycaster-intersection-cleared', function(evt) {
        marker.setAttribute('visible', false);
      });
    },

    tick: function() {
      var intersections = this.el.components.raycaster.intersections;
      var marker = document.querySelector('#debug-marker');
      if (intersections.length > 0) {
        var intersectionPoint = intersections[0].point;
        marker.setAttribute('position', intersectionPoint);
      }
    }
  });

  document.querySelector('#right-hand').setAttribute('raycast-handler', '');
  document.querySelector('#left-hand').setAttribute('raycast-handler', '');
