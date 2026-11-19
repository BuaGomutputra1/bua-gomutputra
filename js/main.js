const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Missing images: show a labeled grey placeholder instead of a broken icon
const toPlaceholder = img => {
  if (!img.dataset.label) { img.style.display = 'none'; return; }
  const ph = document.createElement('div');
  ph.className = 'ph ' + (img.className || '');
  ph.textContent = img.dataset.label;
  if (img.style.aspectRatio) ph.style.aspectRatio = img.style.aspectRatio;
  if (img.closest('.tile')) ph.style.height = '100%';
  img.replaceWith(ph);
};
document.querySelectorAll('img[data-label]').forEach(img => {
  if (img.complete && img.naturalWidth === 0) toPlaceholder(img);
  else img.addEventListener('error', () => toPlaceholder(img));
});

// Mobile menu
const nav = document.querySelector('.nav');
document.querySelector('.menu-btn')?.addEventListener('click', () => nav.classList.toggle('open'));

// Hero line: "is a designer who" stays, the ending types itself
const typed = document.querySelector('.typer .typed');
if (typed && !reduce) {
  const ends = JSON.parse(typed.parentElement.dataset.phrases);
  let i = 0;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    while (true) {
      await wait(1900);
      const box = typed.parentElement;
      box.classList.add('busy');
      for (let t = typed.textContent; t.length; t = t.slice(0, -1)) { typed.textContent = t.slice(0, -1); await wait(28); }
      i = (i + 1) % ends.length;
      await wait(300);
      for (const ch of ends[i]) { typed.textContent += ch; await wait(55 + Math.random() * 45); }
      box.classList.remove('busy');
    }
  })();
}

// Live LA clock
const clock = document.querySelector('[data-clock]');
if (clock) {
  const tick = () => clock.textContent = 'LOS ANGELES  ·  ' + new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
  tick(); setInterval(tick, 30000);
}

// Pixel reveal (About photo grid only): images start as blurred squares and sharpen on hover (phones: on scroll)
const hoverable = matchMedia('(hover: hover)').matches;
document.querySelectorAll('.dump .cell img').forEach(img => {
  const slot = img.closest('.cell');
  const cv = document.createElement('canvas'); cv.className = 'px'; slot.appendChild(cv);
  const ctx = cv.getContext('2d');
  let anim, size = 28;
  const draw = block => {
    const r = slot.getBoundingClientRect(); if (!r.width || !img.naturalWidth) return;
    const W = Math.round(r.width), H = Math.round(r.height);
    cv.width = W; cv.height = H;
    const sw = Math.max(1, Math.ceil(W / block)), sh = Math.max(1, Math.ceil(H / block));
    const off = document.createElement('canvas'); off.width = sw; off.height = sh;
    const o = off.getContext('2d');
    const cs = getComputedStyle(img), iw = img.naturalWidth, ih = img.naturalHeight;
    const pos = cs.objectPosition.split(' ').map(v => v.endsWith('%') ? parseFloat(v) / 100 : (v === 'left' || v === 'top' ? 0 : v === 'right' || v === 'bottom' ? 1 : .5));
    o.fillStyle = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : '#ECECEC';
    o.fillRect(0, 0, sw, sh);
    if (cs.objectFit === 'contain') {
      const s = Math.min(sw / iw, sh / ih); o.drawImage(img, (sw - iw * s) * pos[0], (sh - ih * s) * (pos[1] ?? .5), iw * s, ih * s);
    } else {
      const s = Math.max(W / iw, H / ih), cw = W / s, ch = H / s;
      o.drawImage(img, (iw - cw) * pos[0], (ih - ch) * (pos[1] ?? .5), cw, ch, 0, 0, sw, sh);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, sw, sh, 0, 0, sw * block, sh * block);
  };
  const ready = () => { draw(size); };
  img.complete ? ready() : img.addEventListener('load', ready);
  addEventListener('resize', () => { if (!cv.classList.contains('gone')) draw(size); });
  const reveal = () => {
    cancelAnimationFrame(anim); const steps = [16, 9, 5, 3]; let k = 0, t0 = 0;
    const tick = t => { if (!t0) t0 = t; if (t - t0 > 70) { t0 = t; if (k < steps.length) draw(steps[k++]); else { cv.classList.add('gone'); return; } } anim = requestAnimationFrame(tick); };
    anim = requestAnimationFrame(tick);
  };
  const hide = () => { cancelAnimationFrame(anim); draw(size); cv.classList.remove('gone'); };
  if (reduce) { cv.classList.add('gone'); return; }
  if (hoverable) { slot.addEventListener('mouseenter', reveal); slot.addEventListener('mouseleave', hide); slot.addEventListener('focus', reveal); slot.addEventListener('blur', hide); }
  else new IntersectionObserver((es, ob) => es.forEach(e => { if (e.isIntersecting) { setTimeout(reveal, 250); ob.unobserve(slot); } }), { threshold: .6 }).observe(slot);
});

// Home status line: live LA time
const la = document.querySelector('[data-la]');
if (la) {
  const tick = () => la.textContent = 'LA ' + new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
  tick(); setInterval(tick, 30000);
}

// Carousel
document.querySelectorAll('.carousel').forEach(c => {
  const track = c.querySelector('.track'), wrap = c.querySelector('.track-wrap');
  const cards = [...track.children], prev = c.querySelector('.prev'), next = c.querySelector('.next');
  const count = c.querySelector('.count'), bar = c.querySelector('.progress i');
  const step = () => cards[0].getBoundingClientRect().width + 20;
  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    const idx = Math.round(track.scrollLeft / step());
    const visible = Math.max(1, Math.round(track.clientWidth / step()));
    const first = Math.min(idx + 1, cards.length);
    count.textContent = (innerWidth < 760 ? first : `${first}–${Math.min(idx + visible, cards.length)}`) + ' / ' + cards.length + (innerWidth < 760 ? '  ·  Swipe →' : '');
    bar.style.width = Math.min(100, (idx + visible) / cards.length * 100) + '%';
    prev && (prev.disabled = track.scrollLeft < 4);
    next && (next.disabled = track.scrollLeft >= max);
    wrap.classList.toggle('end', track.scrollLeft >= max);
  };
  c.querySelectorAll('.next, .next-overlay').forEach(b => b.addEventListener('click', () => track.scrollBy({ left: step() })));
  prev?.addEventListener('click', () => track.scrollBy({ left: -step() }));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update); update();
});

