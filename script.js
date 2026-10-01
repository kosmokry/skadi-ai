(async () => {
  /* ---------- content from content.json (edited in /admin) ---------- */
  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // "250 $" -> 250 with a tight currency sign
  const money = v => { const m = String(v ?? '').match(/^(.*?)\s*([$€₽]|USD|руб\.?)$/); return m ? `${esc(m[1])}<i class="ccy">${esc(m[2])}</i>` : esc(v); };
  const ext = h => /^https?:/.test(h) ? ' target="_blank" rel="noopener"' : '';
  try {
    const C = await fetch('content.json', { cache: 'no-store' }).then(r => r.json());
    const last = C.chapters.length - 1;
    document.querySelector('.copy').innerHTML = C.chapters.map((c, i) => {
      const tag = i === 0 ? 'h1' : 'h2';
      const pr = c.price || {};
      const glass = (c.lead || pr.value || (c.tags || []).length || c.link?.label) ? `<div class="glass">
        ${c.lead ? `<p class="lead">${esc(c.lead)}</p>` : ''}
        ${pr.value ? `<p class="price">${esc(pr.pre)} <b>${money(pr.value)}</b> ${esc(pr.post)}</p>` : ''}
        ${(c.tags || []).length ? `<p class="tags">${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
        ${c.link?.label ? `<a class="more" href="${esc(c.link.href)}"${ext(c.link.href)}>${esc(c.link.label)}</a>` : ''}
      </div>` : '';
      return `<article class="blk${i === 0 ? ' hero' : ''}${i === last ? ' outro' : ''}" data-ch="${i}">
        <p class="kick">${esc(c.kick)}${c.badge ? ` <em>${esc(c.badge)}</em>` : ''}</p>
        <${tag}${c.small ? ' class="h-long"' : ''}>${c.title.map(t => `<span>${esc(t)}</span>`).join('')}</${tag}>${glass}</article>`;
    }).join('');
    const P = C.pricing;
    const buy = (u, cls = '') => `<a class="pbtn${cls}" href="${esc(u)}"${ext(u)}>Купить</a>`;
    // one shared feature list: every plan shows all rows, missing ones are dimmed, so the difference reads at a glance
    const all = [];
    P.plans.forEach(p => [...p.features, ...(p.yearOnly || [])].forEach(f => { if (!all.includes(f)) all.push(f); }));
    const yearOnlyAll = new Set(P.plans.flatMap(p => p.yearOnly || []));
    const ring = '<i class="ring"></i><i class="trace"></i><i class="halo"></i>';
    document.querySelector('.pricing .wrap').innerHTML = `
      <div class="p-head">
        <div><p class="kick">${esc(P.kick)}</p><h2>${esc(P.title)}</h2></div>
        <div class="period" role="group" aria-label="Период оплаты">
          <button type="button" data-per="month" aria-pressed="true">В месяц</button>
          <button type="button" data-per="year" aria-pressed="false">В год <em>до ${esc(P.plans.map(p => p.discount).filter(Boolean).sort().pop() || '')}</em></button>
        </div>
      </div>
      <div class="pgrid">${P.plans.map((p, i) => {
        const own = new Set([...p.features, ...(p.yearOnly || [])]);
        return `<article class="pc${p.badge ? ' hit' : ''}" style="--d:${i * .18}s">${ring}
          <header><span class="pn">0${i + 1}</span><h3>${esc(p.name)}</h3>${p.badge ? `<em class="pb">${esc(p.badge)}</em>` : ''}</header>
          <p class="pp"><b data-month="${esc(p.month)}" data-year="${esc(p.year)}">${money(p.month)}</b><span data-month="в месяц" data-year="в год">в месяц</span></p>
          <p class="psave" data-month="${esc(p.year)} при оплате за год" data-year="экономия ${esc(p.discount)}">${esc(p.year)} при оплате за год</p>
          ${buy(p.buy, p.badge ? ' pri' : '')}
          <ol class="pf">${all.map((f, k) => `<li class="${own.has(f) ? 'y' : 'n'}${yearOnlyAll.has(f) ? ' yo' : ''}"><span>${String(k + 1).padStart(2, '0')}</span>${esc(f)}</li>`).join('')}</ol>
          ${yearOnlyAll.size ? '<p class="pnote">◆ только при покупке на год</p>' : ''}
        </article>`;
      }).join('')}</div>
      <div class="pgrid two">${P.products.map((p, i) => `<article class="pc prod" style="--d:${.5 + i * .18}s">${ring}
        ${p.img ? `<div class="pimg"><img src="${esc(p.img)}" alt="" loading="lazy"></div>` : ''}
        <div class="pbody">
          <header><span class="pn">${esc(p.kick)}</span></header>
          <h3>${esc(p.name)}</h3>
          <p class="pp"><b>${money(p.price)}</b><span>${esc(p.period)}</span></p>
          <ul class="ptags">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          ${buy(p.buy)}
        </div></article>`).join('')}</div>`;
    const sec = document.querySelector('.pricing');
    sec.querySelectorAll('.period button').forEach(b => b.onclick = () => {
      const per = b.dataset.per;
      sec.querySelectorAll('.period button').forEach(x => x.setAttribute('aria-pressed', x === b));
      sec.querySelectorAll('[data-month]').forEach(el => el.tagName === 'B' ? el.innerHTML = money(el.dataset[per]) : el.textContent = el.dataset[per]);
      sec.classList.toggle('yearly', per === 'year');
    });
    // "plug in": contour charges when a card comes into view
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('charged'); io.unobserve(e.target); } }), { threshold: .35 });
    sec.querySelectorAll('.pc').forEach(el => io.observe(el));
    const K = C.contacts, tg = `https://t.me/${esc(K.telegram)}`;
    document.querySelector('.foot .wrap').innerHTML = `<p class="kick">${esc(K.kick)}</p>
      <h2><a href="${tg}" target="_blank" rel="noopener">@${esc(K.telegram)}</a></h2>
      <p class="lead">${esc(K.lead)}</p>
      <div class="foot-grid">
        <div><small>Продукты</small><a href="#pricing">SKAÐI/ÐCAN</a><a href="#pricing">Flasher</a><a href="#pricing">BoardViewer</a></div>
        <div><small>${esc(K.company)}</small><span>Телефон: <a href="tel:${esc(K.phone)}">${esc(K.phone)}</a></span><span>${esc(K.address)}</span><span>ИНН: ${esc(K.inn)}</span></div>
        <div><small>Соцсети</small><a href="${tg}" target="_blank" rel="noopener">Telegram</a><a href="${esc(K.instagram)}" target="_blank" rel="noopener">Instagram</a><a href="${esc(K.tiktok)}" target="_blank" rel="noopener">TikTok</a></div>
      </div>
      <p class="copy-r"><img src="assets/logo.svg" alt=""> SKAÐI <span>${esc(K.copyright)}</span></p>`;
  } catch (e) { /* keep the static markup */ }

  const W = 1672, H = 941, F = .012;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t * t;
  const seg = (p, a, b, from, to, ease = easeOut) => from + (to - from) * ease(clamp((p - a) / (b - a)));

  /* ---------- typography: prepositions and conjunctions move to the next line with their word ---------- */
  const SHORT = /(^|[\s(«"])(а|в|во|и|к|ко|о|об|с|со|у|на|по|от|до|за|из|для|без|при|про|над|под|не|но|мы|ни|же|или)\s+/gi;
  function typo(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      let t = n.nodeValue;
      if (!t.trim()) return;
      t = t.replace(SHORT, '$1$2 ').replace(SHORT, '$1$2 ').replace(/\s+—\s/g, ' — ');
      n.nodeValue = t;
    });
  }
  $$('.blk, .pricing, .foot').forEach(typo);

  // body copy leading: 130–150% by line count
  const leads = $$('.blk .lead, .foot .lead');
  function lead() {
    leads.forEach(el => {
      el.style.lineHeight = '1.4';
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const lines = Math.round(el.getBoundingClientRect().height / (fs * 1.4));
      el.style.lineHeight = lines <= 2 ? '1.3' : lines <= 4 ? '1.4' : '1.5';
    });
  }

  /* ---------- plates, cars, shots ---------- */
  const PLATES = {
    bg1:  { fx: .5,  fxm: .62, fy: .5 },
    bg1b: { fx: .45, fxm: .3,  fy: .5 },
    bg2:  { fx: .5,  fxm: .3,  fy: .77 },
    bg4:  { fx: .5,  fxm: .42, fy: .5 },
    bg4b: { fx: .5,  fxm: .62, fy: .5 },
    bg3:  { fx: .5,  fxm: .45, fy: .77 },
    bg3x: { fx: .5,  fxm: .4,  fy: .6 },
    bg6:  { fx: .5,  fxm: .5,  fy: .6 },
    bg5:  { fx: .5,  fxm: .3,  fy: .78 },
    bg5c: { fx: .5,  fxm: .55, fy: .5 },
  };
  const TYPES = {
    mxw:  { nw: 1554, nh: 550, wheels: [[264.7, 426.4, 98], [1234.5, 427.6, 98]] },
    mxb:  { nw: 1559, nh: 559, wheels: [[269.5, 430.5, 98], [1247.5, 432.6, 98]] },
    car1: { nw: 1567, nh: 493, wheels: [[272.5, 368, 100], [1245, 368, 100]] },
    car2: { nw: 1511, nh: 549, wheels: [[273.5, 424, 100], [1217, 424, 100]] },
    car3: { nw: 1551, nh: 562, wheels: [[267.8, 431, 106], [1287.2, 431, 106]], head: [100, 275], tail: [1465, 222], port: [1330, 262] },
  };
  // park = left edge in plate px; w/base for desktop, wm/basem for phones (cars sit further back so they clear the laptop)
  const CARS = [
    { id: 'c1',  plate: 'bg2',  type: 'mxw',  park: 60,  w: 840, base: 718, wm: 480, basem: 676,
      off: p => p < .585 ? seg(p, .115, .19, 1900, 0) : seg(p, .585, .628, 0, -2100, easeIn) },
    { id: 'c3a', plate: 'bg2',  type: 'car3', park: 90,  w: 780, base: 722, wm: 450, basem: 678,
      off: p => seg(p, .625, .668, 1900, 0) },
    { id: 'c2',  plate: 'bg3',  type: 'mxb',  park: 420, w: 840, base: 722, wm: 480, basem: 672,
      off: p => seg(p, .425, .49, 1900, 0) },
    { id: 'c3n', plate: 'bg5',  type: 'car3', park: 30,  w: 800, base: 728, wm: 460, basem: 680, night: true,
      off: () => 0 },
  ];
  const SHOTS = [
    { a: 0,    plate: 'bg1',  z: [1, 1.08],    d: [0, .012],    g: 'dusk' },
    { a: .055, plate: 'bg1b', z: [1.06, 1],    d: [.01, -.01],  g: 'dusk' },
    { a: .11,  plate: 'bg2',  z: [1.07, 1],    d: [.025, -.015], g: 'day' },
    { a: .28,  plate: 'bg4',  z: [1, 1.1],     d: [-.01, .02],  g: 'warm' },
    { a: .35,  plate: 'bg4b', z: [1.08, 1],    d: [0, 0],       g: 'warm' },
    { a: .42,  plate: 'bg3',  z: [1.08, 1],    d: [.02, -.01],  g: 'violet' },
    { a: .50,  plate: 'bg3x', z: [1, 1.05],    d: [0, .01],     g: 'violet', fade: .03 },
    { a: .58,  plate: 'bg2',  z: [1, 1.06],    d: [-.02, .01],  g: 'day' },
    { a: .67,  plate: 'bg6',  z: [1.1, 1],     d: [.02, -.02],  g: 'day' },
    { a: .75,  plate: 'bg5',  z: [1.1, 1.02],  d: [.02, 0],     g: 'night' },
    { a: .84,  plate: 'bg5c', z: [1, 1.08],    d: [0, -.01],    g: 'night' },
    { a: .92,  plate: 'bg5',  z: [1.02, 1],    d: [0, 0],       g: 'night' },
  ];
  SHOTS.forEach((s, i) => s.b = SHOTS[i + 1] ? SHOTS[i + 1].a : 1);
  const TINT = { dusk: [226, 196, 182], day: [214, 220, 232], warm: [232, 214, 196], violet: [196, 190, 232], night: [70, 84, 138] };
  const GRADE = { dusk: [255, 122, 61, .4], day: [87, 131, 255, .18], warm: [255, 170, 110, .24], violet: [122, 107, 255, .32], night: [0, 67, 255, .42] };
  const CH = [
    { a: 0,   screen: 'term',    t: 'SKAÐI' },
    { a: .11, screen: 'dcan',    t: 'ÐCAN' },
    { a: .28, screen: 'flasher', t: 'Flasher' },
    { a: .42, screen: 'board',   t: 'BoardViewer' },
    { a: .58, screen: 'why',     t: 'Почему' },
    { a: .75, screen: 'pro',     t: 'Сервис' },
    { a: .92, screen: 'pro',     t: 'Тарифы' },
  ];
  CH.forEach((c, i) => c.b = CH[i + 1] ? CH[i + 1].a : 1);

  const stage = $('#stage'), flight = $('#flight'), frame = $('#frame'), scenes = $('#scenes');
  const blocks = $$('.blk'), screens = {}; $$('.scr').forEach(s => screens[s.dataset.screen] = s);
  const grade = $('#grade'), tint = $('#tint'), hudN = $('#hudN'), hudT = $('#hudT'), hudBar = $('#hudBar'), hint = $('#hint');

  // build plates
  const worlds = {};
  for (const [name, cfg] of Object.entries(PLATES)) {
    const w = document.createElement('div'); w.className = 'world';
    const im = new Image(); im.className = 'plate'; im.alt = ''; im.src = `assets/${name}.jpg`; im.decoding = 'async';
    w.append(im); scenes.append(w); worlds[name] = { el: w, ...cfg };
  }
  // build cars: body + rim discs cut from the same image so they can spin
  const pct = (v, of) => v / of * 100 + '%';
  CARS.forEach(c => {
    const T = TYPES[c.type], src = `assets/${c.type}.webp`;
    const el = document.createElement('div'); el.className = 'car' + (c.night ? ' night' : '') + (c.noreflect ? ' noreflect' : '');
    const body = new Image(); body.src = src; body.className = 'body'; body.alt = ''; el.append(body);
    c.wheels = T.wheels.map(([cx, cy, r]) => {
      const d = document.createElement('div'); d.className = 'wheel';
      Object.assign(d.style, { left: pct(cx - r, T.nw), top: pct(cy - r, T.nh), width: pct(2 * r, T.nw), height: pct(2 * r, T.nh) });
      const im = new Image(); im.src = src; im.alt = '';
      Object.assign(im.style, { width: pct(T.nw, 2 * r), left: pct(-(cx - r), 2 * r), top: pct(-(cy - r), 2 * r) });
      d.append(im); el.append(d);
      const touch = document.createElement('i'); touch.className = 'touch'; touch.style.left = pct(cx, T.nw); el.append(touch);
      return { el: d, r };
    });
    if (c.night) {
      const lamp = (cls, [x, y]) => { const l = document.createElement('i'); l.className = 'lamp ' + cls; l.style.left = pct(x, T.nw); l.style.top = pct(y, T.nh); el.append(l); };
      lamp('beam', T.head); lamp('pool', [T.head[0], T.nh * .98]); lamp('head', T.head); lamp('tail', T.tail); lamp('port', T.port);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'cable'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = '<path class="wire"/><path class="flow"/>';
      c.cable = svg;
    }
    worlds[c.plate].el.append(el);
    if (c.cable) worlds[c.plate].el.append(c.cable);
    c.el = el; c.T = T;
  });

  let vw = 0, vh = 0, mobile = false;
  function layoutCars() {
    CARS.forEach(c => {
      c.cw = mobile ? c.wm : c.w;
      c.cb = mobile ? c.basem : c.base;
      c.cp = mobile ? worlds[c.plate].fxm * W - c.cw / 2 : c.park;
      c.k = c.cw / c.T.nw; c.ch = c.T.nh * c.k;
      c.el.style.width = c.cw + 'px';
      if (c.cable) {
        const [px, py] = [c.cp + c.T.port[0] * c.k, c.cb - c.ch + c.T.port[1] * c.k], fy = c.cb - 4;
        const d = `M${px} ${py} C${px + 26} ${py + 70} ${px + 30} ${fy} ${px + 140} ${fy} L${px + 1600} ${fy + 6}`;
        $$('path', c.cable).forEach(pth => pth.setAttribute('d', d));
      }
    });
  }
  function measure() { vw = stage.clientWidth; vh = stage.clientHeight; mobile = vw <= 760; layoutCars(); lead(); }

  function placeCar(c, p) {
    const s = c.cw / c.w, off = c.off(p) * s, lift = c.lift ? c.lift(p) * s : 0;
    c.el.style.transform = `translate3d(${(c.cp + off).toFixed(1)}px,${(c.cb - c.ch + lift).toFixed(1)}px,0)`;
    const deg = off / (c.wheels[0].r * c.k) * 57.2958;
    c.wheels.forEach(w => w.el.style.transform = `rotate(${deg.toFixed(1)}deg)`);
    if (c.lift) { c.el.style.setProperty('--sh', (-lift / c.ch * 100 * .9).toFixed(1) + '%'); c.el.style.setProperty('--sho', (1 - sm(0, -120, lift) * .7).toFixed(2)); }
  }

  // camera: cover-fit the plate; zoom keeps the floor line (fy) where it is
  function placeWorld(w, z, drift) {
    const s = Math.max(vw / W, vh / H) * z;
    const fx = (mobile ? w.fxm : w.fx) + drift;
    const tx = clamp(vw / 2 - fx * W * s, vw - W * s, 0);
    const ty = w.fy * (vh - H * s);
    w.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
  }

  /* ---------- laptop screens ---------- */
  const TERM = [
    ['link up · CAN @ 500k · LAN ok', 'm'],
    ['> unit.read VCFRONT', 'c'],
    ['214 params · fw 2024.44.25', ''],
    ['unit region = EU · country = NL', ''],
    ['dasHw = TESLA_AP3 · packEnergy = 75', ''],
    ['> task diagnostics.thermal', 'c'],
    ['coolant flow ok · oil pumps ok ✓', 'k'],
    ['> task battery.full_test', 'c'],
  ];
  const term = $('#term'), jobBar = $('#jobBar'), jobPct = $('#jobPct'), whyN = $('#whyN');
  const whyLis = $$('.why-in li'), checks = $$('.checks li');
  let curScreen = null, screenT0 = 0;
  function setScreen(name, now) {
    if (name === curScreen) return;
    Object.entries(screens).forEach(([n, el]) => {
      el.classList.toggle('on', n === name);
      const v = $('video', el);
      if (v) { if (n === name) { v.currentTime = +(v.dataset.start || 0); v.play().catch(() => {}); } else v.pause(); }
    });
    curScreen = name; screenT0 = now;
  }
  function tickScreen(now) {
    const t = (now - screenT0) / 1000;
    if (curScreen === 'term') {
      let left = reduce ? 1e9 : t * 34, html = '';
      for (const [s, c] of TERM) {
        if (left <= 0) break;
        const n = Math.min(s.length, Math.floor(left));
        html += `<span class="${c}">${s.slice(0, n)}</span>` + (n === s.length ? '\n' : '');
        left -= s.length + 8;
      }
      if (term.dataset.h !== html) { term.innerHTML = html + '<span class="cur"></span>'; term.dataset.h = html; }
    } else if (curScreen === 'dcan') {
      const pctv = Math.min(100, reduce ? 64 : Math.floor((t * 16) % 118));
      jobBar.style.width = pctv + '%'; jobPct.textContent = pctv + '%';
    } else if (curScreen === 'why') {
      whyN.textContent = Math.round(95 * (reduce ? 1 : easeOut(clamp(t / 1.4))));
      whyLis.forEach((li, i) => li.classList.toggle('on', reduce || t > .5 + i * .3));
    } else if (curScreen === 'pro') {
      checks.forEach((li, i) => li.classList.toggle('on', reduce || t > .3 + i * .32));
    }
  }

  /* ---------- frame ---------- */
  const localOf = (arr, i, p) => clamp((p - arr[i].a) / (arr[i].b - arr[i].a));
  let lastCh = -1;
  function render(p, now) {
    let k = 0; for (let i = 1; i < SHOTS.length; i++) if (p >= SHOTS[i].a - (SHOTS[i].fade || F)) k = i;
    const fk = SHOTS[k].fade || F, t = k ? sm(SHOTS[k].a - fk, SHOTS[k].a + fk, p) : 1;
    const S = SHOTS[k], P = k ? SHOTS[k - 1] : null;
    const top = S.plate, prev = P ? P.plate : null;
    for (const [name, w] of Object.entries(worlds)) {
      let o = 0, zi = 0;
      if (name === top) { o = prev === top ? 1 : t; zi = 2; }
      else if (name === prev) { o = 1; zi = 1; }
      if (w.o !== o) { w.el.style.opacity = o; w.el.style.visibility = o ? 'visible' : 'hidden'; w.o = o; }
      w.el.style.zIndex = zi;
    }
    const lk = localOf(SHOTS, k, p), punch = SHOTS[k].fade ? 0 : (1 - t) * .07;
    placeWorld(worlds[top], lerp(S.z[0], S.z[1], lk) + punch, lerp(S.d[0], S.d[1], lk));
    if (prev && prev !== top) placeWorld(worlds[prev], P.z[1] - punch * .5, P.d[1]);

    const g0 = GRADE[(P || S).g], g1 = GRADE[S.g];
    const g = g0.map((v, i) => lerp(v, g1[i], t));
    grade.style.background = `rgba(${g[0] | 0},${g[1] | 0},${g[2] | 0},${g[3].toFixed(3)})`;
    const tn = TINT[(P || S).g].map((v, i) => lerp(v, TINT[S.g][i], t) | 0);
    tint.style.background = `rgb(${tn})`;

    CARS.forEach(c => { if (c.plate === top || c.plate === prev) placeCar(c, p); });

    let c = 0; for (let i = 0; i < CH.length; i++) if (p >= CH[i].a) c = i;
    const lc = localOf(CH, c, p);
    const visible = c === 0 ? p < CH[0].b - .01 : lc > .03 && p < CH[c].b - .01;
    blocks.forEach(b => b.classList.toggle('on', +b.dataset.ch === c && visible));
    if (c !== lastCh) { hudN.textContent = String(c).padStart(2, '0'); hudT.textContent = CH[c].t; lastCh = c; }
    hudBar.style.width = (lc * 100).toFixed(1) + '%';
    hint.style.opacity = p < .01 ? 1 : 0;
    setScreen(CH[c].screen, now);

    const q = sm(.96, 1, p);
    frame.style.transform = q ? `scale(${(1 - .1 * q).toFixed(4)})` : '';
    frame.style.borderRadius = (18 * q).toFixed(1) + 'px';
  }

  let target = 0, cur = 0, jump = null;
  function readScroll() {
    const total = flight.offsetHeight - stage.offsetHeight;
    target = jump !== null ? clamp(+jump) : clamp(-flight.getBoundingClientRect().top / total);
  }
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { measure(); readScroll(); });
  measure();
  if (document.fonts) document.fonts.ready.then(lead);
  // ?p=0.4 jumps straight to a point of the flight (for review shots)
  jump = new URLSearchParams(location.search).get('p');
  readScroll(); cur = target;

  function loop(now) {
    cur = reduce ? target : cur + (target - cur) * .1;
    if (Math.abs(target - cur) < .00005) cur = target;
    const r = flight.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) { render(cur, now); tickScreen(now); }
    requestAnimationFrame(loop);
  }

  /* ---------- preloader counts real asset loading ---------- */
  const pre = $('#pre'), preN = $('#preN');
  const urls = [...Object.keys(PLATES).map(n => `assets/${n}.jpg`), 'assets/mxw.webp', 'assets/mxb.webp', 'assets/car3.webp', 'assets/desk.webp', 'assets/desk-strip.webp'];
  let loaded = 0, shown = 0; const t0 = performance.now();
  urls.forEach(u => { const i = new Image(); i.onload = i.onerror = () => loaded++; i.src = u; });
  if (jump !== null) { pre.remove(); requestAnimationFrame(loop); return; }
  document.body.classList.add('loading');
  (function count(now) {
    const goal = Math.min(loaded / urls.length, (now - t0) / 1400) * 100;
    shown = reduce ? goal : Math.min(goal, shown + (goal - shown) * .12 + .3);
    preN.textContent = String(Math.floor(shown)).padStart(2, '0');
    if (shown >= 99.5) {
      preN.textContent = '100';
      setTimeout(() => { pre.classList.add('done'); document.body.classList.remove('loading'); }, 250);
      requestAnimationFrame(loop);
      return;
    }
    requestAnimationFrame(count);
  })(t0);
})();
