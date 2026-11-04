/* Original local soundtracks. AudioParam curves mix the tracks without a render loop. */
(() => {
  'use strict';
  const menu = document.getElementById('authScreen');
  if (!menu) return;
  const KEY = 'hellward_music_v1', FADE = 6;
  let settings = {enabled:true,volume:.32};
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (typeof saved?.enabled === 'boolean') settings.enabled = saved.enabled;
    if (Number.isFinite(saved?.volume)) settings.volume = Math.max(0,Math.min(1,saved.volume));
  } catch (_) {}
  const tracks = {
    menu: {file:'assets/audio/hellward-menu.mp3',title:'Portões das Cinzas'},
    battle: {file:'assets/audio/hellward-battle.mp3',title:'Marcha dos Condenados'}
  };
  let context, master, active = null, unlocked = false, unlocking = false, generation = 0, retireTimer, pending = null;
  const controls = [];
  function showStatus(message) {
    const status = document.getElementById('musicStatus');
    if (status) status.textContent = message;
    for (const group of controls) group.querySelector('[data-music-track]').textContent = message;
  }
  function save() { try {localStorage.setItem(KEY,JSON.stringify(settings));} catch (_) {} }
  function updateControls() {
    for (const group of controls) {
      const button = group.querySelector('button');
      button.textContent = settings.enabled ? '♫ Música ligada' : '♫ Música desligada';
      button.setAttribute('aria-pressed',String(settings.enabled));
      const slider = group.querySelector('input');
      slider.value = String(Math.round(settings.volume*100));
      slider.setAttribute('aria-valuetext',`${slider.value}%`);
      group.querySelector('output').textContent = `${slider.value}%`;
    }
  }
  function masterVolume() {
    if (master) master.gain.setTargetAtTime(settings.enabled ? settings.volume*.7 : 0,context.currentTime,.05);
  }
  function addControls(parent) {
    if (!parent) return;
    const group = document.createElement('div');
    group.className = 'hellward-audio-controls';
    group.innerHTML = '<button type="button" aria-pressed="true"></button><label>Volume <input type="range" min="0" max="100" step="1" aria-label="Volume da trilha sonora"><output></output></label><small data-music-track>Trilha aguardando início</small>';
    group.querySelector('button').addEventListener('click',()=>{
      settings.enabled = !settings.enabled;save();updateControls();masterVolume();sync();
    });
    group.querySelector('input').addEventListener('input',event=>{
      settings.volume = Number(event.target.value)/100;save();updateControls();masterVolume();
    });
    parent.append(group);controls.push(group);
  }
  addControls(document.getElementById('menuSettings'));
  addControls(document.getElementById('hudAudioControls'));
  updateControls();
  function setup() {
    if (context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context = new AudioContext();
    master = context.createGain();master.gain.value = 0;master.connect(context.destination);
    for (const track of Object.values(tracks)) {
      track.audio = new Audio(track.file);track.audio.preload = 'auto';track.audio.loop = true;
      track.audio.addEventListener('error',()=>{
        const status = document.getElementById('musicStatus');
        if (status) status.textContent = 'Não foi possível carregar a trilha. Você pode tentar ligar a música novamente.';
      });
      track.gain = context.createGain();track.gain.gain.value = 0;
      context.createMediaElementSource(track.audio).connect(track.gain);track.gain.connect(master);
    }
  }
  function halt() {
    ++generation;clearTimeout(retireTimer);active = null;pending = null;
    if (!context) return;
    for (const track of Object.values(tracks)) {
      track.audio.pause();track.gain.gain.cancelScheduledValues(context.currentTime);track.gain.gain.setValueAtTime(0,context.currentTime);
    }
    context.suspend().catch(()=>{});
  }
  function fade(param,target) {
    const now = context.currentTime;
    const from = param.value;
    // Cancel old ramps before scheduling: rapid scene changes cannot overlap curves.
    param.cancelScheduledValues(now);
    param.setValueAtTime(from,now);
    param.linearRampToValueAtTime(target,now+FADE);
  }
  async function sync() {
    if (!unlocked) return;
    if (!settings.enabled || document.hidden) {halt();showStatus(settings.enabled?'Música pausada':'Música desligada');return;}
    const next = menu.hidden ? 'battle' : 'menu';
    if (pending===next) return;
    if (active===next && !tracks[next].audio.paused) {
      if (pending) {++generation;pending=null;}
      return;
    }
    const request = ++generation;pending = next;
    clearTimeout(retireTimer);
    try {
      await context.resume();
      await tracks[next].audio.play();
      if (request!==generation || next!==(menu.hidden?'battle':'menu') || !settings.enabled || document.hidden) {
        if ((menu.hidden?'battle':'menu')!==next || !settings.enabled || document.hidden) tracks[next].audio.pause();
        return;
      }
      masterVolume();
      for (const [name,track] of Object.entries(tracks)) fade(track.gain.gain,name===next?1:0);
      active = next;
      retireTimer = setTimeout(()=>{
        if (active===next) for (const [name,track] of Object.entries(tracks)) if(name!==next) track.audio.pause();
      },FADE*1000+150);
      showStatus(`Tocando: ${tracks[next].title}`);
    } catch (error) {
      if (request===generation) {
        if (active!==next) tracks[next].audio.pause();
        showStatus('Não foi possível trocar a trilha. Desligue e ligue a música para tentar novamente.');
        console.warn('Hellward soundtrack transition failed:',error);
      }
    } finally {
      if (request===generation) pending = null;
    }
  }
  async function unlock(event) {
    if (unlocked || unlocking || event.isComposing) return;
    unlocking = true;
    try {
      setup();
      if (!context) return;
      await context.resume();unlocked = true;sync();
    } catch (_) { /* A later user gesture can retry a blocked audio context. */ }
    finally {unlocking=false;}
  }
  document.addEventListener('pointerdown',unlock,{capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('visibilitychange',()=>{if(unlocked) sync();});
  document.addEventListener('hellward:scenechange',sync);
  new MutationObserver(sync).observe(menu,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pagehide',halt);
  window.addEventListener('pageshow',()=>{if(unlocked) sync();});
})();
