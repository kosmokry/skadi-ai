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
      const glass = (c.lead || (c.items || []).length || pr.value || (c.tags || []).length || c.link?.label) ? `<div class="glass">
        ${c.lead ? `<p class="lead">${esc(c.lead)}</p>` : ''}
        ${(c.items || []).length ? `<ol class="prog">${c.items.map((it, k) => `<li><span>0${k + 1}</span><b>${esc(it.name)}${it.badge ? ` <em>${esc(it.badge)}</em>` : ''}</b><small>${esc(it.text)}</small></li>`).join('')}</ol>` : ''}
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
    const IC = {
      tg: '<svg viewBox="0 0 24 24"><path d="M21.5 3.6 2.9 10.8c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.6c.3.9 1.4 1.1 2 .4l2.6-2.6 4.6 3.4c.8.6 1.9.1 2.1-.8L23.9 5c.3-1.1-.8-2-1.9-1.6ZM9.6 14.2l8.7-7.6-6.9 9.2-.3 3.1-1.5-4.7Z"/></svg>',
      ig: '<svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM17.3 5.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"/></svg>',
      tt: '<svg viewBox="0 0 24 24"><path d="M14 2h3c.2 2.2 1.6 3.8 4 4v3c-1.5 0-2.9-.4-4-1.2V15a6.5 6.5 0 1 1-6.5-6.5c.3 0 .7 0 1 .1v3.1a3.5 3.5 0 1 0 2.5 3.3V2Z"/></svg>',
      ph: '<svg viewBox="0 0 24 24"><path d="M6.6 2.8 9 5.2c.6.6.6 1.5.1 2.1L7.7 8.9a12 12 0 0 0 7.4 7.4l1.6-1.4c.6-.5 1.5-.5 2.1.1l2.4 2.4c.6.6.6 1.6 0 2.2l-1.5 1.5c-1 1-2.6 1.3-3.9.7A20 20 0 0 1 2.2 8.2c-.6-1.3-.3-2.9.7-3.9l1.5-1.5c.6-.6 1.6-.6 2.2 0Z"/></svg>'
    };
    const soc = [['tg', 'Telegram', tg, '@' + K.telegram], ['ig', 'Instagram', K.instagram, '@' + (String(K.instagram).split('/').filter(Boolean).pop() || '')], ['tt', 'TikTok', K.tiktok, String(K.tiktok).split('/').filter(Boolean).pop() || '']];
    document.querySelector('.foot .wrap').innerHTML = `
      <div class="ask">
        <div class="ask-l">
          <p class="kick">${esc(K.kick)}</p>
          <h2>${(K.title || []).map(t => `<span>${esc(t)}</span>`).join('')}</h2>
          <p class="lead">${esc(K.lead)}</p>
        </div>
        <article class="pc mgr">${ring}
          <div class="mgr-top">
            <div class="mgr-ph"><img src="${esc(K.managerPhoto)}" alt="${esc(K.managerRole)}" loading="lazy"><i class="live"></i></div>
            <div><p class="pn">${esc(K.managerRole)}</p><p class="mgr-h">@${esc(K.telegram)}</p><p class="mgr-n"><i class="dot"></i>${esc(K.managerNote)}</p></div>
          </div>
          <a class="pbtn pri mgr-cta" href="${tg}" target="_blank" rel="noopener">${IC.tg}Написать в Telegram</a>
          <ul class="soc">${soc.map(([k, n, u, h]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${IC[k]}<span><b>${n}</b><small>${esc(h)}</small></span></a></li>`).join('')}
            <li><a href="tel:${esc(K.phone)}">${IC.ph}<span><b>Телефон</b><small>${esc(K.phone)}</small></span></a></li></ul>
        </article>
      </div>
      <div class="foot-grid">
        <div><small>Продукты</small><a href="#pricing">SKAÐI/ÐCAN</a><a href="#pricing">Flasher</a><a href="#pricing">BoardViewer</a></div>
        <div><small>${esc(K.company)}</small><span>${esc(K.address)}</span><span>ИНН ${esc(K.inn)}</span></div>
        <div><small>Связь</small><a href="${tg}" target="_blank" rel="noopener">Telegram</a><a href="tel:${esc(K.phone)}">${esc(K.phone)}</a></div>
      </div>
      <div class="mark" aria-hidden="true">SKAÐI</div>
      <p class="copy-r"><img src="assets/logo.svg" alt=""> SKAÐI <span>${esc(K.copyright)}</span></p>`;
    document.querySelectorAll('.foot .pc').forEach(el => io.observe(el));
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

  /* ---------- 3D: the bench and the laptop are real geometry, the workshop is a panorama around them ---------- */
  const THREE = await import('three');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const CH = [
    { a: 0,   t: 'SKAÐI' },
    { a: .24, t: 'Программы' },
    { a: .54, t: 'Почему' },
    { a: .74, t: 'Для профи' },
    { a: .93, t: 'Тарифы' },
  ];
  CH.forEach((c, i) => c.b = CH[i + 1] ? CH[i + 1].a : 1);
  const screenFor = (c, lc) => c === 0 ? 'term' : c === 1 ? ['dcan', 'flasher', 'board'][Math.min(2, Math.floor(lc * 3))] : c === 2 ? 'why' : 'pro';

  const stage = $('#stage'), flight = $('#flight'), frame = $('#frame'), scenes = $('#scenes');
  const blocks = $$('.blk'), screens = {}; $$('.scr').forEach(s => screens[s.dataset.screen] = s);
  const hudN = $('#hudN'), hudT = $('#hudT'), hudBar = $('#hudBar'), hint = $('#hint');
  const screenEl = $('#screen'), SW = 1000, SH = 625;
  frame.insertBefore(screenEl, $('.copy'));

  // homography: the SW×SH html screen onto four points in viewport px (TL, TR, BR, BL)
  function quadMatrix(dst) {
    const src = [[0, 0], [SW, 0], [SW, SH], [0, SH]], A = [], B = [];
    src.forEach(([x, y], i) => { const [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); });
    for (let i = 0; i < 8; i++) {
      let m = i; for (let r = i + 1; r < 8; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
      [A[i], A[m]] = [A[m], A[i]]; [B[i], B[m]] = [B[m], B[i]];
      for (let r = 0; r < 8; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let k = i; k < 8; k++) A[r][k] -= f * A[i][k]; B[r] -= f * B[i]; }
    }
    const h = B.map((v, i) => v / A[i][i]);
    return `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,1)`;
  }

  // renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'gl';
  scenes.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2b2c2f');
  const cam3 = new THREE.PerspectiveCamera(36, 1, .05, 100);
  const loader = new THREE.TextureLoader();
  const tex = (url, srgb = true) => { const t = loader.load(url); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

  // workshop panorama on a cylinder around the bench (image covers 170°)
  const pano = tex('assets/pano.jpg');
  pano.wrapS = THREE.RepeatWrapping; pano.repeat.x = -1; pano.offset.x = 1;
  const R = 11, ARC = THREE.MathUtils.degToRad(170), CYH = R * ARC * 821 / 1916;
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, CYH, 128, 1, true, Math.PI - ARC / 2, ARC),
    new THREE.MeshBasicMaterial({ map: pano, side: THREE.BackSide, toneMapped: false }));
  cyl.position.y = .95 + .52 * CYH - CYH / 2; scene.add(cyl);
  // environment for metal reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  // studio-like daylight reflections so brushed aluminium reads as metal, not as a dark mirror of the room
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  // floor: matte micro-cement that fades into the painted floor of the panorama
  const fade = document.createElement('canvas'); fade.width = fade.height = 256;
  { const g = fade.getContext('2d'), gr = g.createRadialGradient(128, 128, 30, 128, 128, 128);
    gr.addColorStop(0, '#fff'); gr.addColorStop(.55, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ color: '#232427', roughness: .95, metalness: 0, alphaMap: new THREE.CanvasTexture(fade), transparent: true }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // light: soft daylight from skylights
  scene.add(new THREE.HemisphereLight('#eef2f7', '#2a2b2e', 1.0));
  const sun = new THREE.DirectionalLight('#ffffff', 2.3); sun.position.set(1.2, 6, 2.2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -.0004;
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 1, far: 12 }); scene.add(sun);

  // materials
  const brushed = document.createElement('canvas'); brushed.width = 512; brushed.height = 512;
  { const g = brushed.getContext('2d'); g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) { const y = Math.random() * 512, c = 110 + Math.random() * 60 | 0; g.fillStyle = `rgba(${c},${c},${c},.35)`; g.fillRect(Math.random() * 512, y, 40 + Math.random() * 300, 1); } }
  const brushTex = new THREE.CanvasTexture(brushed); brushTex.wrapS = brushTex.wrapT = THREE.RepeatWrapping; brushTex.repeat.set(2, 2);
  const alu = new THREE.MeshStandardMaterial({ color: '#e3e6ea', metalness: .85, roughness: .32, roughnessMap: brushTex, envMapIntensity: 1.1 });
  const aluDark = new THREE.MeshStandardMaterial({ color: '#c3c7cd', metalness: .85, roughness: .4, roughnessMap: brushTex });
  const black = new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: .65, roughness: .42 });
  const plastic = new THREE.MeshStandardMaterial({ color: '#141518', metalness: .1, roughness: .55 });
  const shadowCast = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const box = (w, h, d, mat, x, y, z, r = 0) => { const g = r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d); const m = shadowCast(new THREE.Mesh(g, mat)); m.position.set(x, y, z); return m; };

  const bench = new THREE.Group(); scene.add(bench);
  // table: top, legs, rails, drawer unit with handles
  const TOP = .9;
  bench.add(box(1.6, .04, .76, alu, 0, TOP - .02, 0, .008));
  [[-.74, -.32], [-.74, .32], [.74, -.32], [.74, .32]].forEach(([x, z]) => bench.add(box(.045, TOP - .04, .045, aluDark, x, (TOP - .04) / 2, z)));
  bench.add(box(.045, .04, .64, aluDark, -.74, .16, 0)); bench.add(box(1.48, .04, .04, aluDark, 0, .16, -.32));
  bench.add(box(.46, .6, .64, alu, .48, TOP - .04 - .3, 0, .006));
  for (let i = 0; i < 4; i++) {
    const y = TOP - .1 - i * .15;
    bench.add(box(.44, .002, .005, plastic, .48, y - .068, .322));
    bench.add(box(.14, .012, .016, aluDark, .48, y, .334, .004));
  }

  // laptop: base, keyboard, trackpad, lid with screen
  const laptop = new THREE.Group(); laptop.position.set(-.36, TOP, .04); laptop.rotation.y = .12; bench.add(laptop);
  laptop.add(box(.356, .016, .248, black, 0, .008, 0, .006));
  const kb = document.createElement('canvas'); kb.width = 1024; kb.height = 400;
  { const g = kb.getContext('2d'); g.fillStyle = '#16171a'; g.fillRect(0, 0, 1024, 400); g.fillStyle = '#0b0c0e';
    const rows = [14, 14, 13, 12, 11, 9]; rows.forEach((n, r) => { const kw = 1000 / 14.2; for (let k = 0; k < n; k++) g.fillRect(12 + k * kw + (14 - n) * kw / 2, 12 + r * 64, kw - 8, 54); }); }
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(.29, .112), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(kb), color: '#4a4c50', roughness: .8, envMapIntensity: .3 }));
  keys.rotation.x = -Math.PI / 2; keys.position.set(0, .0163, -.045); laptop.add(keys);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(.15, .085), new THREE.MeshStandardMaterial({ color: '#34363b', metalness: .4, roughness: .3 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, .0163, .07); laptop.add(pad);
  const lid = new THREE.Group(); lid.position.set(0, .016, -.122); lid.rotation.x = -.32; laptop.add(lid);
  lid.add(box(.356, .248, .006, black, 0, .124, -.003, .005));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(.346, .238), new THREE.MeshStandardMaterial({ color: '#050607', roughness: .08, metalness: .2 }));
  glass.position.set(0, .124, .0002); lid.add(glass);
  // screen corners in lid space (16:10 panel inside the bezel)
  const SCR = [[-.162, .228], [.162, .228], [.162, .025], [-.162, .025]].map(([x, y]) => new THREE.Vector3(x, y, .0006));

  // control modules, loose boards, chips, JTAG adapter with ribbon, tweezers
  const pcbTex = tex('assets/t-pcb.jpg');
  const pcbMat = new THREE.MeshStandardMaterial({ map: pcbTex, roughness: .5, metalness: .2 });
  [[.02, -.17, .2], [.27, -.15, -.25]].forEach(([x, z, ry]) => {
    const g = new THREE.Group(); g.position.set(x, TOP, z); g.rotation.y = ry; bench.add(g);
    g.add(box(.2, .03, .15, alu, 0, .015, 0, .004));
    const top = new THREE.Mesh(new THREE.PlaneGeometry(.18, .13), pcbMat); top.rotation.x = -Math.PI / 2; top.position.y = .0305; g.add(top);
    g.add(box(.05, .022, .02, plastic, -.04, .02, .083)); g.add(box(.05, .022, .02, plastic, .03, .02, .083));
  });
  const loose = box(.15, .004, .1, pcbMat, .0, TOP + .002, .2); loose.rotation.y = -.15; bench.add(loose);
  for (let i = 0; i < 9; i++) bench.add(box(.016, .004, .016, plastic, .14 + (i % 3) * .032 + Math.random() * .01, TOP + .002, .17 + (i / 3 | 0) * .03));
  const jtag = box(.07, .022, .045, plastic, .3, TOP + .011, .18, .004); jtag.rotation.y = .3; bench.add(jtag);
  const ribbon = box(.13, .002, .026, new THREE.MeshStandardMaterial({ color: '#b9bcc4', roughness: .6 }), .16, TOP + .002, .22); ribbon.rotation.y = .2; bench.add(ribbon);
  [0, .012].forEach(o => { const t = box(.13, .003, .005, alu, .55, TOP + .002, .24 + o); t.rotation.y = .5 + o * 6; bench.add(t); });

  // cable: laptop port, over the table edge, down to the floor and away towards the Tesla
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.54, TOP + .008, .05), new THREE.Vector3(-.7, TOP + .01, .12), new THREE.Vector3(-.81, TOP - .02, .16),
    new THREE.Vector3(-.86, .5, .2), new THREE.Vector3(-.9, .03, .35), new THREE.Vector3(-1.3, .006, .9), new THREE.Vector3(-2.6, .006, 1.4), new THREE.Vector3(-4.2, .006, 1.2)]);
  bench.add(shadowCast(new THREE.Mesh(new THREE.TubeGeometry(path, 200, .0045, 8), new THREE.MeshStandardMaterial({ color: '#0d0e10', roughness: .55 }))));

  // camera: drone orbit around the laptop, 90° in total
  const T = new THREE.Vector3(); laptop.updateWorldMatrix(true, false); laptop.localToWorld(T.set(0, .1, -.02));
  const KEYS = [ // p, angle°, distance, height
    [0,   -46, 2.4, 1.95],
    [.24, -18, 2.0, 1.78],
    [.54,  14, 1.7, 1.62],
    [.74,  34, 1.45, 1.52],
    [1,    44, 1.38, 1.5],
  ];
  const ease = t => t * t * (3 - 2 * t);
  function cam(p) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const t = ease(clamp((p - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0])));
    return KEYS[i].map((v, j) => lerp(v, KEYS[i + 1][j], t));
  }

  let vw = 0, vh = 0, mobile = false, dirty = true;
  function measure() {
    vw = stage.clientWidth; vh = stage.clientHeight; mobile = vw <= 760;
    renderer.setSize(vw, vh, false); cam3.aspect = vw / vh;
    cam3.fov = mobile ? 52 : 36;
    // shift the frame so the laptop sits right of centre on desktop, low centre on phones
    if (mobile) cam3.setViewOffset(vw, vh, 0, -vh * .2, vw, vh); else cam3.setViewOffset(vw, vh, -vw * .17, vh * .06, vw, vh);
    cam3.updateProjectionMatrix(); dirty = true; lead();
  }
  const v3 = new THREE.Vector3(), nrm = new THREE.Vector3();
  function place3d(p, now) {
    const [, ang, dist, h0] = cam(p), a = THREE.MathUtils.degToRad(ang);
    const hgt = mobile ? h0 + .7 : h0; // phones: higher drone, dark floor behind the copy
    const hover = reduce ? 0 : Math.sin(now / 1600) * .006;
    cam3.position.set(T.x + Math.sin(a) * dist, hgt + hover, T.z + Math.cos(a) * dist);
    cam3.lookAt(T);
    renderer.render(scene, cam3);
    // live screen: project the panel corners and map the html screen onto them
    lid.updateWorldMatrix(true, false);
    const pts = SCR.map(c => { v3.copy(c); lid.localToWorld(v3); v3.project(cam3); return [(v3.x + 1) / 2 * vw, (1 - v3.y) / 2 * vh]; });
    screenEl.style.transform = quadMatrix(pts);
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
    place3d(p, now);

    let c = 0; for (let i = 0; i < CH.length; i++) if (p >= CH[i].a) c = i;
    const lc = localOf(CH, c, p);
    const visible = c === 0 ? p < CH[0].b - .02 : lc > .12 && p < CH[c].b - .02;
    blocks.forEach(b => b.classList.toggle('on', +b.dataset.ch === c && visible));
    const scr = screenFor(Math.min(c, 3), c === 1 ? lc : 0);
    $$('.prog li').forEach((li, i) => li.classList.toggle('on', c === 1 && scr === ['dcan', 'flasher', 'board'][i]));
    if (c !== lastCh) { hudN.textContent = String(c).padStart(2, '0'); hudT.textContent = CH[c].t; lastCh = c; }
    hudBar.style.width = (lc * 100).toFixed(1) + '%';
    hint.style.opacity = p < .01 ? 1 : 0;
    setScreen(scr, now);

    const q = sm(.96, 1, p);
    frame.style.transform = q ? `scale(${(1 - .1 * q).toFixed(4)})` : '';
    frame.style.borderRadius = (4 * q).toFixed(1) + 'px';
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
  const urls = ['assets/pano.jpg', 'assets/t-pcb.jpg'];
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
