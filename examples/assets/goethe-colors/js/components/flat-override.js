// Flat-override component : sets opacity for written texts

AFRAME.registerComponent('flat-override', {
  schema: {
    color:   { type: 'color',  default: '#ffffff' },
    opacity: { type: 'number', default: 1 }
  },

  init() {
    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;

      mesh.traverse((node) => {
        if (!node.isMesh) return;

        node.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(this.data.color),
          transparent: this.data.opacity < 1,
          opacity: this.data.opacity,
          roughness: 0.8,
          metalness: 0
        });

        node.material.needsUpdate = true;
      });
    });
  },

  update() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    mesh.traverse((node) => {
      if (!node.isMesh || !node.material) return;

      node.material.color.set(this.data.color);
      node.material.opacity = this.data.opacity;
      node.material.transparent = this.data.opacity < 1;
    });
  }
});