// Scroll reveals (ending animation + fade-ups)
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('.ending, .reveal').forEach(el => reduce ? el.classList.add('seen') : io.observe(el));

// Case study: click any image to see it big (lightbox)
const zoomables = document.querySelectorAll('.cs2 .blk figure img, .cs2 .fig img, .cs2 .card img, .cs2 .hero-img, .cs-head ~ .media img, .section img');
if (zoomables.length) {
  const lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<img alt=""><p>Click anywhere or press Esc to close</p>'; document.body.appendChild(lb);
  const big = lb.querySelector('img');
  const close = () => lb.classList.remove('on');
  zoomables.forEach(img => {
    img.classList.add('zoomable'); img.tabIndex = 0;
    const open = () => { big.src = img.currentSrc || img.src; big.alt = img.alt; lb.classList.add('on'); };
    img.addEventListener('click', open);
    img.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  });
  lb.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// Magnifying glass: a round lens follows the mouse over project images and zooms in (mouse only)
if (zoomables.length && matchMedia('(hover: hover)').matches && document.body.classList.contains('theme-sideby')) {
  const lens = document.createElement('div'); lens.className = 'lens'; lens.setAttribute('aria-hidden', 'true'); document.body.appendChild(lens);
  const Z = 1.6, R = 120;
  const posOf = v => v.endsWith('%') ? parseFloat(v) / 100 : (v === 'left' || v === 'top') ? 0 : (v === 'right' || v === 'bottom') ? 1 : .5;
  zoomables.forEach(img => {
    let geo = null;
    const measure = () => {
      const r = img.getBoundingClientRect(), iw = img.naturalWidth, ih = img.naturalHeight; if (!iw) return null;
      const cs = getComputedStyle(img), fit = cs.objectFit, [px, py = '50%'] = cs.objectPosition.split(' ');
      const s = fit === 'contain' ? Math.min(r.width / iw, r.height / ih) : fit === 'fill' ? null : Math.max(r.width / iw, r.height / ih);
      const dw = s ? iw * s : r.width, dh = s ? ih * s : r.height;
      return { r, dw, dh, ox: (r.width - dw) * posOf(px), oy: (r.height - dh) * posOf(py) };
    };
    img.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; geo = measure(); if (!geo) return; lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`; lens.style.backgroundSize = `${geo.dw * Z}px ${geo.dh * Z}px`; lens.classList.add('on'); });
    img.addEventListener('pointermove', e => {
      if (!geo) return; geo.r = img.getBoundingClientRect();
      const x = e.clientX - geo.r.left - geo.ox, y = e.clientY - geo.r.top - geo.oy;
      lens.style.transform = `translate3d(${e.clientX - R}px, ${e.clientY - R}px, 0)`;
      lens.style.backgroundPosition = `${R - x * Z}px ${R - y * Z}px`;
    });
    img.addEventListener('pointerleave', () => { geo = null; lens.classList.remove('on'); });
  });
  addEventListener('scroll', () => lens.classList.remove('on'), { passive: true });
}

// Project tiles: flower cursor grows into a "View <project>" pill (mouse only)
const projTiles = document.querySelectorAll('a.slot, [data-pill]');
if (projTiles.length && matchMedia('(hover: hover)').matches) {
  document.documentElement.classList.add('has-pill');
  const pill = document.createElement('div');
  pill.className = 'cursor-pill';
  pill.innerHTML = '<svg viewBox="0 0 108 136" aria-hidden="true"><path d="M53.92 0L78.64 24.87C85.53 31.77 95.15 40.48 100.04 48.56C105.12 56.9 107.79 66.48 107.75 76.24C107.75 95.6 99.93 106.57 87.05 119.51C76.57 106.2 65.65 94.19 54.08 81.89C49.85 86.4 43.97 93.4 39.67 97.36C12.93 122.06 47.2 135.72 69.83 135.47C36.01 136.21 -0.12 109.84 0 76.17C-0.01 66.63 2.54 57.27 7.38 49.06C12.44 40.46 22.52 31.4 29.78 24.15L53.92 0Z"/></svg><span></span>';
  document.body.appendChild(pill);
  const label = pill.querySelector('span');
  addEventListener('pointermove', e => { pill.style.transform = `translate3d(${e.clientX - 9}px, ${e.clientY - 12}px, 0)`; }, { passive: true });
  projTiles.forEach(t => {
    const name = t.querySelector('.tag b')?.textContent || t.querySelector('img')?.alt || 'project';
    t.addEventListener('pointerenter', () => { label.textContent = t.dataset.pill || ('View ' + name); pill.classList.add('on'); });
    t.addEventListener('pointerleave', () => pill.classList.remove('on'));
  });
}

// Tiles bounce in as they scroll into view
const slots = document.querySelectorAll('.slot');
if (slots.length && !reduce && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-anim');
  document.querySelectorAll('.col').forEach(col => [...col.children].forEach((s, i) => s.style.transitionDelay = (i % 3) * 90 + 'ms'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); setTimeout(() => e.target.style.transitionDelay = '', 1200); } }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  slots.forEach(s => io.observe(s));
}

// Home swirls follow the mouse: they drift, tilt and stretch as you move left and right
const swL = document.querySelector('.sw-l'), swR = document.querySelector('.sw-r');
if (swL && swR && !reduce && matchMedia('(hover: hover)').matches) {
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  document.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  const loop = () => {
    x += (tx - x) * .06; y += (ty - y) * .06;
    swL.style.transform = `translate(${x * -46}px, ${y * 18}px) rotate(${x * 7}deg) scale(${1 + Math.abs(x) * .06}, ${1 - Math.abs(x) * .03})`;
    swR.style.transform = `translate(${x * 60}px, ${y * -14}px) rotate(${x * -5}deg) scale(${1 + Math.abs(x) * .05}, ${1 + y * .04})`;
    requestAnimationFrame(loop);
  };
  loop();
}

// Floating flowers in the header (from Figma): drift, spin, bounce off the edges, scatter away from the mouse
const sheet = document.querySelector('.home .sheet'), firstTile = document.querySelector('.mosaic');
if (sheet && firstTile) {
  const SPECS = [[350,158,55.0,0],[1159,197,55.6,7],[160,118,34.3,23],[950,352,40.4,41],[1317,335,28.9,57],[108,402,29.0,-27]]; // [centerX, centerY, size, rotation] in the 1440-wide Figma frame
  const field = document.createElement('div');
  field.className = 'flowers'; field.setAttribute('aria-hidden', 'true');
  field.innerHTML = '<svg width="0" height="0" style="position:absolute"><filter id="fgrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .32 0" result="d"/><feComposite in="d" in2="SourceAlpha" operator="in" result="g"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge></filter></svg>';
  sheet.prepend(field);
  const shape = '<svg viewBox="0 0 303 303"><g filter="url(#fgrain)"><g fill="#C4F4FF"><path transform="translate(102 0)" d="M49.2819 0L71.8746 22.7288C78.1692 29.0348 86.9605 36.9919 91.4305 44.3803C96.0707 51.9994 98.512 60.7589 98.4737 69.683C98.478 87.3768 91.3284 97.4005 79.56 109.22C69.9777 97.0646 60.0041 86.0884 49.4222 74.8432C45.5561 78.9626 40.1844 85.3597 36.2592 88.9828C11.8177 111.553 43.1403 124.037 63.8191 123.81C88.9084 123.536 106.508 102.341 131.346 102.373C151.225 102.456 160.957 111.521 174.192 124.782L190.354 141L201 151.682L177.191 175.539C171.632 181.104 164.661 188.65 158.273 192.856C152.446 196.706 145.862 199.269 138.968 200.377C126.004 202.47 112.743 199.24 102.191 191.419C109.009 173.606 112.76 156.073 97.789 139.858C88.6575 129.964 74.6094 130.805 62.1519 131.075C31.2435 131.748 -0.111982 100.387 0.000300667 69.6102C-0.00650436 60.8963 2.3225 52.3404 6.74492 44.8345C11.3664 36.9757 20.5783 28.6985 27.2204 22.0703L49.2819 0Z"/><path transform="translate(0 102)" d="M67.2974 0.101176C68.2577 0.0300902 69.2205 -0.00353713 70.1834 0.000293855C89.1224 0.147574 98.9765 8.57063 111.221 21.0328C104.972 30.205 85.3796 58.3155 96.8193 69.4194C104.613 76.9843 112.249 70.7258 120.625 68.1062C125.987 66.3865 131.573 65.4662 137.203 65.3743C154.114 65.0584 169.255 71.6707 181.276 83.4531C193.944 95.8829 201.057 112.902 200.997 130.651C201.095 139.406 198.86 148.03 194.518 155.637C189.691 164.01 179.663 173.068 172.516 180.194L151.701 201L127.481 176.831C115.199 164.572 107.356 158.357 103.255 140.486C100.979 127.725 103.251 116.78 109.533 105.653C121.124 116.375 133.652 121.798 149.56 122.728C162.598 123.49 175.649 117.398 176.036 102.846C176.219 95.9311 172.401 88.304 167.536 83.5229C162.108 78.1872 154.583 74.383 147.112 73.0265C132.783 70.2673 119.331 74.292 107.561 82.5669C102.89 85.8509 98.4402 89.7249 93.4633 92.5147C86.2104 96.5691 78.0296 98.6711 69.7207 98.6144C60.5787 98.5979 51.6211 96.0426 43.8459 91.2339C36.9433 87.0032 28.7693 78.1157 22.8403 72.1794L0 49.2965C6.61694 42.4552 13.5003 35.7425 20.2203 29.0038C34.9746 14.2077 44.6661 1.64932 67.2974 0.101176Z"/></g></g></svg>';
  let W = 0, H = 0, k = 1, top = 0;
  const navEl = document.querySelector('.nav');
  const measure = () => {
    W = sheet.clientWidth; k = Math.min(W, 1440) / 1440;
    H = firstTile.getBoundingClientRect().top - sheet.getBoundingClientRect().top + parseFloat(getComputedStyle(firstTile).paddingTop);
    field.style.height = H + 'px';
    top = navEl ? navEl.offsetHeight + 4 : 0;
  };
  measure();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const fl = SPECS.map(([x, y, s, r]) => {
    const el = document.createElement('div'); el.className = 'flower'; el.innerHTML = shape; field.appendChild(el);
    const ang = rnd(0, Math.PI * 2), base = rnd(12, 22);
    return { el, x: x * k, y: y * k, s, r, base, vx: Math.cos(ang) * base, vy: Math.sin(ang) * base, spinBase: rnd(6, 14) * (Math.random() < .5 ? -1 : 1), vr: 0 };
  });
  fl.forEach(f => f.vr = f.spinBase);
  const place = f => { const s = f.s * k; f.el.style.width = f.el.style.height = s + 'px'; f.el.style.transform = `translate(${f.x - s / 2}px, ${f.y - s / 2}px) rotate(${f.r}deg)`; };
  fl.forEach(place);
  addEventListener('resize', () => { const old = k; measure(); fl.forEach(f => { f.x *= k / old; f.y *= k / old; place(f); }); });
  if (!reduce) {
    let mx = -1e4, my = -1e4, last = performance.now(), running = true;
    addEventListener('pointermove', e => { const r = sheet.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
    document.addEventListener('pointerleave', () => { mx = my = -1e4; });
    new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) { last = performance.now(); requestAnimationFrame(step); } }).observe(field);
    function step(now) {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const R = Math.max(90, 160 * k);
      for (const f of fl) {
        const half = f.s * k / 2;
        // scatter away from the mouse
        const dx = f.x - mx, dy = f.y - my, d = Math.hypot(dx, dy);
        if (d < R && d > .1) {
          const push = (1 - d / R) * 2200 * dt;
          f.vx += dx / d * push; f.vy += dy / d * push;
          f.vr += (dx > 0 ? 1 : -1) * (1 - d / R) * 240 * dt;
        }
        // ease back to a slow cruise
        const sp = Math.hypot(f.vx, f.vy) || 1, target = f.base + (sp - f.base) * Math.exp(-1.4 * dt);
        f.vx *= target / sp; f.vy *= target / sp;
        f.vr = f.spinBase + (f.vr - f.spinBase) * Math.exp(-1.2 * dt);
        f.x += f.vx * dt; f.y += f.vy * dt; f.r += f.vr * dt;
        // bounce off the edges of the header
        if (f.x < half) { f.x = half; f.vx = Math.abs(f.vx); }
        if (f.x > W - half) { f.x = W - half; f.vx = -Math.abs(f.vx); }
        if (f.y < top + half) { f.y = top + half; f.vy = Math.abs(f.vy); }
        if (f.y > H - half) { f.y = H - half; f.vy = -Math.abs(f.vy); }
        place(f);
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
}

// Cursor trail: tiny light-cyan petals drop behind the mouse and fade (mouse only, off for reduced motion)
if (matchMedia('(hover: hover)').matches && !reduce) {
  const petal = '<svg viewBox="0 0 108 136"><filter id="tg" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .28 0"/><feComposite in2="SourceAlpha" operator="in" result="n"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="n"/></feMerge></filter><path fill="#C4F4FF" filter="url(#tg)" d="M53.92 0L78.64 24.87C85.53 31.77 95.15 40.48 100.04 48.56C105.12 56.9 107.79 66.48 107.75 76.24C107.75 95.6 99.93 106.57 87.05 119.51C76.57 106.2 65.65 94.19 54.08 81.89C49.85 86.4 43.97 93.4 39.67 97.36C12.93 122.06 47.2 135.72 69.83 135.47C36.01 136.21 -0.12 109.84 0 76.17C-0.01 66.63 2.54 57.27 7.38 49.06C12.44 40.46 22.52 31.4 29.78 24.15L53.92 0Z"/></svg>';
  let lx = null, ly = null, live = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (lx === null) { lx = e.clientX; ly = e.clientY; return; }
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (Math.hypot(dx, dy) < 18 || live > 10) return;
    // centred on the body of the petal cursor (tip is the click point, body sits ~12px below it)
    const t = document.createElement('div'); t.className = 'trail'; t.innerHTML = petal;
    t.style.left = (e.clientX + 9 - 4) + 'px'; t.style.top = (e.clientY + 9 - 5) + 'px';
    t.style.rotate = (-45 + Math.random() * 12 - 6) + 'deg';
    document.body.appendChild(t); live++;
    t.addEventListener('animationend', () => { t.remove(); live--; });
    lx = e.clientX; ly = e.clientY;
  }, { passive: true });
}

// Case study table of contents: stays on the left, highlights the section you're reading
const tocLinks = [...document.querySelectorAll('.toc a')];
if (tocLinks.length) {
  const secs = tocLinks.map(a => [a, document.getElementById(a.getAttribute('href').slice(1))]).filter(([, el]) => el);
  let ticking = false;
  const update = () => {
    ticking = false;
    const line = innerHeight * .35;
    let cur = secs[0];
    for (const s of secs) if (s[1].getBoundingClientRect().top <= line) cur = s;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = secs[secs.length - 1];
    tocLinks.forEach(a => a.classList.toggle('on', a === cur[0]));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update); update();
}

// SideBy page extras
if (document.body.classList.contains('cs2')) {
  // cards tilt toward the mouse with a soft glow
  if (matchMedia('(hover: hover)').matches && !reduce) document.querySelectorAll('.tilt-group > div').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
      card.style.transform = `perspective(800px) rotateX(${(.5 - y) * 8}deg) rotateY(${(x - .5) * 10}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
  // 4 in 10 pictogram fills in when it scrolls into view
  const stat = document.querySelector('.stat');
  if (stat) { if (reduce) stat.classList.add('seen'); else new IntersectionObserver(([e], o) => { if (e.isIntersecting) { stat.classList.add('seen'); o.disconnect(); } }, { threshold: .6 }).observe(stat); }
  // VeriDate -> SideBy flip
  const flip = document.querySelector('.flip');
  if (flip) {
    const set = st => { flip.dataset.state = st; flip.querySelectorAll('[data-to]').forEach(b => b.setAttribute('aria-selected', b.dataset.to === st)); };
    flip.querySelectorAll('[data-to]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); set(b.dataset.to); }));
    flip.querySelector('.flip-card').addEventListener('click', () => set(flip.dataset.state === 'before' ? 'after' : 'before'));
    flip.querySelector('.flip-card').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(flip.dataset.state === 'before' ? 'after' : 'before'); } });
    // when it first scrolls into view: a little wiggle, then it flips to SideBy on its own so people see it's interactive
    if (!reduce) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); flip.classList.add('nudge'); setTimeout(() => { flip.classList.remove('nudge'); set('after'); }, 1400); } }, { threshold: .7 }).observe(flip);
  }
  // reading progress line next to the contents list
  const toc = document.querySelector('.toc');
  if (toc) { const prog = () => toc.style.setProperty('--p', Math.min(1, scrollY / (document.documentElement.scrollHeight - innerHeight))); addEventListener('scroll', prog, { passive: true }); prog(); }
  // ending logo drifts with the mouse
  const mark = document.querySelector('.thanks .mark'), end = document.querySelector('.thanks');
  if (mark && !reduce && matchMedia('(hover: hover)').matches) end.addEventListener('pointermove', e => {
    const r = end.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    mark.style.translate = `${x * 30}px ${y * 20}px`; mark.style.rotate = `${x * 6}deg`;
  });
}

