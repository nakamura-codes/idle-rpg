/* Local animation layers aligned to the original 1672 x 941 menu artwork. */
(() => {
  'use strict';
  const menu = document.getElementById('authScreen');
  if (!menu) return;
  const scene = document.createElement('div');
  scene.className = 'hw-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1672 941" focusable="false">
    <defs>
      <radialGradient id="hw-fire-fade"><stop offset="0.55" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
      <radialGradient id="hw-cloud-fade"><stop offset="0.5" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
      <radialGradient id="hw-fire-light"><stop stop-color="#ff941e" stop-opacity=".24"/><stop offset="1" stop-color="#ff6416" stop-opacity="0"/></radialGradient>
      <mask id="hw-fire-mask" maskUnits="userSpaceOnUse" x="435" y="490" width="215" height="325"><ellipse cx="550" cy="670" rx="102" ry="146" fill="url(#hw-fire-fade)"/></mask>
      <mask id="hw-cloud-mask" maskUnits="userSpaceOnUse" x="970" y="25" width="660" height="320"><ellipse cx="1300" cy="180" rx="325" ry="150" fill="url(#hw-cloud-fade)"/></mask>
      <clipPath id="hw-banner-clip"><path d="M199 151 L326 174 L301 345 L280 421 L258 490 L236 547 L224 559 L229 491 L208 520 L219 450 L199 470 L207 403 L183 421 L196 354 L180 371 L193 302 L182 296 Z"/></clipPath>
      <filter id="hw-fire-wave" filterUnits="userSpaceOnUse" x="430" y="485" width="225" height="335" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".026 .055" numOctaves="1" seed="12" result="noise"><animate attributeName="baseFrequency" values=".026 .055;.034 .07;.026 .055" dur="1.4s" repeatCount="indefinite"/></feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="hw-banner-wave" filterUnits="userSpaceOnUse" x="170" y="130" width="170" height="445" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".008 .018" numOctaves="1" seed="3" result="noise"><animate attributeName="baseFrequency" values=".008 .018;.012 .023;.008 .018" dur="5s" repeatCount="indefinite"/></feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="hw-cloud-drift" filterUnits="userSpaceOnUse" x="960" y="15" width="680" height="340" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".003 .008" numOctaves="1" seed="6" result="noise"><animate attributeName="baseFrequency" values=".003 .008;.004 .009;.003 .008" dur="48s" repeatCount="indefinite"/></feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <image href="assets/menu/cenario/fundo-livre.jpg" width="1672" height="941"/>
    <g mask="url(#hw-cloud-mask)"><image href="assets/menu/cenario/fundo-livre.jpg" width="1672" height="941" filter="url(#hw-cloud-drift)"/></g>
    <g clip-path="url(#hw-banner-clip)"><image href="assets/menu/cenario/fundo-livre.jpg" width="1672" height="941" filter="url(#hw-banner-wave)"/></g>
    <g mask="url(#hw-fire-mask)"><image href="assets/menu/cenario/fundo-livre.jpg" width="1672" height="941" filter="url(#hw-fire-wave)"/></g>
    <ellipse class="hw-fire-glow" cx="546" cy="744" rx="175" ry="135" fill="url(#hw-fire-light)"/>
  </svg>`;
  menu.prepend(scene);
  const svg = scene.querySelector('svg');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function resize() {
    const width = menu.clientWidth, height = menu.clientHeight;
    const scale = Math.max(width / 1672, height / 941);
    const position = width <= 700 ? .35 : .5;
    Object.assign(svg.style, {
      width: `${1672 * scale}px`, height: `${941 * scale}px`,
      left: `${(width - 1672 * scale) * position}px`, top: `${(height - 941 * scale) / 2}px`
    });
  }
  function sync() {
    const active = !menu.hidden && !document.hidden && !reduced.matches;
    scene.classList.toggle('is-paused', !active);
    if (active) { resize(); svg.unpauseAnimations(); }
    else { svg.pauseAnimations(); if (reduced.matches) svg.setCurrentTime(0); }
  }
  new ResizeObserver(resize).observe(menu);
  new MutationObserver(sync).observe(menu, {attributes:true, attributeFilter:['hidden']});
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  sync();
})();
