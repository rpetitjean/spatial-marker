// Fade on Event: fades-in and out the three info texts when clicking a defined object

AFRAME.registerComponent('fade-on-event', {
  schema: {
    targets:      { type: 'string' },           // CSS selector: "#goethe-text, .caption"
    event:        { type: 'string', default: 'click' },
    duration:     { type: 'number', default: 2 },   // fade in/out duration (seconds)
    from:         { type: 'number', default: 0 },   // hidden opacity
    to:           { type: 'number', default: 1 },   // visible opacity
    delay:        { type: 'number', default: 0 },   // delay before fade-in (seconds)
    hold:         { type: 'number', default: 0 },   // time fully visible before fade-out (0 = no auto fade-out)
    once:         { type: 'boolean', default: false }, // if true: only first full cycle
    autoInit:     { type: 'boolean', default: true },  // hide targets at init
    group:        { type: 'string',  default: '' }     // group name for mutual exclusion
  },

  init: function () {
    this.targets = [];

    // state machine: 'idle' | 'delay' | 'fadeIn' | 'hold' | 'fadeOut'
    this.state = 'idle';
    this.timer = 0;
    this._alreadyTriggered = false;
    this.lastOpacity = this.data.from;
    this.fadeStartOpacity = this.data.from;

    this._updateTargetList();

    if (this.data.autoInit) {
      this._hideTargetsImmediately();
    }

    if (this.data.event === 'click') {
      this.el.classList.add('clickable');
    }

    this._onEvent = this._onEvent.bind(this);
    this._onGlobalFadeStart = this._onGlobalFadeStart.bind(this);

    this.el.addEventListener(this.data.event, this._onEvent);

    const sceneEl = this.el.sceneEl || document.querySelector('a-scene');
    if (sceneEl) {
      sceneEl.addEventListener('fade-on-event-started', this._onGlobalFadeStart);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onEvent);
    const sceneEl = this.el.sceneEl || document.querySelector('a-scene');
    if (sceneEl) {
      sceneEl.removeEventListener('fade-on-event-started', this._onGlobalFadeStart);
    }
  },

  update: function (oldData) {
    if (!oldData || oldData.targets !== this.data.targets) {
      this._updateTargetList();
      if (this.data.autoInit) {
        this._hideTargetsImmediately();
      }
    }
  },

  _updateTargetList: function () {
    const sel = this.data.targets;
    if (!sel) {
      this.targets = [];
      return;
    }
    const sceneEl = this.el.sceneEl || document.querySelector('a-scene');
    if (!sceneEl) {
      this.targets = [];
      return;
    }
    this.targets = Array.from(sceneEl.querySelectorAll(sel));
  },

  _hideTargetsImmediately: function () {
    this.targets.forEach((el) => {
      el.setAttribute('visible', false);
      el.addEventListener('model-loaded', () => {
        this._setOpacityOnMesh(el, this.data.from);
      });
    });
  },

  _onEvent: function () {
    // Ignore if an animation is already running
    if (this.state !== 'idle') return;

    // If single-use and already did one full cycle, ignore
    if (this.data.once && this._alreadyTriggered) return;

    // Announce to the group that THIS one is starting
    const sceneEl = this.el.sceneEl || document.querySelector('a-scene');
    if (sceneEl && this.data.group) {
      sceneEl.emit('fade-on-event-started', {
        group: this.data.group,
        source: this.el
      });
    }

    this._alreadyTriggered = true;
    this.timer = 0;

    if (this.data.delay > 0) {
      this.state = 'delay';
    } else {
      this.state = 'fadeIn';
      this.fadeStartOpacity = this.data.from;
    }

    this._setOpacityAll(this.data.from);
  },

  // When another member of the same group starts, fade THIS one out
  _onGlobalFadeStart: function (e) {
    const detail = e.detail || {};
    const group = detail.group;
    const source = detail.source;

    if (!group || group !== this.data.group) return;
    if (source === this.el) return; // that's us, ignore

    // If currently idle and already at "from", nothing to do
    if (this.state === 'idle' && this.lastOpacity <= this.data.from + 0.001) {
      return;
    }

    // Start a smooth fade-out from current opacity → from
    this.state = 'fadeOut';
    this.timer = 0;
    this.fadeStartOpacity = this.lastOpacity;
  },

  _setOpacityAll: function (value) {
    this.lastOpacity = value;
    this.targets.forEach((el) => this._setOpacityOnMesh(el, value));
  },

  _setOpacityOnMesh: function (el, value) {
    const v = THREE.MathUtils.clamp(value, 0, 1);
    const mesh = el.getObject3D('mesh');

    el.setAttribute('visible', v > 0.01);

    if (!mesh) return;

    mesh.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];

      mats.forEach((mat) => {
        if (!mat) return;

        mat.transparent = true;
        mat.opacity = v;
        mat.needsUpdate = true;

        if (mat.uniforms && mat.uniforms.opacity) {
          mat.uniforms.opacity.value = v;
        }
      });
    });
  },

  tick: function (time, dt) {
    if (this.state === 'idle' || this.targets.length === 0) return;

    const dtSec = dt / 1000;
    const data  = this.data;
    const dur   = Math.max(data.duration, 0.0001);

    this.timer += dtSec;

    switch (this.state) {
      case 'delay': {
        if (this.timer >= data.delay) {
          this.state = 'fadeIn';
          this.fadeStartOpacity = data.from;
          this.timer = 0;
        }
        break;
      }

      case 'fadeIn': {
        const p = Math.min(this.timer / dur, 1);
        const v = THREE.MathUtils.lerp(this.fadeStartOpacity, data.to, p);
        this._setOpacityAll(v);

        if (p >= 1) {
          this.timer = 0;
          if (data.hold > 0) {
            this.state = 'hold';
          } else {
            this.state = 'idle';
          }
        }
        break;
      }

      case 'hold': {
        if (this.timer >= data.hold) {
          this.state = 'fadeOut';
          this.fadeStartOpacity = this.lastOpacity; // should be ~data.to
          this.timer = 0;
        }
        break;
      }

      case 'fadeOut': {
        const p = Math.min(this.timer / dur, 1);
        const v = THREE.MathUtils.lerp(this.fadeStartOpacity, data.from, p);
        this._setOpacityAll(v);

        if (p >= 1) {
          this.state = 'idle';
        }
        break;
      }
    }
  }
});
