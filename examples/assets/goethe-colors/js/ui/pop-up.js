// Info Pop-up

(() => {
  /* =========================
     1) LANGUAGE (intro-overlay storage + browser fallback + toggle)
     ========================= */

  const LANGS = { EN: 'en', FR: 'fr' };
  const INTRO_STORAGE_KEY = 'intro-lang'; // MUST match intro-overlay storageKey

  function browserPrefLang() {
    const prefs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || 'en'];
    const first = String(prefs[0] || '').toLowerCase();
    return first.startsWith('fr') ? LANGS.FR : LANGS.EN;
  }

  function storedIntroLang() {
    try {
      const stored = localStorage.getItem(INTRO_STORAGE_KEY);
      if (!stored) return null;
      const lc = String(stored).toLowerCase();
      return lc.startsWith('fr') ? LANGS.FR : LANGS.EN;
    } catch (_) {
      return null;
    }
  }

  function syncLangFromIntroStorageOrBrowser() {
    currentLang = storedIntroLang() || browserPrefLang();
  }

  // initial guess (will be re-synced later anyway)
  let currentLang = storedIntroLang() || browserPrefLang();

  /* =========================
     2) CONTENT (EN / FR)
     ========================= */

  const CONTENT = {
    en: {
      infoBtn: 'Info',
      toggleLabel: 'FR / EN',
      menuTitleHTML: `
        This
        <a href="https://immersiveweb.dev/" target="_blank" rel="noopener noreferrer">WebXR</a>
        experience was created with
        <a href="https://aframe.io/" target="_blank" rel="noopener noreferrer">A-Frame</a>
        to highlight some fun that can be made with the
        <a href="https://github.com/rpetitjean/spatial-marker" target="_blank" rel="noopener noreferrer">Spatial-Marker component</a>,
        and it also opens ideas by Goethe on colors with music by Franz Liszt.
      `,
      back: '←',
      pages: {
        vr:     { title: '', text: 
        `<div class="info-videoWrap"><video src="assets/goethe-colors/Preview_Video.mp4" controls playsinline preload="metadata"></video></div>`, hideImage: true },
        about:  { title: 'About this experience', text: `This <a href="https://immersiveweb.dev/" target="_blank" rel="noopener noreferrer">WebXR</a> experience was thought to highlight some possibilities of the Spatial-Marker component for A-Frame. This component make it simple to set up a color palette and drawing areas in any A-frame experience. <br> <br>
        While working on this <a href="https://aframe.io/" target="_blank" rel="noopener noreferrer">A-Frame</a> component I got interested in how drawing in a 3D space was shaping deeper my comprehension and relationship with colors. Later I found about the studies of Newton and Goethe on colors and I got particularly intrigued by this diagram. I liked the idea of setting up a deeply researched scientific work on colors by Goethe to end up presenting this highly symbolic diagram, with not much explanations neither demonstration... and this is probably the fact that the poet minds often gets over the scientific mind! 
        <br> <br>
        By getting this diagram at the center of the room and by showing its meanings presented both in their german original and their english translations, I wished users to get a time to reflect on the possible meanings and nature of colors Goethe defined and to invite users to spend time with each of these 6 key colors.<br> 
        <br> 
        red = "schön" / beautiful ; orange = "edel" / noble ; yellow = "gut" / good ; green = "nützlich" / useful ; blue = "gemein" / common ; violet = "unnöthig" / unnecessary <br>
        red-orange "Vernunft" / Reason ; yellow-green "Verstand" / Understanding ; green-blue = "Sinnlichkeit" / Sensuality ; violet-red = "Phantasie / Fantasy"`, image: 'assets/goethe-colors/GIF/spatial-marker-gif.gif' },
        goethe: {
          title: 'Johann Wolfgang von Goethe (1749-1832)',
          text: `Writer, poet, playwright, and scientist, Goethe appears today as one of the brightest minds of the 18th and 19th centuries. <br> <br>
          A name that echoes in Germany with a deep resonance as in European Literary history. Goethe is the "father" romantic hero Werther, a young man exalted by nature, antic poetry and love. <br> <br>
          Goethe is also the author of play "Faust": the story of a man making a deal with the devil to reach a deeper and richer sense of life no humans ever reached. "Faust" opens deep reflections on the meaning of life and the research of an absolute. This is likely this absolute and his passion for paintings that would lead Goethe to study colors and to write his "Color Theory". Hundreds of pages of scientific exploration on the nature of colors, pigments, lights and their possible meanings... <br><br>
          The text is available in Public Domain
          <a href="https://www.gutenberg.org/cache/epub/50572/pg50572.txt" target="_blank" rel="noopener noreferrer">here</a>
          by the
          <a href="https://www.gutenberg.org/" target="_blank" rel="noopener noreferrer">Gutenberg Project</a>.`,
          image: 'assets/goethe-colors/GIF/Goethe-gif.gif'
        },
        liszt:  { title: 'Franz Liszt', text: `One of the most acclaimed pianists of his time. The name of Franz Liszt evokes a virtuoso who reached an "absolute" as a composer and a performer. Franz Liszt played all over Europe, being acclaimed in every city. The German writer Heinrich Heine would write about "Lisztomania".<br> <br>
        This piece, "Berceuse in D-Flat Major" was first composed in 1854 and reworked to this final version in 1862. It sounds like a stream of visions and melodies made of silence and high notes, low and fast rhythm. It invites us to let our minds flow in different movements. <br> <br>
        I hope it will accompany you well in exploring the possible meanings of colors. <br>
        <br>
        This piece from Liszt was made using a CC0 Piano by <a href="https://versilian-studios.com/vcsl-keys/" target="_blank" rel="noopener noreferrer">Versilian Studios</a>, and the music is free to use under the CC0 Licence.<br>
        <br>
        -> It is an amazing piece of music and I invite you to look through the different versions by great performers you will find on music platforms.`, image: 'assets/goethe-colors/GIF/Liszt-gif.gif' },
        marker: { title: 'Spatial-Marker', text: `The Spatial-Marker was created as an easy to set up drawing tool for <a href="https://aframe.io/" target="_blank" rel="noopener noreferrer">A-Frame</a> experiences.<br>
        <br>
        By setting one or multiple drawing areas and 24 hex color values, <a href="https://aframe.io/" target="_blank" rel="noopener noreferrer">A-Frame</a> creators can fastly and easily allow drawing in 3D in their WebXR experiences. This component comes with its own movement controls for VR, using the thumbsticks to move, the trigger to draw and the grip to swap hands.<br>
       <br>  The component is published <a href="https://github.com/rpetitjean/spatial-marker" target="_blank" rel="noopener noreferrer">here</a> under MIT License and you are free to use it. 
        <br> Also you can find further examples of what you can make with it <a href="https://rpetitjean.github.io/spatial-marker/" target="_blank" rel="noopener noreferrer">here</a>.`, image: 'assets/goethe-colors/GIF/Hello-About.gif' },
        free:   { title: 'MIT + CC0', text: `<a href="https://github.com/rpetitjean/spatial-marker" target="_blank" rel="noopener noreferrer">The Spatial-Marker component</a> code is published under MIT License and you are free to use it and for it. <br>
        <br>All assets here have been created by me, <a href="https://www.remipetitjean.com/" target="_blank" rel="noopener noreferrer">Rémi Petitjean</a>, or published under the Public Domain and are 100% free to use and re-use without credit mandatory. I release all the 3D assets and texture under CC0. <br>
        The music from Liszt was created using a CC0 Piano by <a href="<a href="https://versilian-studios.com/vcsl-keys/" target="_blank" rel="noopener noreferrer">Versilian Studios</a>, and the music is free to use under the CC0 Licence.  `, image: 'assets/goethe-colors/GIF/MITCC0.gif' }
      },
      menuButtons: {
        vr: 'Watch Preview Video',
        goethe: 'Johann Wolfgang von Goethe',
        liszt: 'Franz Liszt',
        marker: 'Spatial-Marker for A-Frame',
        free: 'MIT + CC0'
      }
    },

    fr: {
      infoBtn: 'Info',
      toggleLabel: 'FR / EN',
      menuTitleHTML: `
        Cette expérience
        <a href="https://immersiveweb.dev/" target="_blank" rel="noopener noreferrer">WebXR</a>
        a été créée avec
        <a href="https://aframe.io/" target="_blank" rel="noopener noreferrer">A-Frame</a>
        pour montrer ce qu’on peut faire avec le composant
        <a href="https://github.com/rpetitjean/spatial-marker" target="_blank" rel="noopener noreferrer">Spatial-Marker</a>,
        et pour ouvrir des pistes de réflexion de Goethe sur les couleurs, avec la musique de Franz Liszt.
      `,
      back: '←',
      pages: {
        vr:     { title: '', text: `<div class="info-videoWrap"><video src="assets/goethe-colors/Preview_Video.mp4" controls playsinline preload="metadata"></video></div>`, hideImage: true },
        about: { title: 'Quelques informations', text: `Cette expérience de <a href="https://immersiveweb.dev/" target="_blank" rel="noopener noreferrer">WebXR</a> a été créée afin d'explorer quelques possibilités offertes par le <a href="https://github.com/rpetitjean/spatial-marker" target="_blank" rel="noopener noreferrer">Spatial-Marker</a>, component pour le framework <a href="https://aframe.io/" target="_blank" rel="noopener noreferrer">A-Frame</a>. Ce component a pour but de proposer une solution simple pour dessiner en 3D via un projet créé avec A-Frame. <br>
        <br> En travaillant à la publication de ce component, j'ai réalisé que l'action de dessiner en 3D et en réalité virtuelle m'ouvrait à une appréhension plus profonde des couleurs. J'ai ensuite découvert les recherches de Newton et puis de Goethe sur les couleurs et j'ai trouvé ce diagramme intriguant, issu de la "Théorie des couleurs" de Goethe. Ce qui est particulièrement frappant c'est la distance qu'a ce diagramme avec toutes les observations scientifiques émises par Goethe sur les couleurs. Ce diagramme est symbolique, non scientifique, il ne repose sur rien d'autre que l'intuition et il est là au milieu de cette pièce pour ouvrir cette question: quelle est la signification des couleurs? <br>
        <br> rouge = "schön" / "beautiful ; orange = "edel" / noble ; jaune = "gut" / good ; vert = "nützlich" / useful ; bleu = "gemein" / common ; violet = "unnöthig" / unnecessary <br>
        rouge-orange "Vernunft" / Reason ; jaune-vert "Verstand" / Understanding ; vert-bleu = "Sinnlichkeit" / Sensuality ; violet-rouge = "Phantasie / Fantasy`, image: 'assets/goethe-colors/GIF/spatial-marker-gif.gif' },
        goethe: { title: 'Goethe', text: `Poète, auteur de théâtre et scientifique, Goethe sonne aujourd'hui comme le nom d'un des plus brillants esprits de son temps.<br>
<br> Un nom qui résonne en Allemagne comme dans toute l'histoire littéraire européenne. Goethe est le créateur du héros romantique Werther, un jeune exalté par la nature, par la poésie antique et par un amour (impossible).
<br> Goethe est aussi l'auteur de "Faust" : une pièce qui nous montre un homme qui a fait un pacte avec le diable en échange de la connaissance de la plus grande richesse et profondeur de la vie, telle qu'aucun.e humain.e ne l'a ressentie. "Faust" ouvre des réflexions profondes sur le sens de la vie et la recherche d'un "absolu". C'est peut-être cet "absolu" et sa passion pour la peinture qui l'amèneront à vouloir comprendre les couleurs et à réaliser sa vaste "Théorie des couleurs". Plusieurs centaines de pages d'exploration scientifique, sur la nature des couleurs, sur les pigments, sur la lumière ainsi que la potentielle signification des couleurs... <br> <br> 
Le texte est disponible dans le domaine public
<a href="https://www.gutenberg.org/cache/epub/50572/pg50572.txt" target="_blank" rel="noopener noreferrer">ici</a>
par le
<a href="https://www.gutenberg.org/" target="_blank" rel="noopener noreferrer">Projet Gutenberg</a>.`, image: 'assets/goethe-colors/GIF/Goethe-gif.gif' },
        liszt:  { title: 'Franz Liszt', text: `L'un des pianistes les plus acclamés de son temps.<br>
<br>
Le nom de Franz Liszt évoque un virtuose qui a atteint la perfection, à la fois comme interprète et comme compositeur. Franz Liszt a joué à travers l'Europe entière, triomphant dans chaque ville. L'écrivain allemand Heinrich Heine a qualifié l'effet de Liszt sur la scène musicale de « Lisztomania ».
<br><br>
Ce morceau, « Berceuse en ré bémol majeur », fut d'abord composé en 1854, puis retravaillé dans une version finale en 1862. Il résonne comme un flot de visions et de mélodies faites de silences et de notes hautes, basses et rapides. Il nous invite à laisser notre esprit flotter à travers différents mouvements.
<br><br>
J'espère qu'il vous accompagnera comme il se doit dans l'exploration des possibles significations des couleurs.
<br><br>
Ce morceau de Liszt a été réalisé en utilisant une bibliothèque de piano en CC0 par <a href="https://versilian-studios.com/vcsl-keys/" target="_blank" rel="noopener noreferrer">Versilian Studios</a>, et la musique est libre d'utilisation sous licence CC0.
<br><br>
→ C'est un morceau de musique très riche et étonnant, et je vous invite à découvrir les différentes versions interprétées par une multitude d'artistes, disponibles sur les plateformes de musique.
         `, image: 'assets/goethe-colors/GIF/Liszt-gif.gif' },
        marker: { title: 'Spatial-Marker', text: `Le <a href="https://github.com/rpetitjean/spatial-marker" target="_blank" rel="noopener noreferrer">Spatial-Marker</a> component a été créé comme une solution simple pour dessiner en 3D via un projet créé avec <a href="https://aframe.io/" target="_blank" rel="noopener noreferrer">A-Frame</a>.<br><br>
En définissant une ou plusieurs drawing areas ainsi que 24 valeurs de couleurs hex, les créateurs qui utilisent <a href="https://aframe.io/" target="_blank" rel="noopener noreferrer">A-Frame</a> peuvent rapidement et simplement permettre de dessiner en 3D à l’intérieur de l’espace 3D de leurs expériences <a href="https://immersiveweb.dev/" target="_blank" rel="noopener noreferrer">WebXR</a>.
Ce component est développé avec son propre modèle de locomotion, qui utilise le joystick pour le movement, le trigger pour dessiner et le grip pour le changement de main.

<br><br>
Le component est publié ici sous la licence MIT et est de fait libre d’utilisation.
<br>
Vous pourrez aussi trouver davantage d’exemples de l’usage de ce component sur cette page.
       `, image: 'assets/goethe-colors/GIF/Hello-About.gif' },
        free:   { title: 'MIT + CC0', text: `Le code du 
<a href="https://github.com/rpetitjean/spatial-marker" target="_blank" rel="noopener noreferrer">
Spatial-Marker component
</a>
est publié sous licence MIT et vous êtes libre de l’utiliser et de le modifier.
<br><br>

Tous les assets présentés ici ont été créés par moi, <a href="https://www.remipetitjean.com/" target="_blank" rel="noopener noreferrer">Rémi Petitjean</a>, ou sont publiés sous le Public Domain, et sont 100 % libres d’utilisation et de réutilisation, sans credit mandatory.  
Tous les assets 3D et les textures sont publiés sous licence CC0.
<br><br>

La musique de Liszt a été créée en utilisant une CC0 Piano par 
<a href="https://versilian-studios.com/vcsl-keys/" target="_blank" rel="noopener noreferrer">
Versilian Studios</a>, et la musique est free to use sous licence CC0.

`, image: 'assets/goethe-colors/GIF/MITCC0.gif' }
      },
      menuButtons: {
        vr: 'Voir la vidéo de présentation',
      about:  'Quelques informations',
        goethe: 'Johann Wolfgang von Goethe',
        liszt: 'Franz Liszt',
        marker: 'Spatial-Marker pour A-Frame',
        free: 'MIT + CC0'
      }
    }
  };

  const MENU_IMAGE = 'assets/goethe-colors/Spatial-marker.gif';

  /* =========================
     3) DOM
     ========================= */

  const btn = document.createElement('button');
  btn.className = 'intro-lang-switch';
  btn.textContent = 'Info';
  btn.style.left = '12px';
  btn.style.right = 'auto';
  btn.style.display = 'none';
  btn.style.zIndex = '99998';
  document.body.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.id = 'info-overlay';
  overlay.innerHTML = `
    <div id="info-modal" role="dialog" aria-modal="true" aria-label="Information">
      <img id="info-gif" src="${MENU_IMAGE}" alt="Info">
      <div id="info-content">
        <div id="info-menu">
          <button id="info-lang-toggle" type="button" class="info-link" style="min-height:40px;">FR / EN</button>
          <div class="info-menu-title" id="info-menu-title"></div>

          <button class="info-link" data-page="vr"></button>
          <button class="info-link" data-page="about"></button>
          <button class="info-link" data-page="goethe"></button>
          <button class="info-link" data-page="liszt"></button>
          <button class="info-link" data-page="marker"></button>
          <button class="info-link" data-page="free"></button>
        </div>

        <div id="info-detail" style="display:none;">
          <button id="info-back" type="button">←</button>
          <div id="info-title"></div>
          <div id="info-text"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const modal       = overlay.querySelector('#info-modal');
  const imgEl       = overlay.querySelector('#info-gif');
  const menu        = overlay.querySelector('#info-menu');
  const detail      = overlay.querySelector('#info-detail');
  const back        = overlay.querySelector('#info-back');
  const titleEl     = overlay.querySelector('#info-title');
  const textEl      = overlay.querySelector('#info-text');
  const menuTitleEl = overlay.querySelector('#info-menu-title');
  const toggleBtn   = overlay.querySelector('#info-lang-toggle');
  const menuButtons = Array.from(menu.querySelectorAll('.info-link[data-page]'));

  let enabled = false;
  let currentPage = null; // null = menu
  let onKeyDown = null;

  /* =========================
     4) IMAGE HANDLING
     ========================= */

  function setHeaderImage({ src, hide } = {}) {
    if (!imgEl) return;
    if (hide) {
      imgEl.style.display = 'none';
      imgEl.removeAttribute('src');
      return;
    }
    imgEl.style.display = 'block';
    if (src) imgEl.src = src;
  }

  /* =========================
     5) RENDER
     ========================= */

  function getLangPack() {
    return CONTENT[currentLang] || CONTENT.en;
  }

  function renderMenuTexts() {
    const L = getLangPack();
    btn.textContent = L.infoBtn || 'Info';
    toggleBtn.textContent = L.toggleLabel || 'FR / EN';
    menuTitleEl.innerHTML = L.menuTitleHTML || '';

    menuButtons.forEach(b => {
      const key = b.dataset.page;
      b.textContent = (L.menuButtons && L.menuButtons[key]) ? L.menuButtons[key] : key;
    });

    back.textContent = L.back || '←';
  }

  function showMenu() {
    currentPage = null;
    menu.style.display = 'block';
    detail.style.display = 'none';
    setHeaderImage({ src: MENU_IMAGE, hide: false });
    renderMenuTexts();
  }

  function showPage(key) {
    const L = getLangPack();
    const p = (L.pages && L.pages[key]) ? L.pages[key] : null;
    if (!p) return;

    currentPage = key;
    titleEl.textContent = p.title || '';
    textEl.innerHTML = p.text || '';
    setHeaderImage({ src: p.image, hide: !!p.hideImage });

    menu.style.display = 'none';
    detail.style.display = 'block';
  }

  /* =========================
     6) OPEN/CLOSE (✅ sync language right before opening)
     ========================= */

  function openModal() {
    if (!enabled) return;

    // ✅ bulletproof: always use same language as intro overlay (stored)
    syncLangFromIntroStorageOrBrowser();

    overlay.style.display = 'block';
    showMenu();

    onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKeyDown, true);
  }

  function closeModal() {
    overlay.style.display = 'none';
    if (onKeyDown) {
      document.removeEventListener('keydown', onKeyDown, true);
      onKeyDown = null;
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal();
  });

  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeModal();
  });

  modal.addEventListener('mousedown', (e) => e.stopPropagation());

  menu.addEventListener('click', (e) => {
    const b = e.target.closest('.info-link[data-page]');
    if (!b) return;
    showPage(b.dataset.page);
  });

  back.addEventListener('click', showMenu);

  /* =========================
     7) TOGGLE LANGUAGE
     ========================= */

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentLang = (currentLang === LANGS.FR) ? LANGS.EN : LANGS.FR;

    // keep in sync with intro-overlay “remembered language”
    try { localStorage.setItem(INTRO_STORAGE_KEY, currentLang); } catch (_) {}

    if (overlay.style.display === 'block') {
      if (currentPage) showPage(currentPage);
      else showMenu();
    } else {
      renderMenuTexts();
    }
  });

  /* =========================
     8) ENABLE AFTER INTRO (use intro event + also listen to language changes)
     ========================= */

  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.addEventListener('intro-start', (e) => {
      enabled = true;
      btn.style.display = 'block';

      // If intro provides a lang, use it; otherwise use stored/browser
      const introLang = String(e.detail?.lang || '').toLowerCase();
      if (introLang) currentLang = introLang.startsWith('fr') ? LANGS.FR : LANGS.EN;
      else syncLangFromIntroStorageOrBrowser();

      renderMenuTexts();
    }, { once: true });

    // Bonus: if user switches LANG on intro overlay later (you emit this)
    scene.addEventListener('intro-language-changed', (e) => {
      const l = String(e.detail?.lang || '').toLowerCase();
      if (!l) return;
      currentLang = l.startsWith('fr') ? LANGS.FR : LANGS.EN;
      renderMenuTexts();
    });
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      const s = document.querySelector('a-scene');
      if (!s) return;

      s.addEventListener('intro-start', (e) => {
        enabled = true;
        btn.style.display = 'block';

        const introLang = String(e.detail?.lang || '').toLowerCase();
        if (introLang) currentLang = introLang.startsWith('fr') ? LANGS.FR : LANGS.EN;
        else syncLangFromIntroStorageOrBrowser();

        renderMenuTexts();
      }, { once: true });

      s.addEventListener('intro-language-changed', (e) => {
        const l = String(e.detail?.lang || '').toLowerCase();
        if (!l) return;
        currentLang = l.startsWith('fr') ? LANGS.FR : LANGS.EN;
        renderMenuTexts();
      });
    });
  }

  /* =========================
     9) OPTIONAL: Debug (uncomment if needed)
     ========================= */
  // console.log('[info] navigator.language(s)=', navigator.languages, navigator.language);
  // console.log('[info] localStorage intro-lang=', (() => { try { return localStorage.getItem(INTRO_STORAGE_KEY); } catch(e){ return 'blocked'; } })());
})();
