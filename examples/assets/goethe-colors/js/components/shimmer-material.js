// Shimmer Material : effect use to animate the 6 color diagram 

AFRAME.registerComponent('shimmer-material', {
  schema: {
    opacity:          { type: 'number', default: 1.0 },
    shimmerIntensity: { type: 'number', default: 1.0 }, // how strong the shimmer is
    shimmerSpeed:     { type: 'number', default: 1.0 }  // how fast it moves
  },

  init: function () {
    this.shaderMaterials = [];
    this.applyMaterial = this.applyMaterial.bind(this);

    this.el.addEventListener('loaded', this.applyMaterial);
    this.el.addEventListener('model-loaded', this.applyMaterial);
    this.el.addEventListener('materialtextureloaded', this.applyMaterial);

    this.applyMaterial();
  },

  makeShaderMaterial: function (baseMap) {
    const data = this.data;
    baseMap.wrapS = baseMap.wrapT = THREE.ClampToEdgeWrapping;

    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        time:            { value: 0 },
        opacity:         { value: data.opacity },
        shimmerIntensity:{ value: data.shimmerIntensity },
        shimmerSpeed:    { value: data.shimmerSpeed },
        baseMap:         { value: baseMap }
      },

      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform float shimmerIntensity;
        uniform float shimmerSpeed;
        uniform sampler2D baseMap;
        varying vec2 vUv;

        // very simple 2D noise
        float random(vec2 st) {
          return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453);
        }
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);

          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));

          vec2 u = f * f * (3.0 - 2.0 * f);

          return mix(a, b, u.x) +
                 (c - a) * u.y * (1.0 - u.x) +
                 (d - b) * u.x * u.y;
        }

        void main() {
          vec4 baseSample = texture2D(baseMap, vUv);
          if (baseSample.a < 0.01) {
            discard;
          }

          // animated noise over the whole plane
          vec2 st = vUv * 4.0;
          st += vec2(time * shimmerSpeed * 0.2, -time * shimmerSpeed * 0.17);

          float n = noise(st);        // 0..1
          n = clamp(n, 0.0, 1.0);

          // brightness deviation around 1.0 (e.g. 0.5..1.5)
          float amp = 0.5 * shimmerIntensity;
          float brightness = 1.0 + (n - 0.5) * 2.0 * amp;

          // build a white “boost” so highlights go to white, not grey
          vec3 whiteBoost = mix(vec3(0.0), vec3(1.0), max(0.0, brightness - 1.0));

          // add white highlight on top of original color
          vec3 finalRGB = baseSample.rgb + whiteBoost * 0.85;
          finalRGB = clamp(finalRGB, 0.0, 1.0);

          // slight alpha variation
          float alphaFactor = 1.0 + (n - 0.5) * 0.4 * shimmerIntensity;
          float finalA = baseSample.a * opacity * alphaFactor;
          finalA = clamp(finalA, 0.0, 1.0);

          gl_FragColor = vec4(finalRGB, finalA);
        }
      `
    });
  },

  applyMaterial: function () {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    const list = this.shaderMaterials;

    mesh.traverse((node) => {
      if (!node.isMesh) return;
      const oldMat = node.material;

      if (Array.isArray(oldMat)) {
        const newMats = [];
        for (let i = 0; i < oldMat.length; i++) {
          const m = oldMat[i];
          if (!m || !m.map) { newMats.push(m); continue; }
          const sm = this.makeShaderMaterial(m.map);
          newMats.push(sm);
          list.push(sm);
        }
        node.material = newMats;
      } else {
        if (!oldMat || !oldMat.map) return;
        const sm = this.makeShaderMaterial(oldMat.map);
        node.material = sm;
        list.push(sm);
      }
    });
  },

  tick: function (timeMs) {
    const t = timeMs / 1000.0;
    for (let i = 0; i < this.shaderMaterials.length; i++) {
      const m = this.shaderMaterials[i];
      if (m.uniforms.time) m.uniforms.time.value = t;
    }
  }
});