// Back button on every page except Home
if (!document.body.classList.contains('home')) {
  const back = document.createElement('a');
  back.className = 'back-btn'; back.href = 'index.html#work'; back.setAttribute('aria-label', 'Back to my work');
  back.innerHTML = '<span aria-hidden="true">←</span>Back';
  back.addEventListener('click', e => {
    try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); } } catch (_) {}
  });
  (document.querySelector('.sheet') || document.body).appendChild(back);
}

// nav words: remember their text so the bold hover doesn't shift neighbours
document.querySelectorAll('.nav .links a, .nav .name').forEach(a => a.dataset.text = a.textContent);


// DuoPoker: playable lesson inside a phone, modelled on the pitch prototype
const dev = document.querySelector('.device-screen');
if (dev) {
  const $ = s => dev.querySelector(s);
  const body = $('.d-body'), foot = $('.d-foot'), msg = $('.d-msg'), btn = $('.d-btn'), bar = $('.d-bar i'), hearts = $('.d-hearts b'), heartsEl = $('.d-hearts'), tony = $('.d-tony'), say = $('.d-say');
  const C = (v, s) => `<span class="d-card${s === '♥' || s === '♦' ? ' r' : ''}">${v}<br>${s}</span>`;
  const H = cards => `<span class="d-hand">${cards.map(([v, s]) => C(v, s)).join('')}</span>`;
  const STEPS = [
    { type: 'match', q: 'Match the suits.', pairs: [['K', '♣', 'Clubs'], ['7', '♥', 'Hearts'], ['Q', '♠', 'Spades'], ['3', '♦', 'Diamonds']] },
    { type: 'pick', q: 'Which one is a flush?', a: 2, why: 'Same suit, all five.', name: 'flush', opts: [
      { tag: 'Straight', h: [['9', '♣'], ['10', '♦'], ['J', '♥'], ['Q', '♠'], ['K', '♣']] },
      { tag: 'High card', h: [['2', '♥'], ['7', '♦'], ['9', '♣'], ['J', '♠'], ['K', '♥']] },
      { tag: 'Flush', h: [['2', '♥'], ['7', '♥'], ['9', '♥'], ['J', '♥'], ['K', '♥']] } ] },
    { type: 'pick', q: 'Which one is a pair?', a: 0, why: 'Two cards of the same rank.', name: 'pair', opts: [
      { tag: 'Pair', h: [['7', '♠'], ['7', '♦'], ['K', '♣'], ['4', '♥'], ['2', '♠']] },
      { tag: 'High card', h: [['3', '♣'], ['8', '♦'], ['10', '♥'], ['Q', '♠'], ['A', '♣']] },
      { tag: 'Flush', h: [['3', '♠'], ['6', '♠'], ['9', '♠'], ['J', '♠'], ['A', '♠']] } ] }
  ];
  let step = 0, lives = 5, streak = 0, best = 0, pick = null, checked = false;
  const speak = (t, big) => { say.textContent = t; say.classList.add('on'); tony.classList.remove('react', 'big'); void tony.offsetWidth; tony.classList.add(big ? 'big' : 'react'); clearTimeout(speak.t); speak.t = setTimeout(() => say.classList.remove('on'), 2400); };
  const lose = () => { lives = Math.max(0, lives - 1); hearts.textContent = lives; heartsEl.classList.remove('hit'); void heartsEl.offsetWidth; heartsEl.classList.add('hit'); streak = 0; };
  const win = () => { streak++; best = Math.max(best, streak); if (streak >= 3) speak('…okay. I’m impressed.', true); else speak(['Not bad.', 'Hm. Again.'][streak - 1] || 'Not bad.'); };
  const setFoot = (state, html, label, disabled) => { foot.className = 'd-foot' + (state ? ' ' + state : ''); msg.innerHTML = html || ''; btn.textContent = label; btn.disabled = !!disabled; };
  const progress = () => bar.style.width = (step / STEPS.length * 100) + '%';
  function render() {
    progress(); checked = false; pick = null;
    if (step >= STEPS.length) {
      body.innerHTML = `<div class="d-end"><b>Lesson complete!</b><p>You’re ready for the next one.</p><div class="d-stats"><div>❤️ ${lives} left</div><div>🔥 ${best} streak</div></div></div>`;
      setFoot('', '', 'Play again'); speak(best >= 3 ? 'Fine. You can deal.' : 'Not bad. For a beginner.', best >= 3); return;
    }
    const st = STEPS[step];
    if (st.type === 'match') {
      const right = st.pairs.map(p => p[2]).sort(() => Math.random() - .5);
      body.innerHTML = `<p class="d-q">${st.q}</p><div class="d-match">${st.pairs.map((p, i) => `<button class="d-tile" type="button" data-side="L" data-v="${p[2]}"><span class="pc${p[1] === '♥' || p[1] === '♦' ? ' r' : ''}">${p[0]}<br>${p[1]}</span></button><button class="d-tile" type="button" data-side="R" data-v="${right[i]}">${right[i]}</button>`).join('')}</div>`;
      setFoot('', '', 'Check', true);
      let left = 4, selL = null, selR = null, mistake = false;
      body.querySelector('.d-match').addEventListener('click', e => {
        const t = e.target.closest('.d-tile'); if (!t || t.classList.contains('done')) return;
        const side = t.dataset.side;
        body.querySelectorAll(`.d-tile[data-side="${side}"]`).forEach(x => x.classList.remove('sel'));
        t.classList.add('sel'); if (side === 'L') selL = t; else selR = t;
        if (selL && selR) {
          if (selL.dataset.v === selR.dataset.v) { [selL, selR].forEach(x => { x.classList.remove('sel'); x.classList.add('done'); }); left--; }
          else { const a = selL, b = selR; [a, b].forEach(x => { x.classList.remove('sel'); x.classList.add('bad'); }); setTimeout(() => [a, b].forEach(x => x.classList.remove('bad')), 450); if (!mistake) { mistake = true; lose(); } }
          selL = selR = null;
          if (!left) { checked = true; if (mistake) { setFoot('bad', 'All matched<small>One slip cost a heart. ♥ and ♦ are red, ♠ and ♣ are black.</small>', 'Continue'); } else { win(); setFoot('good', 'Nice!<small>All four suits matched.</small>', 'Continue'); } }
        }
      });
    } else {
      body.innerHTML = `<p class="d-q">${st.q}</p><div class="d-opts">${st.opts.map((o, i) => `<button class="d-opt" type="button" data-i="${i}"><span class="k">${'ABC'[i]}</span>${H(o.h)}<span class="d-tag">${o.tag}</span></button>`).join('')}</div>`;
      setFoot('', '', 'Check', true);
      body.querySelector('.d-opts').addEventListener('click', e => {
        const o = e.target.closest('.d-opt'); if (!o || checked) return;
        body.querySelectorAll('.d-opt').forEach(x => x.classList.remove('sel')); o.classList.add('sel'); pick = +o.dataset.i; btn.disabled = false;
      });
    }
  }
  btn.addEventListener('click', () => {
    if (step >= STEPS.length) { step = 0; lives = 5; streak = 0; best = 0; hearts.textContent = 5; render(); return; }
    const st = STEPS[step];
    if (st.type === 'pick' && !checked) {
      if (pick === null) return; checked = true;
      const os = body.querySelectorAll('.d-opt'); os[st.a].classList.add('ok'); body.querySelector('.d-opts').classList.add('shown');
      os.forEach((x, i) => { x.classList.remove('sel'); if (i !== st.a) x.classList.add('no'); });
      if (pick === st.a) { win(); setFoot('good', `Nice!<small>${st.why}</small>`, 'Continue'); }
      else { lose(); setFoot('bad', `Correct answer: ${'ABC'[st.a]}, ${st.name}<small>${st.why}</small>`, 'Got it'); speak('Happens to everyone.'); }
      return;
    }
    if (checked) { step++; render(); }
  });
  $('.d-x').addEventListener('click', () => { step = 0; lives = 5; streak = 0; best = 0; hearts.textContent = 5; render(); });
  render();
}

