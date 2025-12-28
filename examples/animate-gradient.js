AFRAME.registerComponent('gradient-color', {
  schema: {
    color1:     { type: 'color',  default: '#0040ff' },
    color2:     { type: 'color',  default: '#e3e1fe' },
    color3:     { type: 'color',  default: '#ff6b6b' },  // optional extra colors
    color4:     { type: 'color',  default: '#ffd93b' },
    color5:     { type: 'color',  default: '#4ecdc4' },
    color6:     { type: 'color',  default: '#ffffff' },
    colorCount: { type: 'int',    default: 2 },          // from 2 to 6

    opacity:     { type: 'number', default: 1 },
    marbleMix:   { type: 'number', default: 0.1 },
    roughness:   { type: 'number', default: 0.8 },
    metalness:   { type: 'number', default: 0.0 },
    speed:       { type: 'number', default: 1 },         // animation speed
    originalMix: { type: 'number', default: 0.5 }        // 0 = full gradient, 1 = full original
  },

  init: function () {
    const data = this.data;
    const el   = this.el;
    const self = this;

    // Load marble texture
    const loader = new THREE.TextureLoader();
    this.marbleMap = loader.load(
      'assets/joystick-images/3D Elements/waternormals.jpg',
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      }
    );

    el.addEventListener('model-loaded', () => {
      const mesh = el.getObject3D('mesh');
      if (!mesh) return;

      mesh.traverse((node) => {
        if (!node.isMesh || !node.material) return;

        const oldMat    = node.material;
        const normalMap = oldMat.normalMap || null;
        const baseMap   = oldMat.map || null;
        const baseColor = oldMat.color ? oldMat.color.clone() : new THREE.Color(1, 1, 1);

        const uniforms = {
          time:           { value: 0 },
          speed:          { value: data.speed },

          color1:         { value: new THREE.Color(data.color1) },
          color2:         { value: new THREE.Color(data.color2) },
          color3:         { value: new THREE.Color(data.color3) },
          color4:         { value: new THREE.Color(data.color4) },
          color5:         { value: new THREE.Color(data.color5) },
          color6:         { value: new THREE.Color(data.color6) },
          colorCount:     { value: THREE.MathUtils.clamp(data.colorCount, 2, 6) },

          opacity:        { value: data.opacity },
          marbleMix:      { value: data.marbleMix },
          roughness:      { value: THREE.MathUtils.clamp(data.roughness, 0.0, 1.0) },
          metalness:      { value: THREE.MathUtils.clamp(data.metalness, 0.0, 1.0) },

          // Original material info
          baseColor:      { value: baseColor },
          baseMap:        { value: baseMap },
          useBaseMap:     { value: baseMap ? 1 : 0 },
          originalMix:    { value: THREE.MathUtils.clamp(data.originalMix, 0.0, 1.0) },

          marbleMap:      { value: self.marbleMap },
          normalMap:      { value: normalMap },
          normalStrength: { value: 1.0 },
          useNormalMap:   { value: normalMap ? 1 : 0 },
          lightDirection: { value: new THREE.Vector3(0.3, 0.7, 0.5).normalize() },
          ambient:        { value: 0.3 }
        };

        node.material = new THREE.ShaderMaterial({
          transparent: data.opacity < 1.0 || !!oldMat.transparent,
          uniforms: uniforms,
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            precision mediump float;

            uniform float time;
            uniform float speed;

            uniform vec3  color1;
            uniform vec3  color2;
            uniform vec3  color3;
            uniform vec3  color4;
            uniform vec3  color5;
            uniform vec3  color6;
            uniform int   colorCount;

            uniform float opacity;
            uniform float marbleMix;
            uniform float roughness;
            uniform float metalness;
            uniform sampler2D marbleMap;

            // Original material
            uniform vec3  baseColor;
            uniform sampler2D baseMap;
            uniform int   useBaseMap;
            uniform float originalMix; // 0 = full gradient, 1 = full original

            uniform sampler2D normalMap;
            uniform float normalStrength;
            uniform int   useNormalMap;

            uniform vec3  lightDirection;
            uniform float ambient;

            varying vec2 vUv;
            varying vec3 vNormal;

            // Simple 2D random + noise
            float random(in vec2 st) {
              return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453);
            }
            float noise(in vec2 st) {
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

            // Map t in [0,1] to 2–6 color gradient based on colorCount
            vec3 multiGradient(float t) {
              t = clamp(t, 0.0, 1.0);

              if (colorCount <= 2) {
                return mix(color1, color2, t);
              } else if (colorCount == 3) {
                float seg = 0.5;
                if (t < seg) {
                  return mix(color1, color2, t / seg);
                } else {
                  return mix(color2, color3, (t - seg) / seg);
                }
              } else if (colorCount == 4) {
                float seg = 1.0 / 3.0;
                if (t < seg) {
                  return mix(color1, color2, t / seg);
                } else if (t < 2.0 * seg) {
                  return mix(color2, color3, (t - seg) / seg);
                } else {
                  return mix(color3, color4, (t - 2.0 * seg) / seg);
                }
              } else if (colorCount == 5) {
                float seg = 1.0 / 4.0;
                if (t < seg) {
                  return mix(color1, color2, t / seg);
                } else if (t < 2.0 * seg) {
                  return mix(color2, color3, (t - seg) / seg);
                } else if (t < 3.0 * seg) {
                  return mix(color3, color4, (t - 2.0 * seg) / seg);
                } else {
                  return mix(color4, color5, (t - 3.0 * seg) / seg);
                }
              } else { // colorCount == 6
                float seg = 1.0 / 5.0;
                if (t < seg) {
                  return mix(color1, color2, t / seg);
                } else if (t < 2.0 * seg) {
                  return mix(color2, color3, (t - seg) / seg);
                } else if (t < 3.0 * seg) {
                  return mix(color3, color4, (t - 2.0 * seg) / seg);
                } else if (t < 4.0 * seg) {
                  return mix(color4, color5, (t - 3.0 * seg) / seg);
                } else {
                  return mix(color5, color6, (t - 4.0 * seg) / seg);
                }
              }
            }

            void main() {
              float t = time * speed;

              // --- Distort UVs with time-based noise
              vec2 uv2 = vUv;
              uv2.x += noise(vUv * 5.0 + t) * 0.1;
              uv2.y += noise(vUv * 5.0 - t) * 0.1;

              // Wavy factor
              float wave = sin(uv2.x * 10.0 + t + uv2.y * 0.5) * 0.5 + 0.5;
              wave = mix(wave, noise(vUv * 3.0 + t), 0.25);

              // Gradient between up to 6 colors + marble
              vec3 gradColor = multiGradient(wave);
              vec2 uvMap = vUv * 2.0 + vec2(t * 0.05);
              vec3 mapColor = texture2D(marbleMap, uvMap).rgb;
              vec3 gradientColor = mix(gradColor, mapColor, marbleMix);

              // Original texture beneath
              vec3 baseTex = baseColor;
              if (useBaseMap == 1) {
                baseTex *= texture2D(baseMap, vUv).rgb;
              }

              // Mix gradient overlay with original material
              // originalMix: 0 = full gradient, 1 = full original
              vec3 surfaceColor = mix(gradientColor, baseTex, originalMix);

              // --- Lighting with optional normal map ---
              vec3 n = normalize(vNormal);
              if (useNormalMap == 1) {
                vec3 nTex = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
                n = normalize(n + nTex * normalStrength);
              }

              vec3 l = normalize(lightDirection);
              float diff = max(dot(n, l), 0.0);

              // Simple specular using roughness/metalness
              vec3 v = normalize(vec3(0.0, 0.0, 1.0));  // approximate view dir
              vec3 h = normalize(l + v);
              float nh = max(dot(n, h), 0.0);
              float shininess = mix(4.0, 64.0, 1.0 - roughness);
              float spec = pow(nh, shininess);

              vec3 baseSpecColor = vec3(0.04);
              vec3 specColor = mix(baseSpecColor, surfaceColor, metalness);

              float lighting = ambient + diff;
              lighting = clamp(lighting, 0.0, 1.0);

              vec3 litColor = surfaceColor * lighting + specColor * spec * 0.5;

              gl_FragColor = vec4(litColor, opacity);
            }
          `
        });

        node.material.side = oldMat.side;
        node.material.needsUpdate = true;
      });
    });
  },

  // Reactive updates
  update: function (oldData) {
    const data = this.data;
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    mesh.traverse((node) => {
      if (!node.isMesh || !node.material || !node.material.uniforms) return;
      const u = node.material.uniforms;

      if (u.color1)       u.color1.value.set(data.color1);
      if (u.color2)       u.color2.value.set(data.color2);
      if (u.color3)       u.color3.value.set(data.color3);
      if (u.color4)       u.color4.value.set(data.color4);
      if (u.color5)       u.color5.value.set(data.color5);
      if (u.color6)       u.color6.value.set(data.color6);
      if (u.colorCount)   u.colorCount.value = THREE.MathUtils.clamp(data.colorCount, 2, 6);

      if (u.opacity)      u.opacity.value = data.opacity;
      if (u.marbleMix)    u.marbleMix.value = data.marbleMix;
      if (u.roughness)    u.roughness.value = THREE.MathUtils.clamp(data.roughness, 0.0, 1.0);
      if (u.metalness)    u.metalness.value = THREE.MathUtils.clamp(data.metalness, 0.0, 1.0);
      if (u.speed)        u.speed.value = data.speed;
      if (u.originalMix)  u.originalMix.value = THREE.MathUtils.clamp(data.originalMix, 0.0, 1.0);

      node.material.needsUpdate = true;
    });
  },

  tick: function (time) {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    mesh.traverse((node) => {
      if (!node.isMesh || !node.material || !node.material.uniforms) return;
      if (node.material.uniforms.time) {
        node.material.uniforms.time.value = time / 1000; // seconds
      }
    });
  }
});
