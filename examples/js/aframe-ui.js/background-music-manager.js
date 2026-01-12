// Background Music Manager

AFRAME.registerComponent('bgm-manager', {
  schema: {
    src: { type: 'string' },
    volume: { type: 'number', default: 0.5 }
  },

  init() {
    this.audio = null;

    this.started = false;   // user clicked Enter at least once
    this.enabled = true;    // user toggle intent

    // Start only when the INTRO Enter button is clicked
    this._onEnterClickCapture = (e) => {
      if (this.started) return;

      const btn = e.target.closest?.('.intro-overlay-buttons button');
      if (!btn) return;

      this.started = true;
      if (this.enabled) this._ensureAudioAndPlay();
    };
    document.addEventListener('click', this._onEnterClickCapture, true);

    // Public API for your UI button
    window.__bgm = {
      toggle: () => this.toggle(),
      play: () => this.play(),
      pause: () => this.pause(),
      isOn: () => this.enabled,          // UI intent
      isPlaying: () => this.isPlaying()
    };
  },

  remove() {
    document.removeEventListener('click', this._onEnterClickCapture, true);
  },

  _ensureAudio() {
    if (this.audio) return;

    this.audio = new Audio(this.data.src);
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.audio.volume = 0; // start silent until play succeeds
  },

  isPlaying() {
    return !!(this.audio && !this.audio.paused);
  },

  async _ensureAudioAndPlay() {
    this._ensureAudio();

    try {
      await this.audio.play();
    } catch (err) {
      console.warn('[bgm] play blocked/failed:', err);
      return;
    }

    this.audio.volume = this.data.volume;
    this.el.sceneEl.emit('bgm-toggled', { enabled: true });
  },

  play() {
    if (!this.started) return;
    if (!this.enabled) return;

    if (!this.audio || this.audio.paused) {
      this._ensureAudioAndPlay();
      return;
    }

    this.audio.volume = this.data.volume;
    this.el.sceneEl.emit('bgm-toggled', { enabled: true });
  },

  pause() {
    if (!this.audio || this.audio.paused) return;

    this.audio.volume = 0;
    this.audio.pause();

    this.el.sceneEl.emit('bgm-toggled', { enabled: false });
  },

  toggle() {
    // Allow toggling intent even before Enter
    this.enabled = !this.enabled;

    if (!this.started) {
      this.el.sceneEl.emit('bgm-toggled', { enabled: this.enabled });
      return;
    }

    if (this.enabled) this.play();
    else this.pause();

    this.el.sceneEl.emit('bgm-toggled', { enabled: this.enabled });
  }
});
