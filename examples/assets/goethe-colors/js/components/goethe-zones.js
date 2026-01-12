// Goethe Zones script (with laser enable/disable event) + laser-zone-disable component 

AFRAME.registerComponent('goethe-zones', {
  schema: {
    rig: { type: 'selector', default: '#rig' },

    // If true, leaving all zones does NOT reset to default palette.
    keepLastPaletteOutside: { type: 'boolean', default: true }
  },

  init: function () {
    this.rig = this.data.rig || document.querySelector('#rig');

    this.currentZoneKey = null;   // 'orange' | 'blue' | ...
    this._rigPos = new THREE.Vector3();

    // --- palettes (your exact values) ---
    this.palettes = {
      blue: [
        '#081427','#3572ee','#0b1a33','#3a7aff',
        '#0f2244','#4584ff','#132a55','#4f8eff',
        '#163266','#5998ff','#193a77','#63a2ff',
        '#1d4288','#6dacff','#214a99','#77b6ff',
        '#2552aa','#81c0ff','#295abb','#8bcaFF',
        '#2d62cc','#95d4ff','#316add','#9fdeff'
      ],
      green: [
        '#06210f','#36ca63','#0a2f16','#3ad86a',
        '#0e3d1d','#3fe672','#124c24','#49ec7a',
        '#165a2b','#54f283','#1a6832','#5ff88b',
        '#1e7639','#6aff94','#228440','#75ff9d',
        '#269247','#80ffa6','#2aa04e','#8bffaf',
        '#2eae55','#96ffb8','#32bc5c','#a1ffc1'
      ],
      indigo: [
        '#130827','#6737b7','#1a0b33','#6e3bc3',
        '#210f3f','#7540cf','#28134b','#7c44db',
        '#2f1757','#8348e7','#361b63','#8a4cf3',
        '#3d1f6f','#9150ff','#44237b','#9b5aff',
        '#4b2787','#a564ff','#522b93','#af6eff',
        '#592f9f','#b978ff','#6033ab','#c382ff'
      ],
      orange: [
        '#2b1304','#ea7217','#3a1a05','#fa7a19',
        '#4a2206','#ff8423','#5a2a07','#ff8f35',
        '#6a3208','#ff9a47','#7a3a09','#ffa559',
        '#8a420b','#ffb06b','#9a4a0d','#ffbb7d',
        '#aa520f','#ffc68f','#ba5a11','#ffd1a1',
        '#ca6213','#ffdcb3','#da6a15','#ffe7c5'
      ],
      red: [
        '#2b0404','#ea1717','#3a0505','#fa1919',
        '#4a0606','#ff2323','#5a0707','#ff3535',
        '#6a0808','#ff4747','#7a0909','#ff5959',
        '#8a0b0b','#ff6b6b','#9a0d0d','#ff7d7d',
        '#aa0f0f','#ff8f8f','#ba1111','#ffa1a1',
        '#ca1313','#ffb3b3','#da1515','#ffc5c5'
      ],
      yellow: [
        '#3f3300','#f9cc00','#514000','#ffd11a',
        '#635000','#ffd633','#756000','#ffdb4d',
        '#877000','#ffe066','#998000','#ffe580',
        '#ab9000','#ffea99','#b89a00','#ffefb3',
        '#c5a400','#fff4cc','#d2ae00','#fff9e6',
        '#dfb800','#fffaf0','#ecc200','#fffdf7'
      ]
    };

    // --- zone entities (use YOUR ids, map to palette keys explicitly) ---
    this.zones = [
      { key: 'orange', el: document.querySelector('#navmesh-orange-element'), box: new THREE.Box3() },
      { key: 'blue',   el: document.querySelector('#navmesh-blue-element'),   box: new THREE.Box3() },
      { key: 'red',    el: document.querySelector('#navmesh-red-element'),    box: new THREE.Box3() },
      { key: 'yellow', el: document.querySelector('#navmesh-yellow-element'), box: new THREE.Box3() },
      { key: 'green',  el: document.querySelector('#navmesh-green-element'),  box: new THREE.Box3() },
      { key: 'indigo', el: document.querySelector('#navmesh-indigo-element'), box: new THREE.Box3() }
    ];

    // --- spatial-marker readiness ---
    this._spatialReady = false;
    this._pendingZoneKey = null;

    this._checkSpatialReady = () => {
      const r = this.rig;
      if (!r) return false;
      const sm = r.components && r.components['spatial-marker'];
      if (sm) {
        this._spatialReady = true;
        return true;
      }
      return false;
    };

    // When any component initializes on rig, see if it's spatial-marker
    this._onCompInit = (e) => {
      if (!e || e.detail?.name !== 'spatial-marker') return;
      this._spatialReady = true;

      // If we queued a zone while SM wasn't ready, apply now
      if (this._pendingZoneKey) {
        this._applyPalette(this._pendingZoneKey);
        this._pendingZoneKey = null;
      }
    };

    if (this.rig) {
      this.rig.addEventListener('componentinitialized', this._onCompInit);
      // Also try immediately (in case it's already ready)
      this._checkSpatialReady();
    }
  },

  remove: function () {
    if (this.rig && this._onCompInit) {
      this.rig.removeEventListener('componentinitialized', this._onCompInit);
    }
  },

  tick: function () {
    if (!this.rig || !this.rig.object3D) return;

    // Always refresh readiness (covers edge cases / reloads)
    if (!this._spatialReady) this._checkSpatialReady();

    this.rig.object3D.getWorldPosition(this._rigPos);

    let activeKey = null;

    for (const z of this.zones) {
      if (!z.el) continue;

      // mesh can be on 'mesh' object3D, but fallback is fine
      const obj = z.el.getObject3D('mesh') || z.el.object3D;
      if (!obj) continue;

      // Recompute box (cheap enough for 6 zones, avoids stale bounds)
      z.box.setFromObject(obj);

      if (z.box.containsPoint(this._rigPos)) {
        activeKey = z.key;
        break;
      }
    }

    if (activeKey === this.currentZoneKey) return;

    // Zone changed event (scene-level is easiest for listeners)
    const sceneEl = this.el.sceneEl || this.el; // works even if attached to <a-scene>
    sceneEl.emit('goethe-zone-changed', { name: activeKey });

    // Apply palette (or keep last palette when outside)
    if (activeKey) {
      if (this._spatialReady) this._applyPalette(activeKey);
      else this._pendingZoneKey = activeKey;
    } else {
      if (!this.data.keepLastPaletteOutside) {
        // Optional: reset to default if you want.
        // If you want a custom "default" palette, set it here.
      }
    }

    this.currentZoneKey = activeKey;
  },

  _applyPalette: function (zoneKey) {
    const palette = this.palettes[zoneKey];
    if (!palette || !palette.length) return;

    const rig = this.rig;
    if (!rig) return;

    const colors = palette.slice(); // clone

    // ✅ Most reliable: emit the event your system listens to
    rig.emit('spatial-marker-colors-changed', {
      colors,
      zone: zoneKey
    });

    // ✅ Also set the component attribute (covers reload / fresh init cases)
    // Try both styles to be robust across schema changes:
    try {
      rig.setAttribute('spatial-marker', { colors });
    } catch (_) {}

    try {
      // If schema parses strings, this helps too:
      rig.setAttribute('spatial-marker', 'colors', colors);
    } catch (_) {}

    // "Win" against late init that might overwrite defaults:
    requestAnimationFrame(() => {
      try { rig.setAttribute('spatial-marker', { colors }); } catch (_) {}
      rig.emit('spatial-marker-colors-changed', { colors, zone: zoneKey });
    });

    console.log('[goethe-zones] active zone:', zoneKey);
  }
});
