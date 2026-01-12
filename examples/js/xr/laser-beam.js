AFRAME.registerComponent('laser-beam', {
  schema: {
    // beam shape
    length: { type: 'number', default: 0.6 },
    radius: { type: 'number', default: 0.0025 },

    // rendering mode
    mode: { type: 'string', default: 'occluded' }, // 'occluded' | 'xray'

    // hover fade
    idleColor:  { type: 'color', default: '#ffffff' },
    hoverColor: { type: 'color', default: '#00ff66' },
    fadeSpeed:  { type: 'number', default: 22 },

    /* =========================
       ZONE DISABLE (NEW)
       ========================= */
    disableInZones: { type: 'boolean', default: true },

    // which elements are "laser-off volumes"
    zoneSelector: { type: 'string', default: '.laser-zone' },

    // who we test position from
    rig: { type: 'selector', default: '#rig' },

    // how often to recompute boxes (ms)
    boxesUpdateMs: { type: 'number', default: 1000 },

    // expand zone boxes slightly (meters)
    boxPadding: { type: 'number', default: 0.08 },

    // also disable the hand raycaster/cursor while inside zones
    disableHandRaycaster: { type: 'boolean', default: true },

    // always keep native ray line invisible (Meta menu return fix)
    enforceHideNativeLine: { type: 'boolean', default: true }
  },

  init() {
    // Build cylinder once (axis = +Y by default)
    this.el.setAttribute('geometry', {
      primitive: 'cylinder',
      height: 1,
      radius: 1,
      openEnded: true,
      segmentsRadial: 18
    });

    // Reused objects for alignment
    this._up = new THREE.Vector3(0, 1, 0);
    this._dir = new THREE.Vector3();
    this._origin = new THREE.Vector3();
    this._q = new THREE.Quaternion();

    // Color fade state
    this._idle = new THREE.Color(this.data.idleColor);
    this._hover = new THREE.Color(this.data.hoverColor);
    this._current = this._idle.clone();
    this._target = this._idle.clone();

    // Intersections come from the HAND's raycaster (parent)
    this.hand = this.el.parentEl;

    this._onHit = (e) => {
      const els = (e.detail && e.detail.els) || [];
      const hovering = !!els[0];
      this._target.copy(hovering ? this._hover : this._idle);
    };
    this._onClear = () => {
      this._target.copy(this._idle);
    };

    if (this.hand) {
      this.hand.addEventListener('raycaster-intersection', this._onHit);
      this.hand.addEventListener('raycaster-intersection-cleared', this._onClear);
    }

    this._materialTweaked = false;

    /* =========================
       ZONE MANAGER (one per hand)
       ========================= */
    this._isManager = false;
    if (this.hand && this.data.disableInZones) {
      if (!this.hand.__laserBeamZoneMgr) {
        this._isManager = true;
        this.hand.__laserBeamZoneMgr = this._createZoneManager();
      }
    }
  },

  remove() {
    if (this.hand) {
      this.hand.removeEventListener('raycaster-intersection', this._onHit);
      this.hand.removeEventListener('raycaster-intersection-cleared', this._onClear);
    }
  },

  _createZoneManager() {
    const comp = this;

    const mgr = {
      disabled: false,
      lastBoxesUpdate: -Infinity,
      zones: [],   // { el, box }
      rigEl: comp.data.rig || document.querySelector('#rig'),
      rigPos: new THREE.Vector3(),

      rebuildZones() {
        const sceneEl = comp.el.sceneEl;
        const sel = String(comp.data.zoneSelector || '').trim();
        this.zones = [];

        if (!sceneEl || !sel) return;

        const els = Array.from(sceneEl.querySelectorAll(sel));
        this.zones = els.map(el => ({ el, box: null }));

        // when GLBs load, force box recompute
        this.zones.forEach(z => {
          const invalidate = () => { z.box = null; };
          z._invalidate = invalidate;
          z.el.addEventListener('model-loaded', invalidate);
          z.el.addEventListener('object3dset', invalidate);
        });
      },

      computeBoxes(force=false) {
        const now = performance.now();
        if (!force && (now - this.lastBoxesUpdate) < comp.data.boxesUpdateMs) return;
        this.lastBoxesUpdate = now;

        const pad = Math.max(0, comp.data.boxPadding || 0);

        for (const z of this.zones) {
          if (z.box) continue;

          const obj = z.el.getObject3D('mesh') || z.el.object3D;
          if (!obj) continue;

          const box = new THREE.Box3().setFromObject(obj);
          if (pad) box.expandByScalar(pad);
          z.box = box;
        }
      },

      isRigInsideAnyZone() {
        const rig = this.rigEl || (comp.data.rig || document.querySelector('#rig'));
        if (!rig || !rig.object3D) return false;

        rig.object3D.getWorldPosition(this.rigPos);

        for (const z of this.zones) {
          if (z.box && z.box.containsPoint(this.rigPos)) return true;
        }
        return false;
      },

      enforceHideNativeLine() {
        if (!comp.data.enforceHideNativeLine) return;
        if (!comp.hand) return;

        // Keep the default laser-controls line invisible even after Meta menu / pause.
        comp.hand.setAttribute('raycaster', 'showLine', false);
        comp.hand.setAttribute('line', 'opacity: 0; visible: false');
      },

      applyToHand(disable) {
        if (!comp.hand) return;

        if (comp.data.disableHandRaycaster) {
          comp.hand.setAttribute('raycaster', 'enabled', !disable);
          comp.hand.setAttribute('cursor', 'enabled', !disable);
        }

        // Also force-hide native line regardless
        this.enforceHideNativeLine();
      },

      tick() {
        // If zones appear later, rebuild occasionally (cheap)
        if (!this.zones.length) this.rebuildZones();

        this.enforceHideNativeLine();
        this.computeBoxes(false);

        const inside = this.isRigInsideAnyZone();
        if (inside !== this.disabled) {
          this.disabled = inside;
          this.applyToHand(this.disabled);
        }
      }
    };

    mgr.rebuildZones();
    mgr.computeBoxes(true);
    mgr.applyToHand(false);

    return mgr;
  },

  _tweakMaterialOnce() {
    if (this._materialTweaked) return;

    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    // Draw beams late.
    mesh.renderOrder = (this.data.mode === 'xray') ? 10001 : 10000;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      if (!m) return;

      m.depthWrite = false;
      m.transparent = true;

      if (this.data.mode === 'xray') m.depthTest = false;
      else m.depthTest = true;

      m.needsUpdate = true;
    });

    this._materialTweaked = true;
  },

  tick(time, dt) {
    // zone manager runs once per hand
    const mgr = this.hand && this.hand.__laserBeamZoneMgr;
    if (this._isManager && mgr) mgr.tick();

    // hide beams if inside any zone
    if (mgr && mgr.disabled) {
      if (this.el.object3D.visible) this.el.object3D.visible = false;
      return;
    } else {
      if (!this.el.object3D.visible) this.el.object3D.visible = true;
    }

    // Align to raycaster
    const hand = this.hand;
    const rc = hand && hand.components && hand.components.raycaster;
    if (!rc) return;

    this._tweakMaterialOnce();

    const d = rc.data;
    this._dir.set(d.direction.x, d.direction.y, d.direction.z);
    if (this._dir.lengthSq() < 1e-8) return;
    this._dir.normalize();

    this._origin.set(d.origin.x, d.origin.y, d.origin.z);

    const len = this.data.length;
    this.el.object3D.position.copy(this._origin).addScaledVector(this._dir, len * 0.5);
    this._q.setFromUnitVectors(this._up, this._dir);
    this.el.object3D.quaternion.copy(this._q);
    this.el.object3D.scale.set(this.data.radius, len, this.data.radius);

    // Fast color fade
    const dtSec = dt / 1000;
    const k = 1 - Math.exp(-this.data.fadeSpeed * dtSec);
    this._current.lerp(this._target, k);
    this.el.setAttribute('material', 'color', `#${this._current.getHexString()}`);
  }
});
