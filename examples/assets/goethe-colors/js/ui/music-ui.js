// JS for Music UI 

const ICON_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M11.596 8.697 6.214 11.96A.5.5 0 0 1 5.5 11.53V4.47a.5.5 0 0 1 .714-.43l5.382 3.263a.5.5 0 0 1 0 .894z"/></svg>`;
const ICON_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 3.5A.5.5 0 0 1 6 4v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm5 0A.5.5 0 0 1 11 4v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/></svg>`;

function refreshMusicIcon(){
  const on = window.__bgm?.isOn?.() ?? false;
  document.getElementById('icon-music').innerHTML = on ? ICON_PAUSE : ICON_PLAY;
}
document.getElementById('btn-music').addEventListener('click', ()=>{
  window.__bgm?.toggle?.();
  refreshMusicIcon();
});
function bindBgmIconToScene(){
  const scene = document.querySelector('a-scene');
  if (!scene) return false;
  scene.addEventListener('bgm-toggled', refreshMusicIcon);
  refreshMusicIcon();
  return true;
}

window.addEventListener('DOMContentLoaded', () => {
  // Try now, and if scene isn't there yet, retry a few times.
  if (bindBgmIconToScene()) return;
  let tries = 0;
  const t = setInterval(() => {
    tries++;
    if (bindBgmIconToScene() || tries > 50) clearInterval(t);
  }, 50);
});
