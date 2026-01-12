// Fades in glb models when the user is in a defined color zone

AFRAME.registerComponent('area-fade-gradient', {
  schema: {
    target:     { type: 'selector' },         // GLB with gradient-color
    zone:       { type: 'string' },           // 'orange', 'blue', etc
    maxOpacity: { type: 'number', default: 1 },   // when this zone is active
    minOpacity: { type: 'number', default: 0.1 }, // otherwise
    speed:      { type: 'number', default: 2 }    // fade speed (per second)
  },

  init: function () {
    const data   = this.data;
    this.active  = false;
    this.currentOpacity = data.minOpacity;
    this.targetOpacity  = data.minOpacity;

    const sceneEl = this.el.sceneEl;
    this.onZoneChanged = (e) => {
      const activeName = e.detail && e.detail.name;
      this.active = (activeName === data.zone);
    };

    if (sceneEl) {
      sceneEl.addEventListener('goethe-zone-changed', this.onZoneChanged);
    }
  },

  remove: function () {
    const sceneEl = this.el.sceneEl;
    if (sceneEl && this.onZoneChanged) {
      sceneEl.removeEventListener('goethe-zone-changed', this.onZoneChanged);
    }
  },

  tick: function (time, dt) {
    const targetEl = this.data.target;
    if (!targetEl) return;

    // Set target opacity based on zone activity
    this.targetOpacity = this.active ? this.data.maxOpacity : this.data.minOpacity;

    // Smooth fade
    const dtSec      = dt / 1000;
    const lerpFactor = 1.0 - Math.exp(-this.data.speed * dtSec);
    this.currentOpacity = THREE.MathUtils.lerp(
      this.currentOpacity,
      this.targetOpacity,
      lerpFactor
    );

    // Apply opacity to target's gradient-color shader
    const mesh = targetEl.getObject3D('mesh');
    if (!mesh) return;

    mesh.traverse((node) => {
      if (!node.isMesh || !node.material || !node.material.uniforms) return;
      if (node.material.uniforms.opacity) {
        node.material.uniforms.opacity.value = this.currentOpacity;
      }
    });

    // Toggle visibility for perf
    targetEl.setAttribute('visible', this.currentOpacity > 0.01);
  }

  
});