// Tony's stats count up when they scroll into view
const stage = document.querySelector('.stage');
if (stage && !reduce) {
  const nums = [...stage.querySelectorAll('b[data-to]')];
  nums.forEach(b => b.textContent = '0');
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; o.disconnect();
    const t0 = performance.now(), D = 1600;
    const tick = t => { const k = Math.min(1, (t - t0) / D), ease = 1 - Math.pow(1 - k, 3);
      nums.forEach(b => b.textContent = Math.round(+b.dataset.to * ease).toLocaleString('en-US'));
      if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, { threshold: .4 }).observe(stage);
}

// Count-up numbers ([data-count]) when they scroll into view
const counters = document.querySelectorAll('[data-count]');
if (counters.length && !reduce) {
  counters.forEach(el => { el.dataset.final = el.textContent; el.textContent = '0'; });
  const io3 = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io3.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now(), D = 1400;
    const tick = t => { const k = Math.min(1, (t - t0) / D), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = k < 1 ? v.toFixed(dec) : el.dataset.final; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  counters.forEach(el => io3.observe(el));
}

// EcoPinet milestones: a timeline you can tap, or let play on a loop
const ms = document.querySelector('.milestones');
if (ms) {
  const btns = [...ms.querySelectorAll('.ms-line button')], figs = [...ms.querySelectorAll('.ms-view figure')], fill = ms.querySelector('.ms-fill'), rings = btns.map(b => b.querySelector('.ring'));
  let cur = 0, start = 0, visible = false, paused = false, raf; const DUR = 4500, N = btns.length;
  const show = i => { cur = (i + N) % N; btns.forEach((b, k) => { b.setAttribute('aria-selected', k === cur); b.classList.toggle('done', k < cur); }); figs.forEach((f, k) => f.classList.toggle('on', k === cur)); fill.style.width = (cur / (N - 1) * 100) + '%'; rings.forEach(r => r.style.strokeDashoffset = 100.5); start = performance.now(); };
  const loop = t => { cancelAnimationFrame(raf); if (!visible || paused || reduce) return; const k = Math.min(1, (t - start) / DUR); rings[cur].style.strokeDashoffset = 100.5 * (1 - k); if (k >= 1) show(cur + 1); raf = requestAnimationFrame(loop); };
  const go = i => { show(i); paused = true; setTimeout(() => { paused = false; start = performance.now(); raf = requestAnimationFrame(loop); }, 7000); };
  btns.forEach((b, i) => b.addEventListener('click', () => go(i)));
  ms.querySelector('.ms-arrow.prev').addEventListener('click', () => go(cur - 1));
  ms.querySelector('.ms-arrow.next').addEventListener('click', () => go(cur + 1));
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { start = performance.now(); raf = requestAnimationFrame(loop); } }, { threshold: .4 }).observe(ms);
  show(0);
}

