(function () {
  if (typeof AFRAME === 'undefined') {
    console.warn('[intro-overlay] A-Frame not found.');
    return;
  }

  // Inject minimal CSS once
  if (!document.getElementById('intro-overlay-style')) {
    const style = document.createElement('style');
    style.id = 'intro-overlay-style';
    style.textContent = `
      .intro-lang-switch{
        position:fixed; top:12px; right:12px; z-index:100000;
        padding:8px 12px; border-radius:10px; border:1px solid rgba(0,0,0,.15);
        background:#fff; color:#000; font-weight:700; cursor:pointer;
        box-shadow:0 6px 20px rgba(0,0,0,.15); backdrop-filter:blur(6px);
        pointer-events:auto; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      .intro-lang-switch:hover{ filter:brightness(1.05); }

      .intro-overlay-root{
        position: fixed; inset: 0; z-index: 99999;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        opacity: 1;
        transition: opacity 900ms ease, background-color 250ms ease;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      .intro-overlay-root.fade-to-black{
        background-color: #000;
      }
      .intro-overlay-root.fade-out{
        opacity: 0;
      }
      .intro-overlay-root.exiting{ pointer-events: none; }

      .intro-overlay-text{
        max-width: 600px; margin: 8px auto; padding: 0 20px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        font-weight: 500; font-size: 1rem; line-height: 1.6; text-align: center;
        transition: opacity 800ms ease, transform 800ms ease;
      }
      .intro-overlay-root.exiting .intro-overlay-text{
        opacity: 0; transform: translateY(-10px) scale(0.98);
      }

      .intro-overlay-text img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      .intro-overlay-buttons{
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 6px 0;
        opacity: 0;
        transform: translateY(10px) scale(0.98);
        pointer-events: none;
        transition: opacity 500ms ease, transform 500ms ease;
      }
      .intro-overlay-buttons.visible{
        opacity: 1;
        transform: none;
        pointer-events: auto;
      }
      .intro-overlay-root.exiting .intro-overlay-buttons{
        opacity: 0; transform: translateY(10px) scale(0.98);
      }

      .intro-overlay-buttons button{
        padding: 12px 16px; border-radius: 12px; border: 1px solid #fff;
        background: #000; color: #fff; font-weight: 700; cursor: pointer;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      .intro-overlay-buttons button:hover{ filter: brightness(1.1); }

      .intro-overlay-status{
        font-size: 0.9rem;
        opacity: 0.85;
      }

      @keyframes intro-overlay-img-fade-in {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }

        .intro-overlay-text img.intro-diagram {
  width: 5rem;
  height: auto;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0,0,0,0);

}

    `;
    document.head.appendChild(style);
  }

  AFRAME.registerComponent('intro-overlay', {
    schema: {
      // Visual
      backgroundColor: { type: 'string', default: '#ffffff' },
      textColor:       { type: 'string', default: '#000000' },
      fontFamily:      { type: 'string', default: '' },
      fontSize:        { type: 'string', default: '1rem' },

      // Typing / pacing
      charSpeed:        { type: 'number', default: 50 },   // ms per character
      lineGap:          { type: 'number', default: 150 },  // ms pause on <br>
      imageFadeDuration:{ type: 'number', default: 800 },  // ms for image fade-in

      // Generic text slots
      text1: { type: 'string', default: '' },
      text2: { type: 'string', default: '' },

      // Language codes (you choose: fr/en/it/es/…)
      lang1Code: { type: 'string', default: 'fr' },
      lang2Code: { type: 'string', default: 'en' },

      // Button labels per language
      buttonLabel1: { type: 'string', default: 'Entrer' },
      buttonLabel2: { type: 'string', default: 'Enter' },

      // Loading texts per language (+ generic fallback)
      loadingText1: { type: 'string', default: 'Chargement des assets…' },
      loadingText2: { type: 'string', default: 'Loading assets…' },
      loadingText:  { type: 'string', default: 'Loading assets…' },

      // Behaviour
      rememberLang: { type: 'boolean', default: true },
      storageKey:   { type: 'string', default: 'intro-lang' },
      autoDetect:   { type: 'boolean', default: true },
      defaultLang:  { type: 'string', default: '' }, // if empty → lang1Code
      showSwitch:   { type: 'boolean', default: true }
    },

    init: function () {
      const sceneEl = this.el.sceneEl || this.el;
      this.sceneEl = sceneEl;

      this.lang = null;
      this._typingToken = 0;
      this._textDone = false;
      this._assetsDone = false;
      this._buttonVisible = false;

      this._buildOverlayDOM();
      this._setupAssetsWait();

      if (sceneEl.hasLoaded) this._boot();
      else sceneEl.addEventListener('loaded', () => this._boot(), { once: true });
    },

    update: function () {
      if (!this.overlay) return;
      const d = this.data;

      this.overlay.style.backgroundColor = d.backgroundColor;
      this.textEl.style.color = d.textColor;
      this.statusSpan.style.color = d.textColor;

      if (d.fontFamily) {
        this.textEl.style.fontFamily = d.fontFamily;
        this.enterBtn.style.fontFamily = d.fontFamily;
        this.langButton.style.fontFamily = d.fontFamily;
      }

      if (d.fontSize) {
        this.textEl.style.fontSize = d.fontSize;
        this.statusSpan.style.fontSize = `calc(${d.fontSize} * 0.9)`;
      }
    },

    remove: function () {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.remove();
      }
      if (this.langButton && this.langButton.parentNode) {
        this.langButton.remove();
      }
    },

    /* ---------- DOM creation ---------- */

    _buildOverlayDOM: function () {
      const data = this.data;

      // Top-right language switch
      this.langButton = document.createElement('button');
      this.langButton.className = 'intro-lang-switch';
      this.langButton.textContent = 'LANG';
      this.langButton.style.display = 'none';
      document.body.appendChild(this.langButton);

      // Main overlay
      const overlay = document.createElement('div');
      overlay.className = 'intro-overlay-root';
      overlay.style.display = 'flex';
      overlay.style.backgroundColor = data.backgroundColor;

      const textEl = document.createElement('div');
      textEl.className = 'intro-overlay-text';
      textEl.style.color = data.textColor;
      textEl.style.fontSize = data.fontSize || '1rem';
      if (data.fontFamily) textEl.style.fontFamily = data.fontFamily;

      const buttonsWrap = document.createElement('div');
      buttonsWrap.className = 'intro-overlay-buttons';

      const statusSpan = document.createElement('div');
      statusSpan.className = 'intro-overlay-status';
      statusSpan.style.display = 'none';
      statusSpan.style.color = data.textColor;
      statusSpan.style.fontSize = `calc(${data.fontSize || '1rem'} * 0.9)`;
      statusSpan.textContent = data.loadingText;

      const enterBtn = document.createElement('button');
      enterBtn.type = 'button';
      enterBtn.textContent = 'Enter';
      enterBtn.disabled = true;

      if (data.fontFamily) {
        enterBtn.style.fontFamily = data.fontFamily;
        this.langButton.style.fontFamily = data.fontFamily;
      }

      buttonsWrap.appendChild(statusSpan);
      buttonsWrap.appendChild(enterBtn);
      overlay.appendChild(textEl);
      overlay.appendChild(buttonsWrap);
      document.body.appendChild(overlay);

      this.overlay = overlay;
      this.textEl = textEl;
      this.buttonsWrap = buttonsWrap;
      this.enterBtn = enterBtn;
      this.statusSpan = statusSpan;

      // Events
      this._onEnterClick = this._onEnterClick.bind(this);
      this._onLangSwitchClick = this._onLangSwitchClick.bind(this);

      enterBtn.addEventListener('click', this._onEnterClick);
      this.langButton.addEventListener('click', this._onLangSwitchClick);
    },

    _setupAssetsWait: function () {
      const sceneEl = this.sceneEl;
      const assetsEl = sceneEl.querySelector('a-assets');

      if (!assetsEl) {
        this._assetsDone = true;
        return;
      }

      if (assetsEl.hasLoaded) {
        this._assetsDone = true;
        return;
      }

      assetsEl.addEventListener('loaded', () => {
        this._assetsDone = true;
        this._maybeShowButton();
      }, { once: true });
    },

    /* ---------- Boot / language choice ---------- */

    _boot: function () {
      const data = this.data;
      const has1 = !!data.text1.trim();
      const has2 = !!data.text2.trim();

      let lang = data.defaultLang || data.lang1Code || 'en';

      // 1) localStorage
      if (data.rememberLang) {
        try {
          const stored = localStorage.getItem(data.storageKey);
          if (stored) lang = stored;
        } catch (e) {}
      }

      // 2) auto-detect from navigator
      if (data.autoDetect) {
        const prefs = (navigator.languages && navigator.languages.length ?
          navigator.languages : [navigator.language || 'en']
        ).map(s => String(s || '').toLowerCase());

        const l1 = (data.lang1Code || '').toLowerCase();
        const l2 = (data.lang2Code || '').toLowerCase();

        const wants1 = l1 && prefs.some(code => code.startsWith(l1));
        const wants2 = l2 && prefs.some(code => code.startsWith(l2));

        if (wants1 && has1) lang = data.lang1Code;
        else if (wants2 && has2) lang = data.lang2Code;
        else if (wants1 && !has1 && has2) lang = data.lang2Code;
        else if (wants2 && !has2 && has1) lang = data.lang1Code;
      }

      // 3) if no text, bail
      if (!has1 && !has2) {
        console.warn('[intro-overlay] No text provided (text1 / text2 empty).');
        this.overlay.style.display = 'none';
        this.langButton.style.display = 'none';
        
        this.sceneEl.emit('intro-start', { lang: null });
        return;
      }

      // clamp lang to 1 or 2 if necessary
      if (lang !== data.lang1Code && lang !== data.lang2Code) {
        lang = data.lang1Code || data.lang2Code || 'en';
      }

      this.lang = lang;
      this._storeLang();
      this._emitLanguageChanged();

      // lang switch label
      const upper1 = (data.lang1Code || '').toUpperCase();
      const upper2 = (data.lang2Code || '').toUpperCase();
      this.langButton.textContent = upper1 && upper2 ? `${upper1} / ${upper2}` : 'LANG';

      // show switch only if 2 texts & allowed
      if (has1 && has2 && data.showSwitch) {
        this.langButton.style.display = 'block';
      } else {
        this.langButton.style.display = 'none';
      }

      this._startTypingForCurrentLang();
    },

    _getTextForLang: function (lang) {
      const d = this.data;
      if (lang === d.lang1Code) return d.text1.trim() || d.text2.trim();
      if (lang === d.lang2Code) return d.text2.trim() || d.text1.trim();
      return d.text1.trim() || d.text2.trim();
    },

    _getLoadingTextForLang: function () {
      const d = this.data;
      if (this.lang === d.lang1Code && d.loadingText1.trim()) return d.loadingText1.trim();
      if (this.lang === d.lang2Code && d.loadingText2.trim()) return d.loadingText2.trim();
      return d.loadingText.trim() || 'Loading assets…';
    },

    _startTypingForCurrentLang: function () {
      const html = this._getTextForLang(this.lang);
      this.textEl.innerHTML = '';
      this._textDone = false;
      this._buttonVisible = false;

      this.buttonsWrap.classList.remove('visible');
      this.buttonsWrap.style.display = 'none';
      this.statusSpan.style.display = 'none';
      this.enterBtn.style.display = 'none';
      this.enterBtn.disabled = true;

      this._updateEnterLabel();

      this._typewriter(
        this.textEl,
        html,
        this.data.charSpeed,
        this.data.lineGap,
        () => {
          this._textDone = true;
          this._maybeShowButton();
        }
      );
    },

    /* ---------- Typewriter with <img> fade-in ---------- */

_typewriter: function (el, html, speed, gap, onDone) {
  const token = ++this._typingToken;

  const temp = document.createElement('div');
  temp.innerHTML = html.trim();

  // tokens:
  // - string  → single character
  // - {type:'br'}
  // - {type:'img', attrs:{...}}
  const tokens = [];

  function collect(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text) return;
      tokens.push(...text.split(''));
      return;
    }

    if (node.nodeName === 'BR') {
      tokens.push({ type: 'br' });
      return;
    }

    if (node.nodeName === 'IMG') {
      const attrs = {};
      const names = node.getAttributeNames ? node.getAttributeNames() : [];
      names.forEach(name => {
        attrs[name] = node.getAttribute(name);
      });
      tokens.push({ type: 'img', attrs });
      return;
    }

    if (node.childNodes && node.childNodes.length) {
      node.childNodes.forEach(collect);
    }
  }

  collect(temp);

  // Clear container & start building DOM nodes
  while (el.firstChild) el.removeChild(el.firstChild);
  let i = 0;
  const self = this;
  let currentTextNode = null;

  function step() {
    if (self._typingToken !== token) return; // cancelled

    if (i < tokens.length) {
      const next = tokens[i++];

      // Line break
      if (typeof next === 'object' && next.type === 'br') {
        const br = document.createElement('br');
        el.appendChild(br);
        currentTextNode = null;
        setTimeout(step, gap);
        return;
      }

      // Image token: create element, fade it in
      if (typeof next === 'object' && next.type === 'img') {
        const img = document.createElement('img');
        const attrs = next.attrs || {};
        Object.keys(attrs).forEach(name => {
          img.setAttribute(name, attrs[name]);
        });

        img.style.opacity = '0';
        img.style.margin = img.style.margin || '16px auto';

        const duration = Math.max(0, self.data.imageFadeDuration || 800);
        img.style.animation = `intro-overlay-img-fade-in ${duration}ms ease forwards`;

        el.appendChild(img);
        currentTextNode = null;

        setTimeout(step, gap);
        return;
      }

      // Single character → append to current text node
      if (!currentTextNode || currentTextNode.parentNode !== el) {
        currentTextNode = document.createTextNode(next);
        el.appendChild(currentTextNode);
      } else {
        currentTextNode.data += next;
      }

      setTimeout(step, speed);
    } else {
      if (onDone) onDone();
    }
  }

  step();
},


    /* ---------- Button & loading ---------- */

    _maybeShowButton: function () {
      if (!this._textDone) return;

      this.buttonsWrap.style.display = 'flex';
      if (!this._buttonVisible) {
        this._buttonVisible = true;
        setTimeout(() => {
          this.buttonsWrap.classList.add('visible');
        }, 200);
      }

      if (!this._assetsDone) {
        this.statusSpan.style.display = 'block';
        this.statusSpan.textContent = this._getLoadingTextForLang();
        this.enterBtn.style.display = 'none';
        this.enterBtn.disabled = true;
      } else {
        this.statusSpan.style.display = 'none';
        this.enterBtn.style.display = 'inline-block';
        this.enterBtn.disabled = false;
      }
    },

    _updateEnterLabel: function () {
      const d = this.data;
      let label = d.buttonLabel1 || 'Enter';
      if (this.lang === d.lang2Code && d.buttonLabel2) {
        label = d.buttonLabel2;
      }
      this.enterBtn.textContent = label;
    },

    _onEnterClick: function () {
      this._storeLang();

      this.overlay.classList.add('exiting');
      this.overlay.classList.add('fade-to-black');

      setTimeout(() => {
        this.overlay.classList.add('fade-out');
      }, 260);

      setTimeout(() => {
        this.overlay.style.display = 'none';
        this.langButton.style.display = 'none';
        this.sceneEl.emit('intro-start', { lang: this.lang });
        console.log('[intro-overlay] experience started with lang =', this.lang);
      }, 260 + 920);
    },

    /* ---------- Language switch ---------- */

    _onLangSwitchClick: function () {
      const d = this.data;
      const current = this.lang || d.lang1Code;
      const next = (current === d.lang1Code) ? d.lang2Code : d.lang1Code;

      this.lang = next;
      this._storeLang();
      this._emitLanguageChanged();
      this._updateEnterLabel();

      if (!this._assetsDone && this._buttonVisible) {
        this.statusSpan.textContent = this._getLoadingTextForLang();
      }

      if (this.overlay.style.display !== 'none') {
        this._startTypingForCurrentLang();
      }
    },

    _storeLang: function () {
      if (!this.data.rememberLang) return;
      try {
        localStorage.setItem(this.data.storageKey, this.lang);
      } catch (e) {}
    },

    _emitLanguageChanged: function () {
      this.sceneEl.emit('intro-language-changed', { lang: this.lang });
      console.log('[intro-overlay] language changed to:', this.lang);
    }
  });
})();