// EcoPinet problems: expanding photo panels
document.querySelectorAll('.panels').forEach(g => {
  const ps = [...g.querySelectorAll('.pp')];
  const open = p => ps.forEach(x => { x.classList.toggle('on', x === p); x.setAttribute('aria-expanded', x === p); });
  ps.forEach(p => { p.addEventListener('click', () => open(p)); if (matchMedia('(hover: hover)').matches) p.addEventListener('mouseenter', () => open(p)); });
});

// EcoPinet process: deal through a stack of real photos
const stack = document.querySelector('.paperstack');
if (stack) {
  const cards = [...stack.querySelectorAll('.pc')], chips = [...stack.querySelectorAll('.ps-steps button')], count = stack.querySelector('.ps-count b'), next = stack.querySelector('.ps-next'), prev = stack.querySelector('.ps-prev'), N = cards.length;
  let cur = 0;
  const lay = () => {
    cards.forEach((c, i) => {
      const d = i - cur;
      c.classList.toggle('gone', d < 0);
      c.style.zIndex = N - i;
      if (d >= 0) { const r = [0, 3, -2.5, 4][Math.min(d, 3)] * (i % 2 ? -1 : 1); c.style.transform = `translate(${Math.min(d, 3) * 7}px, ${Math.min(d, 3) * 6}px) rotate(${d === 0 ? (i % 2 ? 1.2 : -1.2) : r}deg)`; c.style.opacity = d > 3 ? 0 : 1; }
    });
    chips.forEach((b, i) => { b.classList.toggle('on', i === cur); b.classList.toggle('seen', i < cur); });
    count.textContent = String(cur + 1).padStart(2, '0');
    next.textContent = cur === N - 1 ? 'Start over ↺' : 'Next step →';
    prev.disabled = cur === 0;
  };
  const go = i => { cur = (i + N) % N; lay(); };
  next.addEventListener('click', () => go(cur === N - 1 ? 0 : cur + 1));
  prev.addEventListener('click', () => go(cur - 1));
  chips.forEach((b, i) => b.addEventListener('click', () => go(i)));
  const area = stack.querySelector('.ps-cards'); let x0 = null, moved = false;
  area.addEventListener('pointerdown', e => { x0 = e.clientX; moved = false; });
  area.addEventListener('pointermove', e => { if (x0 === null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 6) moved = true; const top = cards[cur]; if (top) top.style.transform = `translate(${dx}px, 0) rotate(${dx / 25}deg)`; });
  const end = e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (!moved || dx > 60) go(cur === N - 1 ? 0 : cur + 1); else if (dx < -60) go(cur - 1); else lay(); };
  area.addEventListener('pointerup', end); area.addEventListener('pointerleave', e => { if (x0 !== null) { x0 = null; lay(); } });
  lay();
}

// Click-to-play YouTube (loads the video only when clicked)
document.querySelectorAll('.yt').forEach(b => b.addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.id}?autoplay=1&rel=0`;
  f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = b.getAttribute('aria-label');
  b.replaceChildren(f);
}, { once: true }));

// BuzzTile: research tabs
document.querySelectorAll('.tech').forEach(t => {
  const tabs = [...t.querySelectorAll('[data-t]')], ps = [...t.querySelectorAll('.tp')];
  tabs.forEach(b => b.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', x === b)); ps.forEach((p, i) => p.classList.toggle('on', i === +b.dataset.t));
  }));
});

// BuzzTile: brief ticks + bug fixes animate in when they scroll into view
{
  const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); o.unobserve(e.target); } }), { threshold: .5 });
  document.querySelectorAll('.brief, .bugs').forEach(el => reduce ? el.classList.add('seen') : o.observe(el));
}

// BuzzTile: playable honeycomb. Step on a tile -> voltage spike, LCD counts, bees join the hive.
const play = document.querySelector('.play');
if (play) {
  const svg = play.querySelector('.comb'), NS = 'http://www.w3.org/2000/svg';
  const lcdSteps = play.querySelector('.lcd-steps'), lcd = play.querySelector('.lcd');
  const voltV = play.querySelector('.volt-v'), spikes = play.querySelector('.spikes');
  const bars = Array.from({ length: 24 }, () => spikes.appendChild(document.createElement('i')));
  const hive = play.querySelector('.hive'), beesEl = play.querySelector('.bees'), msg = play.querySelector('.hive-msg');
  const unlocks = [...play.querySelectorAll('.bee-list li')];
  const R = 66, H = Math.sqrt(3) * R;
  const hex = r => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 3 * i; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  // the 2-3-2 flower layout of the real prototype (flat-top hexagons)
  const spots = [[0, -H], [0, 0], [0, H], [-1.5 * R, -H / 2], [-1.5 * R, H / 2], [1.5 * R, -H / 2], [1.5 * R, H / 2]];
  let steps = 0, beeCount = 0, walking = false;
  const cells = spots.map(([x, y], i) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'cell'); g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `Tile ${i + 1}: step on it`);
    g.innerHTML = `<g class="press"><polygon class="frame" points="${hex(R - 3)}"/><polygon class="lip" points="${hex(R - 15)}"/><polygon class="pad" points="${hex(R - 19)}"/></g>`;
    svg.appendChild(g);
    const go = e => { e?.preventDefault(); step(g); };
    g.addEventListener('pointerdown', go);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); });
    return g;
  });
  const rnd = (a, b) => a + Math.random() * (b - a);
  function addBee() {
    const b = document.createElement('span'); b.className = 'bee new'; b.textContent = '🐝';
    const pt = () => [`${rnd(-150, 120).toFixed(0)}px`, `${rnd(-95, -10).toFixed(0)}px`];
    ['0', '1', '2', '3'].forEach(k => { const [x, y] = pt(); b.style.setProperty('--x' + k, x); b.style.setProperty('--y' + k, y); });
    b.style.setProperty('--dur', rnd(5, 9).toFixed(1) + 's');
    beesEl.appendChild(b);
  }
  function step(cell) {
    steps++;
    const v = rnd(3, 5);
    cell.classList.add('down'); setTimeout(() => cell.classList.remove('down'), 220);
    const t = document.createElementNS(NS, 'text'); t.setAttribute('class', 'spark'); t.setAttribute('text-anchor', 'middle');
    const [x, y] = cell.getAttribute('transform').match(/-?[\d.]+/g).map(Number);
    t.setAttribute('x', x); t.setAttribute('y', y + 8); t.textContent = '+1'; svg.appendChild(t); setTimeout(() => t.remove(), 900);
    lcdSteps.textContent = steps; lcd.classList.add('flash'); setTimeout(() => lcd.classList.remove('flash'), 120);
    voltV.textContent = v.toFixed(1) + ' V';
    const b = bars.shift(); b.remove(); spikes.appendChild(b); bars.push(b);
    b.style.height = '6%'; b.classList.add('hot'); requestAnimationFrame(() => { b.style.height = (v / 5 * 100) + '%'; });
    setTimeout(() => b.classList.remove('hot'), 900);
    if (steps % 5 === 0 && beeCount < 14) { beeCount++; addBee(); hive.classList.add('grow'); setTimeout(() => hive.classList.remove('grow'), 400); }
    const got = unlocks.find(li => +li.dataset.at === steps);
    if (got) { got.classList.add('got'); msg.textContent = `New bee unlocked: ${got.childNodes[1].textContent.trim()}!`; }
    else if (steps === 1) msg.textContent = 'Bzz. The hive is waking up…';
    else if (steps % 5 === 0) msg.textContent = `${beeCount} bee${beeCount > 1 ? 's' : ''} in the hive. Keep walking!`;
  }
  play.querySelector('.walk').addEventListener('click', async () => {
    if (walking) return; walking = true;
    const path = [4, 3, 1, 0, 5, 6, 2, 1, 4, 3];
    for (const i of path) { step(cells[i]); await new Promise(r => setTimeout(r, 260)); }
    walking = false;
  });
  play.querySelector('.hive-reset').addEventListener('click', () => {
    steps = beeCount = 0; lcdSteps.textContent = '0'; voltV.textContent = '0.0 V'; bars.forEach(b => b.style.height = '6%');
    beesEl.replaceChildren(); unlocks.forEach(li => li.classList.remove('got')); msg.textContent = 'Step on a tile to wake the hive.';
  });
}

// BuzzTile: ideation rounds. Auto-advances (with a progress bar) until someone clicks.
document.querySelectorAll('.rounds').forEach(r => {
  const tabs = [...r.querySelectorAll('[data-r]')], ps = [...r.querySelectorAll('.r-panel')], count = r.querySelector('.r-count');
  let cur = 0, auto = !reduce;
  r.style.setProperty('--rt', (+r.dataset.auto || 7000) + 'ms');
  const go = i => {
    cur = (i + tabs.length) % tabs.length;
    tabs.forEach((x, k) => { x.setAttribute('aria-selected', k === cur); x.classList.remove('run'); });
    ps.forEach((p, k) => p.classList.toggle('on', k === cur));
    if (count) count.textContent = `${cur + 1} / ${tabs.length}`;
    if (auto) { void tabs[cur].offsetWidth; tabs[cur].classList.add('run'); }
  };
  const stop = () => { auto = false; r.classList.remove('auto'); tabs.forEach(x => x.classList.remove('run')); };
  tabs.forEach((b, i) => { b.addEventListener('click', () => { stop(); go(i); }); b.addEventListener('animationend', () => { if (auto) go(cur + 1); }); });
  r.querySelector('.r-next')?.addEventListener('click', () => { stop(); go(cur + 1); });
  ps.forEach(p => p.querySelector('img')?.addEventListener('click', () => { stop(); }));
  if (auto) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { r.classList.add('auto'); go(cur); o.disconnect(); } }), { threshold: .5 }).observe(r);
});

// BuzzTile: system architecture lights up step by step, like a signal travelling through it
const flow = document.querySelector('.flow');
if (flow && !reduce) {
  const nodes = [...flow.querySelectorAll('.fn')]; let k = 0, t = null;
  const tick = () => { nodes.forEach(n => n.classList.remove('lit')); nodes[k].classList.add('lit'); if (nodes[k].parentElement.classList.contains('fsplit')) { nodes[k + 1].classList.add('lit'); k++; } k = (k + 1) % (nodes.length + 2); if (k >= nodes.length) k = 0; };
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !t) t = setInterval(tick, 1200); else if (!e.isIntersecting && t) { clearInterval(t); t = null; } }), { threshold: .3 }).observe(flow);
}

// BuzzTile: press-and-hold piezo demo
const pz = document.querySelector('.pz');
if (pz) {
  const vEl = pz.querySelector('.pz-v'), fill = pz.querySelector('.pz-read>i>i'), btn = pz.querySelector('.pz-btn');
  let v = 0, target = 0, raf = null;
  const tick = () => { v += (target - v) * .12; vEl.textContent = v.toFixed(1) + ' V'; fill.style.width = (v / 5 * 100) + '%'; raf = Math.abs(target - v) > .02 ? requestAnimationFrame(tick) : null; if (!raf) { v = target; vEl.textContent = v.toFixed(1) + ' V'; } };
  const set = on => { pz.classList.toggle('on', on); target = on ? 4 + Math.random() : 0; if (!raf) raf = requestAnimationFrame(tick); };
  [btn, pz.querySelector('.pz-svg')].forEach(el => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); set(true); });
    el.addEventListener('pointerup', () => set(false)); el.addEventListener('pointerleave', () => set(false)); el.addEventListener('pointercancel', () => set(false));
  });
  btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); set(true); } });
  btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') set(false); });
}

// BuzzTile: app viewer (sketch -> final screen)
const av = document.querySelector('.appview');
if (av) {
  const tabs = [...av.querySelectorAll('[data-a]')], stage = av.querySelector('.av-stage');
  const sk = av.querySelector('.av-sketch img'), ph = av.querySelector('.av-phone img');
  const names = ['the Hive screen', 'the Learning hub', 'the Bee collection', 'School stats'];
  for (let i = 1; i <= 4; i++) { new Image().src = `images/buzztile/screen-${i}.jpg`; new Image().src = `images/buzztile/sketch-${i}.jpg`; }
  tabs.forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.a; tabs.forEach(x => x.setAttribute('aria-selected', x === b));
    stage.classList.add('swap');
    setTimeout(() => { sk.src = `images/buzztile/sketch-${i + 1}.jpg`; ph.src = `images/buzztile/screen-${i + 1}.jpg`; sk.alt = `Hand-drawn sketch of ${names[i]}`; ph.alt = `Final app: ${names[i]}`; stage.classList.remove('swap'); }, 220);
  }));
}

// Jim Thompson: colourway switcher
const cw = document.querySelector('[data-cw]');
const cwData = document.getElementById('cw-data');
if (cw && cwData) {
  const pats = JSON.parse(cwData.textContent), base = 'images/jim-thompson/cw/';
  const tabs = cw.querySelector('.cw-tabs'), frame = cw.querySelector('.cw-frame'), img = frame.querySelector('img');
  const nameEl = cw.querySelector('.cw-name'), descEl = cw.querySelector('.cw-desc'), sw = cw.querySelector('.cw-sw'), noteEl = cw.querySelector('.cw-note'), countEl = cw.querySelector('.cw-count');
  const showSwatch = (p, i) => {
    const src = base + p.files[i] + '.jpg';
    img.classList.add('fade');
    const pre = new Image(); pre.onload = pre.onerror = () => { img.src = src; img.alt = p.name + ' colourway ' + (i + 1); img.classList.remove('fade'); }; pre.src = src;
    frame.classList.toggle('is-sel', i < (p.selected || 0));
    [...sw.children].forEach((b, k) => b.setAttribute('aria-pressed', k === i));
  };
  const showPattern = id => {
    const p = pats.find(x => x.id === id);
    [...tabs.children].forEach(b => b.setAttribute('aria-selected', b.dataset.p === id));
    nameEl.textContent = p.name; descEl.textContent = p.desc; noteEl.textContent = p.note || '';
    countEl.textContent = p.files.length + ' of 140+';
    frame.classList.toggle('wide', !!p.wide);
    sw.innerHTML = '';
    p.files.forEach((f, i) => { const b = document.createElement('button'); b.type = 'button'; b.style.backgroundImage = `url(${base}${f}.jpg)`; b.setAttribute('aria-label', `${p.name} colourway ${i + 1}${i < (p.selected || 0) ? ', selected for 2026' : ''}`); if (i < (p.selected || 0)) b.classList.add('sel'); b.addEventListener('click', () => showSwatch(p, i)); sw.appendChild(b); });
    showSwatch(p, 0);
  };
  pats.forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.role = 'tab'; b.dataset.p = p.id; b.textContent = p.name; b.addEventListener('click', () => showPattern(p.id)); tabs.appendChild(b); });
  showPattern(pats[0].id);
}
