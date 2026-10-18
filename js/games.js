/* ============================================================================
 *  games.js — каталог мини-игр. Все игры написаны вручную, работают с мышью
 *  и пальцем, берегут кадры и корректно убирают за собой (destroy).
 * ==========================================================================*/
(function (global) {
  'use strict';
  const APP = (global.APP = global.APP || {});

  /* ============================== GAME KIT ================================= */

  function el(tag, props, kids) {
    const n = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      }
    }
    const list = Array.isArray(kids) ? kids : (kids ? [kids] : []);
    for (const c of list) if (c) n.append(c);
    return n;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  /* --- область жизни: всё, что создано внутри, умирает вместе с игрой ------ */
  function scope() {
    const offs = [], stops = [];
    return {
      on(target, ev, fn, opts) {
        target.addEventListener(ev, fn, opts);
        const off = () => target.removeEventListener(ev, fn, opts);
        offs.push(off);
        return off;
      },
      raf(fn) {
        let id = 0, stop = false, last = performance.now();
        const tick = (now) => {
          if (stop) return;
          const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
          last = now;
          if (!document.hidden) { try { fn(dt, now); } catch (e) { stop = true; throw e; } }
          id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        const end = () => { stop = true; cancelAnimationFrame(id); };
        stops.push(end);
        return end;
      },
      interval(fn, ms) { const id = setInterval(fn, ms); stops.push(() => clearInterval(id)); return id; },
      timeout(fn, ms) { const id = setTimeout(fn, ms); stops.push(() => clearTimeout(id)); return id; },
      observe(target, fn) { const ro = new ResizeObserver(fn); ro.observe(target); stops.push(() => ro.disconnect()); return ro; },
      dispose() { stops.splice(0).forEach((f) => f()); offs.splice(0).forEach((f) => f()); }
    };
  }

  /* ------------------------------- звук ----------------------------------- */
  let AC = null;
  function audio() {
    try {
      if (!AC && (window.AudioContext || window.webkitAudioContext)) {
        AC = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (AC && AC.state === 'suspended') AC.resume();
    } catch (e) { AC = null; }
    return AC;
  }
  function tone(freq, dur, type, vol) {
    const ctx = audio();
    if (!ctx || APP.PREFS.muted) return;
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      const t = ctx.currentTime, d = dur || 0.16;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol === undefined ? 0.14 : vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + d + 0.03);
    } catch (e) { /* тишина тоже вариант */ }
  }
  const FX = {
    click: () => tone(560, 0.07, 'triangle', 0.1),
    pop: () => tone(880, 0.12, 'sine', 0.12),
    ok: () => tone(720, 0.18, 'sine', 0.13),
    err: () => tone(150, 0.22, 'sawtooth', 0.08),
    step: () => tone(420, 0.06, 'sine', 0.07),
    win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sine', 0.12), i * 110)); },
    lose: () => { [392, 311, 233].forEach((f, i) => setTimeout(() => tone(f, 0.32, 'sine', 0.1), i * 130)); }
  };
  function sfx(name) { (FX[name] || FX.click)(); }

  /* ------------------------- «конфетти» из пузырьков ----------------------- */
  function burst(container, count, colors) {
    if (APP.PREFS.reduceMotion) return;
    const n = count || 18;
    for (let i = 0; i < n; i++) {
      const size = 6 + Math.random() * 12;
      const c = colors && colors.length ? colors[Math.floor(Math.random() * colors.length)] : 'rgba(255,255,255,.85)';
      const b = el('span', { class: 'g-burst', style: { width: size + 'px', height: size + 'px', background: c } });
      container.append(b);
      const ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 160;
      const anim = b.animate([
        { transform: 'translate(-50%,-50%) scale(0.4)', opacity: 0.95 },
        { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist - 30) + 'px) scale(1) ', opacity: 0 }
      ], { duration: 700 + Math.random() * 600, easing: 'cubic-bezier(.22,1,.36,1)' });
      anim.onfinish = () => b.remove();
    }
  }

  /* ------------------------------ хранилище -------------------------------- */
  function readStore(key, def) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; } catch (e) { return def; }
  }
  function writeStore(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* приватный режим */ }
  }
  const hiAll = () => readStore(APP.CONFIG.HI_KEY, {});
  function hi(gameId) { const v = hiAll()[gameId]; return typeof v === 'number' ? v : 0; }
  function setHi(gameId, value) {
    const all = hiAll();
    if (!all[gameId] || value > all[gameId]) { all[gameId] = value; writeStore(APP.CONFIG.HI_KEY, all); return true; }
    return false;
  }

  /* -------------------------------- тост ---------------------------------- */
  let toastHost = null;
  function toast(text, kind) {
    if (!toastHost) {
      toastHost = el('div', { class: 'lg-toasts', role: 'status' });
      document.body.append(toastHost);
    }
    const t = el('div', { class: 'lg-toast' + (kind ? ' is-' + kind : ''), text });
    toastHost.append(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 500); }, 2400);
  }

  /* --------------------------- стеклянная обвязка -------------------------- */
  function shell(root, extraClass) {
    clear(root);
    const wrap = el('div', { class: 'g-wrap' + (extraClass ? ' ' + extraClass : '') });
    const top = el('div', { class: 'g-top' });
    const mid = el('div', { class: 'g-mid' });
    const bot = el('div', { class: 'g-bot' });
    const hint = el('div', { class: 'g-hint' });
    bot.append(hint);
    wrap.append(top, mid, bot);
    root.append(wrap);

    let current = null;
    const api = {
      wrap, top, mid, bot, hint,
      stat(label, initial) {
        const val = el('b', { text: String(initial === undefined ? 0 : initial) });
        const chip = el('span', { class: 'g-chip' }, [el('i', { text: label }), val]);
        top.append(chip);
        return { chip, set(v) { val.textContent = String(v); } };
      },
      badge(text) { const n = el('span', { class: 'g-chip g-chip--soft', text }); top.append(n); return n; },
      btn(label, fn, primary) {
        const b = el('button', { class: 'g-btn' + (primary ? ' is-primary' : ''), type: 'button', text: label },
          []);
        b.addEventListener('click', (e) => { e.preventDefault(); sfx('click'); fn(e); });
        bot.append(b);
        return b;
      },
      setHint(text) { hint.textContent = text || ''; return hint; },
      overlay(opts) {
        opts = opts || {};
        if (current) current.hide();
        const card = el('div', { class: 'g-overlay-card' }, [
          opts.emoji ? el('div', { class: 'g-overlay-emoji', text: opts.emoji }) : null,
          el('h4', { text: opts.title || '' }),
          opts.text ? el('p', { text: opts.text }) : null,
          el('div', { class: 'g-overlay-actions' }, (opts.actions || []).map((a) =>
            el('button', {
              class: 'g-btn' + (a.primary ? ' is-primary' : ''), type: 'button', text: a.label,
              onclick: () => { o.hide(); sfx('click'); if (a.fn) a.fn(); }
            })))
        ]);
        const box = el('div', { class: 'g-overlay' }, [card]);
        mid.append(box);
        requestAnimationFrame(() => box.classList.add('in'));
        const o = {
          el: box,
          hide() {
            if (o.dead) return;
            o.dead = true;
            box.classList.remove('in');
            setTimeout(() => box.remove(), 340);
            if (current === o) current = null;
          }
        };
        current = o;
        return o;
      },
      hideOverlay() { if (current) current.hide(); }
    };
    return api;
  }

  /* ----------------------------- логический холст -------------------------- */
  function stageCanvas(mid, aspectW, aspectH) {
    const canvas = el('canvas', { class: 'g-canvas' });
    canvas.style.aspectRatio = aspectW + ' / ' + aspectH;
    if (aspectH > aspectW) canvas.style.maxWidth = 'min(100%, ' + (58 * aspectW / aspectH).toFixed(1) + 'vh)';
    mid.append(canvas);
    const L = { w: aspectW, h: aspectH, s: 1 };
    function fit() {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      L.s = canvas.width / L.w;
    }
    fit();
    L.fit = fit;
    L.canvas = canvas;
    L.clear = () => { const c = canvas.getContext('2d'); c.setTransform(L.s, 0, 0, L.s, 0, 0); c.clearRect(0, 0, L.w, L.h); };
    L.ctx = () => { const c = canvas.getContext('2d'); c.setTransform(L.s, 0, 0, L.s, 0, 0); return c; };
    return L;
  }
  function pointer(canvas, L) {
    return (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * L.w, y: (e.clientY - r.top) / r.height * L.h };
    };
  }
  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  /* --- клавиатура слушается только у «активной» карточки игры --------------- */
  let keyActive = null;
  function markKeyActive(root) {
    const card = root && root.closest ? root.closest('.lg-game') : null;
    if (card) keyActive = card;
  }
  function keyOwner(root) {
    const card = root && root.closest ? root.closest('.lg-game') : null;
    if (!card) return true;
    if (card.classList.contains('is-full')) return true;
    if (document.activeElement && card.contains(document.activeElement)) return true;
    try { if (card.matches(':hover')) return true; } catch (e) { /* старый браузер */ }
    if (keyActive === card) return true;
    return document.querySelectorAll('.lg-game').length === 1;
  }

  function swipe(node, cb) {    let sx = 0, sy = 0, active = false, moved = false;
    const down = (e) => { active = true; moved = false; sx = e.clientX; sy = e.clientY; };
    const move = (e) => { if (active && Math.hypot(e.clientX - sx, e.clientY - sy) > 22) moved = true; };
    const up = (e) => {
      if (!active) return;
      active = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.hypot(dx, dy) < 26) return;
      if (Math.abs(dx) > Math.abs(dy)) cb(dx > 0 ? 'right' : 'left');
      else cb(dy > 0 ? 'down' : 'up');
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move, { passive: true });
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', () => { active = false; });
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
    };
  }

  /* --------------------------- общие помощники игр ------------------------- */
  function score(ctx, value) {
    const rec = setHi(ctx.item.game, value);
    if (ctx.api && ctx.api.onScore) ctx.api.onScore(value, rec);
    return rec;
  }
  function palette() {
    const t = APP.theme || {};
    return {
      accent: t.accent || '#7c5cff',
      accent2: t.accent2 || '#22d3ee',
      ink: t.mode === 'light' ? 'rgba(20,22,40,.86)' : 'rgba(255,255,255,.92)',
      soft: t.mode === 'light' ? 'rgba(20,22,40,.14)' : 'rgba(255,255,255,.16)',
      line: t.mode === 'light' ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)'
    };
  }
  const DECKS = {
    emoji: ['🫧', '⚡', '🌙', '🍬', '🐙', '🎈', '🧊', '🌵', '🍋', '🎧', '🪐', '🧿'],
    space: ['🌍', '🌕', '☄️', '🛰️', '🌟', '🪐', '🚀', '👨‍🚀', '🔭', '🌌', '⭐', '🛸'],
    food: ['🍕', '🍣', '🍓', '🥐', '🍜', '🍩', '🥑', '🍇', '🍫', '🍿', '🥕', '🍯'],
    animals: ['🦦', '🐙', '🦋', '🐌', '🦊', '🐳', '🐝', '🦉', '🐿️', '🦔', '🐞', '🐧']
  };
  const STROOP = [
    { name: 'красный', hex: '#ff5a5a' }, { name: 'синий', hex: '#5aa9ff' },
    { name: 'зелёный', hex: '#4ade80' }, { name: 'жёлтый', hex: '#ffd166' },
    { name: 'фиолетовый', hex: '#b18cff' }, { name: 'оранжевый', hex: '#ff9a3c' }
  ];
  const TEXTS = {
    ru: [
      'Стекло пропускает свет и не спорит с ним',
      'Мыльный пузырь живёт восемь секунд и не сомневается',
      'Тёплый чай и тихий вечер за окном',
      'Плавные движения делают интерфейс мягче',
      'Пузыри любят спокойные руки и мыльную воду',
      'Хорошая игра начинается с понятной кнопки',
      'Медленная анимация выглядит дороже быстрой',
      'Окно открыто, город шумит, чай остывает'
    ],
    en: [
      'Glass lets the light through without arguing',
      'A soap bubble lives for eight quiet seconds',
      'Soft blur makes an interface feel calm',
      'Slow motion always looks more expensive',
      'Every bubble ends with a tiny pop',
      'A good game starts with one clear button'
    ]
  };

  /* ================================ ИГРЫ =================================== */

  /* ------------------------------- 1. Змейка ------------------------------- */
  function gameSnake(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-snake');
    const N = p.cols, wrap = !!p.wrap;
    const stepMs = 195 - p.speed * 13;
    const L = stageCanvas(sh.mid, N, N);
    sh.mid.classList.add('is-square');
    const sc = sh.stat('Очки');
    const best = sh.stat('Рекорд', hi('snake'));
    sh.setHint('Стрелки, WASD или свайп по полю. Пробел — пауза.');
    ctx.api.onScore(0);

    let body, dir, queue, food, dead, paused, acc, light;
    function reset() {
      body = [{ x: (N / 2) | 0, y: (N / 2) | 0 }];
      dir = { x: 1, y: 0 }; queue = []; acc = 0; dead = false; paused = false; light = 0;
      placeFood();
      sc.set(0); ctx.api.onScore(0); sh.hideOverlay();
    }
    function placeFood() {
      const free = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (!body.some((b) => b.x === x && b.y === y)) free.push({ x, y });
      }
      food = free.length ? free[(Math.random() * free.length) | 0] : null;
    }
    function turn(axis, value) {
      const last = queue.length ? queue[queue.length - 1] : dir;
      if (last.x === -value && axis === 'x') return;
      if (last.y === -value && axis === 'y') return;
      if (last[axis] === value) return;
      queue.push({ x: axis === 'x' ? value : 0, y: axis === 'y' ? value : 0 });
    }
    function step() {
      if (queue.length) dir = queue.shift();
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (wrap) { head.x = (head.x + N) % N; head.y = (head.y + N) % N; }
      else if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N) return die();
      if (body.some((b, i) => i < body.length - 1 && b.x === head.x && b.y === head.y)) return die();
      body.unshift(head);
      if (food && head.x === food.x && head.y === food.y) {
        light = 1;
        sfx('pop');
        sc.set(body.length - 1);
        score(ctx, body.length - 1);
        best.set(hi('snake'));
        placeFood();
      } else body.pop();
    }
    function die() {
      dead = true; sfx('lose');
      const value = body.length - 1;
      const rec = setHi('snake', value);
      sh.overlay({
        emoji: '🫧', title: rec ? 'Новый рекорд!' : 'Змейка устала',
        text: 'Длина: ' + value + '. Рекорд: ' + hi('snake') + '.',
        actions: [
          { label: 'Ещё раз', primary: true, fn: reset },
          { label: 'Новая игра', fn: () => { reset(); } }
        ]
      });
    }
    function draw() {
      const c = L.ctx(), pal = palette(), cell = L.w / N;
      c.clearRect(0, 0, L.w, L.h);
      c.strokeStyle = pal.soft; c.lineWidth = Math.max(0.4, cell * 0.02);
      for (let i = 1; i < N; i++) {
        c.beginPath(); c.moveTo(i * cell, 0); c.lineTo(i * cell, L.h); c.stroke();
        c.beginPath(); c.moveTo(0, i * cell); c.lineTo(L.w, i * cell); c.stroke();
      }
      if (food) {
        const g = c.createRadialGradient(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.1, food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.62);
        g.addColorStop(0, 'rgba(255,255,255,.95)');
        g.addColorStop(0.5, pal.accent2);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.58, 0, 6.2832); c.fill();
      }
      for (let i = body.length - 1; i >= 0; i--) {
        const b = body[i], k = 1 - i / (body.length + 4);
        c.globalAlpha = 0.35 + 0.65 * k;
        c.fillStyle = i === 0 ? pal.ink : pal.accent;
        const pad = cell * (i === 0 ? 0.06 : 0.1);
        roundRect(c, b.x * cell + pad, b.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.34);
        c.fill();
      }
      c.globalAlpha = 1;
      if (light > 0) {
        c.globalAlpha = light * 0.35;
        const g2 = c.createRadialGradient(body[0].x * cell + cell / 2, body[0].y * cell + cell / 2, 1, body[0].x * cell + cell / 2, body[0].y * cell + cell / 2, cell * 2.6);
        g2.addColorStop(0, pal.accent2); g2.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g2; c.fillRect(0, 0, L.w, L.h);
        c.globalAlpha = 1;
        light = Math.max(0, light - 0.05);
      }
      if (paused && !dead) {
        c.fillStyle = 'rgba(10,12,24,.35)';
        roundRect(c, L.w * 0.2, L.h * 0.42, L.w * 0.6, L.h * 0.16, L.w * 0.05); c.fill();
        c.fillStyle = pal.ink; c.font = '600 ' + (L.w * 0.06) + 'px -apple-system, system-ui, sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('пауза', L.w / 2, L.h * 0.5);
      }
    }
    reset();
    s.observe(sh.mid, () => { L.fit(); });
    s.on(window, 'resize', () => L.fit());
    s.on(window, 'keydown', (e) => {
      if (!keyOwner(ctx.root)) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) !== -1) e.preventDefault();
      if (dead) return;
      if (k === 'arrowup' || k === 'w' || k === 'ц') turn('y', -1);
      else if (k === 'arrowdown' || k === 's' || k === 'ы') turn('y', 1);
      else if (k === 'arrowleft' || k === 'a' || k === 'ф') turn('x', -1);
      else if (k === 'arrowright' || k === 'd' || k === 'в') turn('x', 1);
      else if (k === ' ') paused = !paused;
    });
    swipe(L.canvas || sh.mid, (d) => {
      if (dead) return;
      if (d === 'up') turn('y', -1);
      if (d === 'down') turn('y', 1);
      if (d === 'left') turn('x', -1);
      if (d === 'right') turn('x', 1);
    });
    s.raf((dt) => {
      if (!dead && !paused) {
        acc += dt * 1000;
        while (acc >= stepMs) { acc -= stepMs; if (!dead) step(); }
      }
      draw();
    });
    return { restart: reset };
  }

  /* ------------------------------- 2. 2048 --------------------------------- */
  function game2048(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-2048');
    const N = p.size, goal = p.goal;
    const stage = el('div', { class: 'b2048' });
    sh.mid.append(stage);
    const sc = sh.stat('Очки');
    const best = sh.stat('Рекорд', hi('n2048'));
    sh.setHint('Стрелки, WASD или свайп. Цель — собрать ' + goal + '.');
    ctx.api.onScore(0);

    let grid, tiles, id, points, over, won, busy, removeTimer = [];
    let timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    const ix = (r, c) => r * N + c;

    function reset() {
      timers.forEach(clearTimeout); timers = [];
      clear(stage);
      grid = new Array(N * N).fill(null);
      tiles = []; id = 1; points = 0; over = false; won = false; busy = false;
      sc.set(0); ctx.api.onScore(0); sh.hideOverlay();
      spawn(); spawn();
    }
    function makeTile(t) {
      const e = el('div', { class: 'b2048-tile v' + (t.value > 2048 ? 'big' : t.value) }, [el('span', { text: String(t.value) })]);
      e.style.width = (100 / N) + '%';
      e.style.height = (100 / N) + '%';
      e.style.transform = 'translate(' + (t.c * 100) + '%,' + (t.r * 100) + '%)';
      t.el = e;
      stage.append(e);
      return e;
    }
    function paint(t) {
      t.el.className = 'b2048-tile v' + (t.value > 2048 ? 'big' : t.value);
      t.el.firstChild.textContent = String(t.value);
    }
    function spawn() {
      const free = [];
      for (let i = 0; i < grid.length; i++) if (!grid[i]) free.push(i);
      if (!free.length) return false;
      const i = free[(Math.random() * free.length) | 0];
      const t = { id: id++, value: Math.random() < 0.88 ? 2 : 4, r: (i / N) | 0, c: i % N };
      grid[i] = t; tiles.push(t);
      makeTile(t);
      requestAnimationFrame(() => t.el.classList.add('is-new'));
      return true;
    }
    function canMove() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const t = grid[ix(r, c)];
        if (!t) return true;
        const right = c + 1 < N ? grid[ix(r, c + 1)] : null;
        const down = r + 1 < N ? grid[ix(r + 1, c)] : null;
        if (right && right.value === t.value) return true;
        if (down && down.value === t.value) return true;
      }
      return false;
    }
    function move(dx, dy) {
      if (over || busy) return;
      const order = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) order.push({ r, c });
      order.sort((a, b) => (dy ? (dy > 0 ? b.r - a.r : a.r - b.r) : 0) || (dx ? (dx > 0 ? b.c - a.c : a.c - b.c) : 0));

      let moved = false, gained = 0;
      const dead = [];
      for (const cell of order) {
        const t = grid[ix(cell.r, cell.c)];
        if (!t) continue;
        let r = cell.r, c = cell.c;
        for (;;) {
          const nr = r + dy, nc = c + dx;
          if (nr < 0 || nc < 0 || nr >= N || nc >= N) break;
          const occ = grid[ix(nr, nc)];
          if (!occ) { r = nr; c = nc; continue; }
          if (occ.value === t.value && !occ.merged && !occ.pending) {
            // слияние
            occ.merged = true;
            occ.pending = t.value * 2;
            gained += occ.pending;
            grid[ix(cell.r, cell.c)] = null;
            t.r = occ.r; t.c = occ.c; t.dead = true;
            dead.push(t);
            t.el.style.zIndex = 2;
            t.el.style.transform = 'translate(' + (occ.c * 100) + '%,' + (occ.r * 100) + '%)';
            moved = true;
          }
          break;
        }
        if (t.dead) continue;
        if (r !== cell.r || c !== cell.c) {
          grid[ix(cell.r, cell.c)] = null;
          grid[ix(r, c)] = t;
          t.r = r; t.c = c;
          t.el.style.transform = 'translate(' + (c * 100) + '%,' + (r * 100) + '%)';
          moved = true;
        }
      }
      if (!moved) return;

      busy = true;
      points += gained;
      sc.set(points);
      score(ctx, points);
      best.set(hi('n2048'));
      later(() => {
        dead.forEach((t) => { t.el.remove(); tiles = tiles.filter((x) => x !== t); });
        tiles.forEach((t) => {
          if (t.pending) { t.value = t.pending; t.pending = 0; paint(t); t.el.classList.add('is-merged'); later(() => t.el.classList.remove('is-merged'), 220); }
          t.merged = false;
        });
        spawn();
        if (tiles.some((t) => t.value >= goal) && !won) {
          won = true; sfx('win'); burst(sh.mid, 26);
          sh.overlay({
            emoji: '🏆', title: 'Цель достигнута: ' + goal,
            text: 'Можно остановиться или идти дальше.',
            actions: [
              { label: 'Продолжить', primary: true, fn: () => { } },
              { label: 'Заново', fn: reset }
            ]
          });
        } else if (!canMove()) {
          over = true; sfx('lose');
          sh.overlay({
            emoji: '🧼', title: 'Ходов больше нет',
            text: 'Очки: ' + points + '. Рекорд: ' + hi('n2048') + '.',
            actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
          });
        }
        busy = false;
      }, 175);
    }
    reset();
    s.on(window, 'keydown', (e) => {
      if (!keyOwner(ctx.root)) return;
      const k = e.key.toLowerCase();
      const m = { arrowup: [0, -1], w: [0, -1], ц: [0, -1], arrowdown: [0, 1], s: [0, 1], ы: [0, 1], arrowleft: [-1, 0], a: [-1, 0], ф: [-1, 0], arrowright: [1, 0], d: [1, 0], в: [1, 0] }[k];
      if (!m) return;
      e.preventDefault();
      move(m[0], m[1]);
    });
    swipe(sh.mid, (d) => {
      if (d === 'up') move(0, -1);
      if (d === 'down') move(0, 1);
      if (d === 'left') move(-1, 0);
      if (d === 'right') move(1, 0);
    });
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* -------------------------------- 3. Пары -------------------------------- */
  function gameMemory(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-memory');
    const pairs = p.pairs;
    const deck = (DECKS[p.deck] || DECKS.emoji).slice(0, pairs);
    const cols = pairs === 6 ? 4 : (pairs === 8 ? 4 : 5);
    const board = el('div', { class: 'g-memory-board', style: { gridTemplateColumns: 'repeat(' + cols + ', 1fr)' } });
    sh.mid.append(board);
    const movesEl = sh.stat('Ходы');
    const timeEl = sh.stat('Время', '0:00');
    const best = sh.stat('Рекорд', hi('memory') || '—');
    sh.setHint('Открывай по две карточки и находи одинаковые.');
    ctx.api.onScore(0);

    let first, lock, moves, started, timerId, done;
    function reset() {
      clear(board);
      moves = 0; first = null; lock = false; done = false; started = 0;
      movesEl.set(0); timeEl.set('0:00');
      sh.hideOverlay();
      const cards = deck.concat(deck).map((v, i) => ({ v, key: Math.random() }));
      cards.sort((a, b) => a.key - b.key);
      cards.forEach((card, i) => {
        const inner = el('div', { class: 'g-memory-face' }, [el('span', { text: '🫧' })]);
        const back = el('div', { class: 'g-memory-face g-memory-back' }, [el('span', { text: card.v })]);
        const cardEl = el('button', { class: 'g-memory-card', type: 'button', 'aria-label': 'карточка' }, [inner, back]);
        cardEl.addEventListener('click', () => pick(cardEl, card.v));
        board.append(cardEl);
      });
    }
    function pick(cardEl, value) {
      if (lock || done || cardEl.classList.contains('is-open')) return;
      sfx('step');
      cardEl.classList.add('is-open');
      if (!started) started = Date.now();
      if (!first) { first = { cardEl, value }; return; }
      moves++; movesEl.set(moves);
      if (first.value === value) {
        first.cardEl.classList.add('is-done');
        cardEl.classList.add('is-done');
        first = null;
        sfx('ok');
        const opened = board.querySelectorAll('.is-done').length;
        if (opened === pairs * 2) finish();
      } else {
        lock = true;
        const a = first.cardEl;
        first = null;
        setTimeout(() => { a.classList.remove('is-open'); cardEl.classList.remove('is-open'); lock = false; sfx('err'); }, 620);
      }
      score(ctx, Math.max(0, 2000 - moves * 25 - elapsed()));
    }
    function elapsed() { return started ? Math.round((Date.now() - started) / 1000) : 0; }
    function fmt(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
    function finish() {
      done = true; sfx('win'); burst(sh.mid, 30);
      const sec = elapsed();
      const value = Math.max(0, 2000 - moves * 25 - sec);
      const rec = setHi('memory', value);
      timeEl.set(fmt(sec));
      best.set(rec ? value : (hi('memory') || '—'));
      sh.overlay({
        emoji: rec ? '🏆' : '🧠', title: rec ? 'Новый рекорд!' : 'Все пары найдены',
        text: 'Ходов: ' + moves + ' · время: ' + fmt(sec) + ' · очки: ' + value,
        actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
      });
    }
    reset();
    timerId = s.interval(() => { if (started && !done) timeEl.set(fmt(elapsed())); }, 1000);
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* ------------------------------ 4. Реакция ------------------------------- */
  function gameReaction(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-reaction');
    const rounds = p.rounds, bubbles = p.mode === 'bubbles';
    const field = el('div', { class: 'g-react' });
    const msg = el('div', { class: 'g-react-msg', text: 'Приготовься…' });
    field.append(msg);
    sh.mid.append(field);
    const roundEl = sh.stat('Раунд', '0/' + rounds);
    const lastEl = sh.stat('Последний', '—');
    const avgEl = sh.stat('Среднее', '—');
    sh.setHint(bubbles ? 'Лопай пузырь, как только он появится.' : 'Нажми в момент, когда поле станет светлым.');
    ctx.api.onScore(0);

    let phase = 'idle';      // idle | waiting | ready | between | done
    let round = 0, times = [], misses = 0, goAt = 0, bubble = null, timer = 0;

    function clearTimer() { if (timer) { clearTimeout(timer); timer = 0; } }
    function say(text, visible) {
      msg.style.display = visible === false ? 'none' : '';
      if (text !== undefined) msg.textContent = text;
    }
    function removeBubble() { if (bubble) { bubble.remove(); bubble = null; } }
    function reset() {
      clearTimer();
      removeBubble();
      phase = 'idle'; round = 0; times = []; misses = 0;
      roundEl.set('0/' + rounds); lastEl.set('—'); avgEl.set('—');
      field.classList.remove('is-go');
      sh.hideOverlay();
      say('Нажми, чтобы начать');
    }
    function nextRound() {
      if (round >= rounds) return finish();
      phase = 'waiting';
      field.classList.remove('is-go');
      say('Ждём…');
      timer = s.timeout(arm, bubbles ? 420 + Math.random() * 700 : 900 + Math.random() * 2600);
    }
    function arm() {
      timer = 0;
      phase = 'ready';
      goAt = performance.now();
      if (bubbles) {
        say('', false);
        const r = field.getBoundingClientRect();
        const size = 54 + Math.random() * 48;
        bubble = el('div', { class: 'g-react-bubble', style: { width: size + 'px', height: size + 'px' } });
        bubble.style.left = (10 + Math.random() * Math.max(4, r.width - size - 20)) + 'px';
        bubble.style.top = (10 + Math.random() * Math.max(4, r.height - size - 20)) + 'px';
        bubble.addEventListener('pointerdown', (e) => { e.stopPropagation(); hit(); });
        field.append(bubble);
        timer = s.timeout(() => miss('Поздно! Пузырь улетел'), 1700);
      } else {
        field.classList.add('is-go');
        say('ЖМИ!');
      }
    }
    function miss(text) {
      if (phase === 'done') return;
      clearTimer();
      removeBubble();
      misses++;
      field.classList.remove('is-go');
      sfx('err');
      phase = 'between';
      say(text || 'Мимо');
      if (round >= rounds) return finish();
      timer = s.timeout(nextRound, 780);
    }
    function hit() {
      if (phase !== 'ready') return;
      clearTimer();
      removeBubble();
      field.classList.remove('is-go');
      const ms = Math.round(performance.now() - goAt);
      times.push(ms);
      round++;
      lastEl.set(ms + ' мс');
      const avg = Math.round(times.reduce((a, v) => a + v, 0) / times.length);
      avgEl.set(avg + ' мс');
      roundEl.set(round + '/' + rounds);
      sfx(ms < 260 ? 'ok' : 'step');
      phase = 'between';
      if (round >= rounds) return finish();
      say('Следующий раунд…');
      timer = s.timeout(nextRound, 680);
    }
    function finish() {
      clearTimer();
      removeBubble();
      phase = 'done';
      field.classList.remove('is-go');
      const avg = times.length ? Math.round(times.reduce((a, v) => a + v, 0) / times.length) : 0;
      const bestT = times.length ? Math.min.apply(null, times) : 0;
      const value = Math.max(0, 2600 - avg * 3 - misses * 60);
      const rec = setHi('reaction', value);
      const grade = !times.length ? 'в этот раз не сложилось'
        : avg < 220 ? 'реакция ящерицы' : avg < 300 ? 'очень быстро' : avg < 400 ? 'хорошо' : 'есть куда расти';
      burst(sh.mid, 22);
      sh.overlay({
        emoji: rec ? '🏆' : '⚡', title: rec ? 'Новый рекорд!' : 'Готово',
        text: 'Среднее: ' + avg + ' мс · лучшее: ' + bestT + ' мс · промахов: ' + misses + ' · ' + grade,
        actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
      });
      score(ctx, value);
      say('Готово — можно ещё раз');
    }
    s.on(field, 'pointerdown', (e) => {
      if (bubble && bubble.contains(e.target)) return;    // по пузырю — свой обработчик
      if (phase === 'idle') { clearTimer(); return nextRound(); }
      if (phase === 'waiting') return miss(bubbles ? 'Рано! Пузырь ещё не вылетел' : 'Рано! Ждём спокойно');
      if (phase === 'ready') return bubbles ? miss('Мимо') : hit();
    });
    reset();
    return { restart: reset };
  }

  /* ----------------------------- 5. Витрина -------------------------------- */
  function gameBreakout(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-breakout');
    const L = stageCanvas(sh.mid, 4, 3);
    const sc = sh.stat('Очки');
    const livesEl = sh.stat('Жизни', p.lives);
    const best = sh.stat('Рекорд', hi('breakout'));
    sh.setHint('Веди платформу мышью или пальцем, отбивай мяч.');
    ctx.api.onScore(0);

    const COLS = 8, BRICK_W = 17, BRICK_H = 6, TOP = 14, PAD_W = 26, PAD_H = 4;
    let ball, bricks, padX, lives, points, over, speed, hitBricks;
    function reset() {
      bricks = [];
      const rows = p.rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) {
        bricks.push({ x: 4 + c * (BRICK_W + 1.45), y: TOP + r * (BRICK_H + 3), r, dead: false });
      }
      padX = L.w / 2; lives = p.lives; points = 0; over = false; hitBricks = [];
      speed = 62 * p.speed;
      ball = { x: L.w / 2, y: L.h - 22, vx: speed * 0.55, vy: -speed, r: 2.1 };
      sc.set(0); livesEl.set(lives); ctx.api.onScore(0); sh.hideOverlay();
    }
    function loss() {
      over = true; sfx('lose');
      sh.overlay({
        emoji: '🧱', title: 'Витрина выстояла',
        text: 'Очки: ' + points + '. Рекорд: ' + hi('breakout') + '.',
        actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
      });
    }
    function win() {
      over = true; sfx('win'); burst(sh.mid, 30);
      const value = points + Math.max(0, lives) * 25;
      const rec = setHi('breakout', value);
      sh.overlay({
        emoji: rec ? '🏆' : '✨', title: rec ? 'Новый рекорд!' : 'Всё стекло разбито',
        text: 'Очки: ' + value + ' (с бонусом за жизни).',
        actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
      });
      score(ctx, value);
    }
    s.on(window, 'keydown', (e) => {
      if (!keyOwner(ctx.root)) return;
      if (e.key === 'ArrowLeft') padX -= 12;
      if (e.key === 'ArrowRight') padX += 12;
      if (e.key === ' ') { e.preventDefault(); if (over) reset(); }
    });
    const toL = pointer(L.canvas, L);
    const move = (e) => { const q = toL(e); padX = q.x; };
    s.on(sh.mid, 'pointermove', move);
    s.on(sh.mid, 'pointerdown', move);
    s.raf((dt) => {
      const c = L.ctx(), pal = palette();
      c.clearRect(0, 0, L.w, L.h);
      if (!over) {
        const scale = dt * 60;
        padX = Math.max(PAD_W / 2 + 1, Math.min(L.w - PAD_W / 2 - 1, padX));
        ball.x += ball.vx * scale; ball.y += ball.vy * scale;
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; sfx('step'); }
        if (ball.x > L.w - ball.r) { ball.x = L.w - ball.r; ball.vx *= -1; sfx('step'); }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; }
        if (ball.y > L.h + 4) {
          lives--; livesEl.set(lives); sfx('err');
          if (lives <= 0) loss();
          else { ball = { x: L.w / 2, y: L.h - 22, vx: speed * 0.5, vy: -speed, r: 2.1 }; padX = L.w / 2; }
        }
        const py = L.h - 10;
        if (ball.vy > 0 && ball.y + ball.r > py && ball.y - ball.r < py + PAD_H &&
          Math.abs(ball.x - padX) < PAD_W / 2 + ball.r && ball.y < py + PAD_H) {
          const k = (ball.x - padX) / (PAD_W / 2);
          const sp = Math.min(1.9, Math.hypot(ball.vx, ball.vy) / speed + 0.012);
          const ang = k * 1.05;
          ball.vx = Math.sin(ang) * speed * sp;
          ball.vy = -Math.abs(Math.cos(ang) * speed * sp) - 8;
          ball.y = py - ball.r;
          sfx('click');
        }
        for (const b of bricks) {
          if (b.dead) continue;
          if (ball.x > b.x - ball.r && ball.x < b.x + BRICK_W + ball.r &&
            ball.y > b.y - ball.r && ball.y < b.y + BRICK_H + ball.r) {
            b.dead = true; points += 10; sc.set(points); score(ctx, points);
            best.set(hi('breakout'));
            hitBricks.push({ x: b.x + BRICK_W / 2, y: b.y + BRICK_H / 2, t: 1 });
            sfx('pop');
            const fromSide = Math.abs(ball.x - (b.x + BRICK_W / 2)) > BRICK_W / 2;
            if (fromSide) ball.vx *= -1; else ball.vy *= -1;
            break;
          }
        }
        if (!bricks.some((b) => !b.dead)) win();
      }
      // отрисовка
      for (const b of bricks) {
        if (b.dead) continue;
        const g = c.createLinearGradient(b.x, b.y, b.x + BRICK_W, b.y + BRICK_H);
        g.addColorStop(0, pal.accent);
        g.addColorStop(1, pal.accent2);
        c.globalAlpha = 0.9;
        c.fillStyle = g;
        roundRect(c, b.x, b.y, BRICK_W, BRICK_H, 1.6); c.fill();
      }
      c.globalAlpha = 1;
      for (let i = hitBricks.length - 1; i >= 0; i--) {
        const hb = hitBricks[i]; hb.t -= dt * 2.4;
        if (hb.t <= 0) { hitBricks.splice(i, 1); continue; }
        c.globalAlpha = hb.t * 0.8;
        c.strokeStyle = pal.accent2; c.lineWidth = 1.2;
        c.beginPath(); c.arc(hb.x, hb.y, (1 - hb.t) * 9 + 1, 0, 6.2832); c.stroke();
      }
      c.globalAlpha = 1;
      const g2 = c.createLinearGradient(padX - PAD_W / 2, 0, padX + PAD_W / 2, 0);
      g2.addColorStop(0, pal.accent); g2.addColorStop(1, pal.accent2);
      c.fillStyle = g2;
      roundRect(c, padX - PAD_W / 2, L.h - 10, PAD_W, PAD_H, PAD_H / 2); c.fill();
      const bg = c.createRadialGradient(ball.x - ball.r * 0.4, ball.y - ball.r * 0.4, ball.r * 0.1, ball.x, ball.y, ball.r * 1.7);
      bg.addColorStop(0, 'rgba(255,255,255,.98)');
      bg.addColorStop(0.6, pal.accent2);
      bg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = bg;
      c.beginPath(); c.arc(ball.x, ball.y, ball.r * 1.6, 0, 6.2832); c.fill();
    });
    reset();
    s.observe(sh.mid, () => L.fit());
    s.on(window, 'resize', () => L.fit());
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* ------------------------------ 6. Пузырь -------------------------------- */
  function gameFlappy(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-flappy');
    const L = stageCanvas(sh.mid, 2, 3);
    const sc = sh.stat('Очки');
    const best = sh.stat('Рекорд', hi('flappy'));
    sh.setHint('Клик, пробел или тап — пузырь подпрыгивает.');
    ctx.api.onScore(0);

    const GAP = p.gap * 11, PIPE_W = 16, SPEED = p.speed * 34, G = 200, FLAP = -58;
    let y, vy, pipes, points, over, started, passed;
    function reset() {
      y = L.h * 0.42; vy = 0; pipes = []; points = 0; over = false; started = false; passed = 0;
      sc.set(0); ctx.api.onScore(0); sh.hideOverlay();
      for (let i = 0; i < 3; i++) pipes.push({ x: L.w + 24 + i * 62, top: 18 + Math.random() * (L.h - GAP - 46) });
    }
    function flap() {
      if (over) { reset(); return; }
      started = true;
      vy = FLAP;
      sfx('pop');
    }
    function die() {
      over = true; sfx('lose');
      const rec = setHi('flappy', points);
      sh.overlay({
        emoji: rec ? '🏆' : '🫧', title: rec ? 'Новый рекорд!' : 'Пузырь лопнул',
        text: 'Очков: ' + points + ' · рекорд: ' + hi('flappy'),
        actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
      });
    }
    s.on(sh.mid, 'pointerdown', flap);
    s.on(window, 'keydown', (e) => {
      if (!keyOwner(ctx.root)) return;
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); }
    });
    s.on(L.canvas, 'pointerdown', flap);
    s.raf((dt) => {
      const c = L.ctx(), pal = palette();
      c.clearRect(0, 0, L.w, L.h);
      const scale = dt;
      if (!over) {
        if (started) { vy += G * scale; y += vy * scale; }
        for (const pipe of pipes) {
          if (started) pipe.x -= SPEED * scale;
          if (pipe.x < -PIPE_W) {
            pipe.x += 3 * 62;
            pipe.top = 16 + Math.random() * (L.h - GAP - 44);
            pipe.scored = false;
          }
          if (!pipe.scored && started && pipe.x + PIPE_W < L.w * 0.28) {
            pipe.scored = true; points++; passed++;
            sc.set(points); sfx('ok'); score(ctx, points);
            best.set(hi('flappy'));
          }
          // столкновения
          const bx = L.w * 0.28, br = 4.2;
          if (bx + br > pipe.x && bx - br < pipe.x + PIPE_W) {
            if (y - br < pipe.top || y + br > pipe.top + GAP) die();
          }
        }
        if (y > L.h - 5 || y < 4) { y = Math.max(4, Math.min(L.h - 5, y)); die(); }
      }
      // трубы
      for (const pipe of pipes) {
        const g = c.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
        g.addColorStop(0, 'rgba(255,255,255,.22)');
        g.addColorStop(0.5, pal.accent);
        g.addColorStop(1, 'rgba(255,255,255,.12)');
        c.globalAlpha = 0.82;
        c.fillStyle = g;
        roundRect(c, pipe.x, -6, PIPE_W, pipe.top + 6, 5); c.fill();
        roundRect(c, pipe.x, pipe.top + GAP, PIPE_W, L.h - pipe.top - GAP + 6, 5); c.fill();
        c.globalAlpha = 1;
        c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 0.8;
        roundRect(c, pipe.x, -6, PIPE_W, pipe.top + 6, 5); c.stroke();
        roundRect(c, pipe.x, pipe.top + GAP, PIPE_W, L.h - pipe.top - GAP + 6, 5); c.stroke();
      }
      // пузырь-птица
      const bx = L.w * 0.28, br = 4.2;
      const bg = c.createRadialGradient(bx - br * 0.4, y - br * 0.5, br * 0.15, bx, y, br * 1.9);
      bg.addColorStop(0, 'rgba(255,255,255,.98)');
      bg.addColorStop(0.45, pal.accent2);
      bg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = bg;
      c.beginPath(); c.arc(bx, y, br * 1.75, 0, 6.2832); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1;
      c.beginPath(); c.arc(bx, y, br, 0, 6.2832); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.arc(bx - br * 0.4, y - br * 0.45, br * 0.32, 0, 6.2832); c.fill();
      if (!started) {
        c.fillStyle = pal.ink;
        c.font = '600 7px -apple-system, system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText('тап, чтобы взлететь', L.w / 2, L.h / 2 + 24);
      }
    });
    reset();
    s.observe(sh.mid, () => L.fit());
    s.on(window, 'resize', () => L.fit());
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* -------------------------------- 7. Эхо --------------------------------- */
  function gameSimon(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-simon');
    const TONES = p.mood ? [262, 294, 330, 392] : [262, 330, 392, 523];
    const board = el('div', { class: 'g-simon-board' });
    const pads = [];
    ['', '', '', ''].forEach((_, i) => {
      const pad = el('button', { class: 'g-simon-pad p' + i, type: 'button', 'aria-label': 'пад ' + (i + 1) });
      pad.addEventListener('click', () => userTap(i));
      board.append(pad); pads.push(pad);
    });
    sh.mid.append(board);
    const round = sh.stat('Раунд', '0');
    const best = sh.stat('Рекорд', hi('simon'));
    sh.setHint('Смотри и повторяй последовательность на стеклянных падах.');
    ctx.api.onScore(0);

    let seq, input, playing, current = 0;
    function reset() {
      seq = []; input = 0; playing = false;
      pads.forEach((p) => p.classList.remove('is-lit'));
      round.set(0); ctx.api.onScore(0); sh.hideOverlay();
      next();
    }
    function lit(i, ms) {
      const pad = pads[i];
      pad.classList.add('is-lit');
      tone(TONES[i], Math.min(0.5, (ms || 360) / 1000 * 0.8), 'sine', 0.16);
      s.timeout(() => pad.classList.remove('is-lit'), (ms || 360) * 0.62);
    }
    function playSeq() {
      playing = true;
      input = 0;
      const tempo = Math.max(280, p.tempo - seq.length * 22);
      seq.forEach((v, i) => s.timeout(() => lit(v, tempo * 0.7), i * tempo + 320));
      s.timeout(() => { playing = false; }, seq.length * tempo + 380);
      round.set(String(seq.length));
    }
    function next() {
      seq.push((Math.random() * 4) | 0);
      playSeq();
    }
    function userTap(i) {
      if (playing || !seq.length) return;
      lit(i, 260);
      if (seq[input] !== i) {
        sfx('err');
        const value = (seq.length - 1) * 10;
        const rec = setHi('simon', value);
        playing = true;
        sh.overlay({
          emoji: rec ? '🏆' : '🎵', title: rec ? 'Новый рекорд!' : 'Мелодия оборвалась',
          text: 'Повторено шагов: ' + (seq.length - 1) + ' · очки: ' + value,
          actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
        });
        score(ctx, value);
        best.set(hi('simon'));
        return;
      }
      input++;
      if (input >= seq.length) {
        sfx('ok');
        if (seq.length >= p.rounds) {
          const value = seq.length * 10 + 50;
          const rec = setHi('simon', value);
          burst(sh.mid, 24);
          score(ctx, value);
          best.set(hi('simon'));
          sh.overlay({
            emoji: '🏆', title: 'Все ' + p.rounds + ' раундов пройдены',
            text: (rec ? 'Новый рекорд: ' : 'Итог: ') + value + ' очков',
            actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
          });
          playing = true;
          return;
        }
        s.timeout(next, 620);
      }
    }
    reset();
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* --------------------------- 8. Крестики-нолики -------------------------- */
  function gameTicTacToe(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-ttt');
    const diff = p.difficulty;
    const board = el('div', { class: 'g-ttt-board' });
    sh.mid.append(board);
    const scoreEl = sh.stat('Счёт', '0 : 0');
    sh.setHint(diff === 'easy' ? 'Спокойный соперник.' : diff === 'hard' ? 'ИИ не ошибается. Удачи!' : 'Соперник иногда зевает.');
    ctx.api.onScore(0);

    let cells, over, turn, wins = 0, losses = 0, draws = 0;
    function reset() {
      cells = new Array(9).fill('');
      over = false; turn = 'X';
      clear(board);
      for (let i = 0; i < 9; i++) {
        const b = el('button', { class: 'g-ttt-cell', type: 'button', 'data-i': i });
        b.addEventListener('click', () => human(i));
        board.append(b);
      }
      sh.hideOverlay();
      scoreEl.set(wins + ' : ' + losses);
    }
    function paint() {
      const btns = board.children;
      for (let i = 0; i < 9; i++) {
        const v = cells[i];
        btns[i].textContent = v === 'X' ? '✕' : v === 'O' ? '◯' : '';
        btns[i].classList.toggle('is-x', v === 'X');
        btns[i].classList.toggle('is-o', v === 'O');
      }
    }
    function winner(g) {
      const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      for (const L of lines) {
        const [a, b, c] = L;
        if (g[a] && g[a] === g[b] && g[a] === g[c]) return g[a];
      }
      return g.every((v) => v) ? 'draw' : '';
    }
    function minimax(g, me, depth) {
      const w = winner(g);
      if (w === 'O') return { score: 10 - depth };
      if (w === 'X') return { score: depth - 10 };
      if (w === 'draw') return { score: 0 };
      const moves = [];
      for (let i = 0; i < 9; i++) {
        if (g[i]) continue;
        g[i] = me;
        const r = minimax(g, me === 'O' ? 'X' : 'O', depth + 1);
        g[i] = '';
        moves.push({ i, score: r.score });
      }
      moves.sort((a, b) => me === 'O' ? b.score - a.score : a.score - b.score);
      return moves[0] || { score: 0 };
    }
    function ai() {
      const free = cells.map((v, i) => v ? -1 : i).filter((i) => i >= 0);
      if (!free.length) return;
      let choice;
      const smart = diff === 'hard' ? 1 : diff === 'normal' ? 0.72 : 0.22;
      if (Math.random() < smart) choice = minimax(cells.slice(), 'O', 0).i;
      if (choice === undefined || choice === null || cells[choice]) choice = free[(Math.random() * free.length) | 0];
      cells[choice] = 'O';
      paint();
      sfx('step');
      check();
    }
    function check() {
      const w = winner(cells);
      if (!w) return;
      over = true;
      if (w === 'X') { wins++; sfx('win'); burst(sh.mid, 18); }
      else if (w === 'O') { losses++; sfx('lose'); }
      else { draws++; sfx('ok'); }
      scoreEl.set(wins + ' : ' + losses);
      const value = wins * 100 - losses * 30 + draws * 10;
      score(ctx, Math.max(0, value));
      sh.overlay({
        emoji: w === 'X' ? '🎉' : w === 'O' ? '🤖' : '🤝',
        title: w === 'X' ? 'Ты выиграл!' : w === 'O' ? 'ИИ выиграл' : 'Ничья',
        text: 'Счёт ' + wins + ' : ' + losses + ' · ничьих: ' + draws,
        actions: [{ label: 'Следующая партия', primary: true, fn: reset }]
      });
    }
    function human(i) {
      if (over || cells[i]) return;
      cells[i] = 'X';
      paint();
      sfx('click');
      check();
      if (over) return;
      s.timeout(ai, 320);
    }
    reset();
    sh.btn('Новая партия', reset);
    return { restart: reset };
  }

  /* -------------------------------- 9. Мины -------------------------------- */
  function gameMines(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-mines');
    const W = p.w, H = p.h, MINES = Math.min(p.mines, W * H - 9);
    const board = el('div', { class: 'g-mines-board', style: { gridTemplateColumns: 'repeat(' + W + ', 1fr)' } });
    sh.mid.append(board);
    const leftEl = sh.stat('Мин', MINES);
    const timeEl = sh.stat('Время', '0:00');
    const best = sh.stat('Рекорд', hi('mines') || '—');
    sh.setHint('Левый клик — открыть, правый (или долгий тап) — флажок.');
    ctx.api.onScore(0);

    let cells, over, started, flags, opened, timerId;
    function reset() {
      cells = [];
      over = false; started = 0; flags = 0; opened = 0;
      leftEl.set(MINES); timeEl.set('0:00');
      clear(board);
      for (let i = 0; i < W * H; i++) {
        const b = el('button', { class: 'g-mines-cell', type: 'button' });
        b.addEventListener('click', () => open(i));
        b.addEventListener('contextmenu', (e) => { e.preventDefault(); flag(i); });
        let hold = 0;
        b.addEventListener('pointerdown', () => { hold = setTimeout(() => flag(i), 420); });
        b.addEventListener('pointerup', () => clearTimeout(hold));
        b.addEventListener('pointerleave', () => clearTimeout(hold));
        board.append(b);
        cells.push({ mine: false, near: 0, open: false, flag: false, el: b });
      }
      sh.hideOverlay();
    }
    function idx(x, y) { return y * W + x; }
    function plant(safe) {
      let placed = 0;
      while (placed < MINES) {
        const i = (Math.random() * W * H) | 0;
        const x = i % W, y = (i / W) | 0;
        if (cells[i].mine) continue;
        if (Math.abs(x - (safe % W)) <= 1 && Math.abs(y - ((safe / W) | 0)) <= 1) continue;
        cells[i].mine = true; placed++;
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (cells[idx(nx, ny)].mine) n++;
        }
        cells[idx(x, y)].near = n;
      }
    }
    function flag(i) {
      const c = cells[i];
      if (over || c.open) return;
      c.flag = !c.flag;
      flags += c.flag ? 1 : -1;
      leftEl.set(MINES - flags);
      c.el.textContent = c.flag ? '🚩' : '';
      c.el.classList.toggle('is-flag', c.flag);
      sfx('click');
    }
    function open(i) {
      if (over) return;
      const c = cells[i];
      if (c.flag || c.open) return;
      if (!started) { started = Date.now(); plant(i); }
      if (c.mine) return boom(i);
      reveal(i, true);
      sfx('step');
      if (opened >= W * H - MINES) won();
    }
    function reveal(i, first) {
      const c = cells[i];
      if (c.open || c.flag || c.mine) return;
      c.open = true; opened++;
      c.el.classList.add('is-open');
      c.el.textContent = c.near ? String(c.near) : '';
      c.el.setAttribute('data-n', c.near);
      if (!c.near) {
        const x = i % W, y = (i / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          reveal(idx(nx, ny), false);
        }
      }
    }
    function elapsedSec() { return started ? Math.round((Date.now() - started) / 1000) : 0; }
    function fmt(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
    function boom(i) {
      over = true; sfx('lose');
      cells[i].el.classList.add('is-boom');
      cells.forEach((c) => { if (c.mine) { c.el.classList.add('is-open'); c.el.textContent = '💥'; } });
      sh.overlay({
        emoji: '💣', title: 'Бах!',
        text: 'Открыто клеток: ' + opened + ' · время: ' + fmt(elapsedSec()),
        actions: [{ label: 'Заново', primary: true, fn: reset }]
      });
    }
    function won() {
      over = true; sfx('win'); burst(sh.mid, 28);
      const sec = elapsedSec();
      const value = Math.max(0, 1000 - sec * 6);
      const rec = setHi('mines', value);
      best.set(hi('mines'));
      timeEl.set(fmt(sec));
      sh.overlay({
        emoji: rec ? '🏆' : '🎉', title: rec ? 'Новый рекорд!' : 'Поле очищено',
        text: 'За ' + fmt(sec) + ' · очки: ' + value,
        actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
      });
      score(ctx, value);
    }
    reset();
    timerId = s.interval(() => { if (started && !over) timeEl.set(fmt(elapsedSec())); }, 1000);
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* ------------------------------- 10. Башня ------------------------------- */
  function gameStack(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-stack');
    const L = stageCanvas(sh.mid, 2, 3);
    const sc = sh.stat('Блоков');
    const best = sh.stat('Рекорд', hi('stack'));
    sh.setHint('Нажми, чтобы уронить блок точно на предыдущий.');
    ctx.api.onScore(0);

    let blocks, moving, dir, over, shift, camera, placed;
    function reset() {
      blocks = [{ x: (L.w - 62) / 2, w: 62, y: L.h - 26, tone: 0 }];
      over = false; shift = 0; camera = 0; placed = 0;
      spawnMoving();
      sc.set(0); ctx.api.onScore(0); sh.hideOverlay();
    }
    function spawnMoving() {
      const prev = blocks[blocks.length - 1];
      moving = { x: 2, w: Math.max(10, prev.w), y: prev.y - 9, tone: blocks.length % 6 };
      dir = 1;
    }
    function drop() {
      if (over) return;
      const prev = blocks[blocks.length - 1];
      const left = Math.max(moving.x, prev.x);
      const right = Math.min(moving.x + moving.w, prev.x + prev.w);
      const overlap = right - left;
      if (overlap <= 2.5) {
        over = true; sfx('lose');
        const rec = setHi('stack', placed);
        sh.overlay({
          emoji: rec ? '🏆' : '🏗️', title: rec ? 'Новый рекорд!' : 'Башня наклонилась',
          text: 'Блоков в башне: ' + placed + ' · рекорд: ' + hi('stack'),
          actions: [{ label: 'Собрать заново', primary: true, fn: reset }]
        });
        score(ctx, placed);
        best.set(hi('stack'));
        return;
      }
      const perfect = Math.abs(moving.x - prev.x) < 1.6;
      blocks.push({ x: left, w: overlap, y: moving.y, tone: moving.tone });
      placed++;
      sc.set(placed);
      score(ctx, placed);
      best.set(hi('stack'));
      if (perfect) { sfx('ok'); burst(sh.mid, 6); } else sfx('click');
      // поднимаем башню, если верхушка уползла вверх
      if (moving.y < L.h * 0.34) {
        const dv = L.h * 0.34 - moving.y;
        blocks.forEach((b) => b.y += dv);
      }
      spawnMoving();
    }
    s.on(sh.mid, 'pointerdown', drop);
    s.on(window, 'keydown', (e) => {
      if (!keyOwner(ctx.root)) return;
      if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); drop(); }
    });
    s.raf((dt) => {
      const c = L.ctx(), pal = palette();
      c.clearRect(0, 0, L.w, L.h);
      if (!over) {
        const speed = 30 * p.speed;
        moving.x += dir * speed * dt * 1.6;
        if (moving.x < 1) { moving.x = 1; dir = 1; }
        if (moving.x + moving.w > L.w - 1) { moving.x = L.w - 1 - moving.w; dir = -1; }
      }
      const tones = [pal.accent, pal.accent2, 'rgba(255,255,255,.75)', pal.accent, pal.accent2, 'rgba(255,255,255,.6)'];
      blocks.forEach((b, i) => {
        const g = c.createLinearGradient(b.x, 0, b.x + b.w, 0);
        g.addColorStop(0, 'rgba(255,255,255,.5)');
        g.addColorStop(1, tones[b.tone % tones.length]);
        c.fillStyle = g;
        c.globalAlpha = 0.92;
        roundRect(c, b.x, b.y, b.w, 8, 3.4); c.fill();
      });
      c.globalAlpha = 1;
      if (!over && moving) {
        const g = c.createLinearGradient(moving.x, 0, moving.x + moving.w, 0);
        g.addColorStop(0, tones[moving.tone % tones.length]);
        g.addColorStop(1, 'rgba(255,255,255,.92)');
        c.fillStyle = g;
        roundRect(c, moving.x, moving.y, moving.w, 8, 3.4); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.7;
        roundRect(c, moving.x, moving.y, moving.w, 8, 3.4); c.stroke();
      }
      c.strokeStyle = 'rgba(255,255,255,.25)';
      c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(0, L.h - 18); c.lineTo(L.w, L.h - 18); c.stroke();
    });
    reset();
    s.observe(sh.mid, () => L.fit());
    s.on(window, 'resize', () => L.fit());
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* -------------------------------- 11. Тир -------------------------------- */
  function gameAim(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-aim');
    const field = el('div', { class: 'g-aim' });
    sh.mid.append(field);
    const scoreEl = sh.stat('Очки');
    const accEl = sh.stat('Точность', '—');
    const best = sh.stat('Рекорд', hi('aim'));
    sh.setHint('Кликай по целям ' + p.seconds + ' секунд. Промах по полю — минус очко.');
    ctx.api.onScore(0);

    let points, hits, misses, timeLeft, running, target, timerId, spawnId;
    function reset() {
      clear(field);
      field.classList.remove('is-over');
      points = 0; hits = 0; misses = 0; timeLeft = p.seconds; running = true;
      scoreEl.set(0); accEl.set('—'); ctx.api.onScore(0);
      sh.hideOverlay();
      spawn();
      clearInterval(timerId); clearInterval(spawnId);
      timerId = s.interval(() => {
        if (!running) return;
        timeLeft--;
        if (timeLeft <= 0) finish();
      }, 1000);
      spawnId = s.interval(() => { if (running && target) mover(); }, 1100);
      sh.hint.textContent = 'Кликай по целям · осталось ' + p.seconds + ' с · промах по полю — минус очко';
    }
    function spawn() {
      if (target) target.remove();
      const size = p.size;
      const r = field.getBoundingClientRect();
      const maxX = Math.max(4, r.width - size - 8), maxY = Math.max(4, r.height - size - 8);
      target = el('button', { class: 'g-aim-target', type: 'button' });
      target.style.width = size + 'px';
      target.style.height = size + 'px';
      target.style.left = (4 + Math.random() * maxX) + 'px';
      target.style.top = (4 + Math.random() * maxY) + 'px';
      target.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (!running) return;
        hits++;
        points += 12;
        scoreEl.set(points);
        score(ctx, points);
        best.set(hi('aim'));
        sfx('pop');
        burst(field, 6);
        spawn();
      });
      field.append(target);
    }
    function mover() {
      if (!target) return;
      const r = field.getBoundingClientRect();
      const maxX = Math.max(4, r.width - p.size - 8), maxY = Math.max(4, r.height - p.size - 8);
      target.style.transition = 'left .9s cubic-bezier(.22,1,.36,1), top .9s cubic-bezier(.22,1,.36,1)';
      target.style.left = (4 + Math.random() * maxX) + 'px';
      target.style.top = (4 + Math.random() * maxY) + 'px';
    }
    function finish() {
      running = false;
      clearInterval(timerId); clearInterval(spawnId);
      if (target) target.remove();
      const shots = hits + misses;
      const acc = shots ? Math.round(hits / shots * 100) : 0;
      const value = points + acc;
      const rec = setHi('aim', value);
      accEl.set(acc + '%');
      burst(field, 22);
      sh.overlay({
        emoji: rec ? '🏆' : '🎯', title: rec ? 'Новый рекорд!' : 'Время вышло',
        text: 'Попаданий: ' + hits + ' · промахов: ' + misses + ' · точность: ' + acc + '% · итог: ' + value,
        actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
      });
      score(ctx, value);
    }
    field.addEventListener('pointerdown', () => {
      if (!running) return;
      misses++;
      points = Math.max(0, points - 1);
      scoreEl.set(points);
      sfx('err');
    });
    reset();
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* ----------------------------- 12. Струп-тест ---------------------------- */
  function gameStroop(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-stroop');
    const word = el('div', { class: 'g-stroop-word', text: '…' });
    const options = el('div', { class: 'g-stroop-options' });
    sh.mid.append(el('div', { class: 'g-stroop' }, [word, options]));
    const scoreEl = sh.stat('Очки');
    const streakEl = sh.stat('Серия');
    const timeEl = sh.stat('Время', p.seconds + 'с');
    const best = sh.stat('Рекорд', hi('stroop'));
    sh.setHint('Выбирай ЦВЕТ ЧЕРНИЛ, а не то, что написано.');
    ctx.api.onScore(0);

    let ask, points, streak, left, running, timerId;
    function reset() {
      points = 0; streak = 0; left = p.seconds; running = true;
      scoreEl.set(0); streakEl.set(0); timeEl.set(left + 'с'); ctx.api.onScore(0);
      sh.hideOverlay();
      clearInterval(timerId);
      timerId = s.interval(() => {
        if (!running) return;
        left--;
        timeEl.set(Math.max(0, left) + 'с');
        if (left <= 0) finish();
      }, 1000);
      next();
    }
    function next() {
      const ink = STROOP[(Math.random() * STROOP.length) | 0];
      let label = ink;
      const words = STROOP.filter((w) => w !== ink);
      if (Math.random() > 0.18) label = words[(Math.random() * words.length) | 0];
      ask = ink;
      word.textContent = label.name;
      word.style.color = ink.hex;
      word.classList.remove('pop');
      requestAnimationFrame(() => word.classList.add('pop'));
      const opts = STROOP.slice().sort(() => Math.random() - 0.5).slice(0, 4);
      if (!opts.includes(ink)) opts[0] = ink;
      clear(options);
      opts.sort(() => Math.random() - 0.5).forEach((c) => {
        const b = el('button', { class: 'g-btn', type: 'button', text: c.name });
        b.addEventListener('click', () => {
          if (!running) return;
          if (c === ask) {
            streak++;
            points += 10 + streak * 2;
            sfx('ok');
            streakEl.set(streak);
            scoreEl.set(points);
            score(ctx, points);
            best.set(hi('stroop'));
            next();
          } else {
            points = Math.max(0, points - 5);
            streak = 0;
            streakEl.set(0);
            scoreEl.set(points);
            sfx('err');
            word.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 240 });
          }
        });
        options.append(b);
      });
    }
    function finish() {
      running = false;
      clearInterval(timerId);
      const rec = setHi('stroop', points);
      sh.overlay({
        emoji: rec ? '🏆' : '🌈', title: rec ? 'Новый рекорд!' : 'Время вышло',
        text: 'Очки: ' + points + ' · лучшая серия: ' + streak,
        actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
      });
    }
    reset();
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* --------------------------- 13. Скорость печати ------------------------- */
  function gameTyping(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-typing');
    const pool = TEXTS[p.layout] || TEXTS.ru;
    const display = el('div', { class: 'g-typing-text' });
    const input = el('textarea', { class: 'g-typing-input', rows: '2', placeholder: 'Печатай здесь…', spellcheck: 'false', autocomplete: 'off' });
    sh.mid.append(el('div', { class: 'g-typing' }, [display, input]));
    const wpmEl = sh.stat('Скорость', '0 зн/мин');
    const accEl = sh.stat('Точность', '100%');
    const best = sh.stat('Рекорд', hi('typing'));
    sh.setHint('Печатай текст. Ошибки подсветятся красным.');
    ctx.api.onScore(0);

    let target, started, finished, chars = [], typed = 0, errors = 0;
    function reset() {
      target = pool[(Math.random() * pool.length) | 0];
      started = 0; finished = false; typed = 0; errors = 0;
      input.value = '';
      input.disabled = false;
      clear(display);
      for (const ch of target) {
        const span = el('span', { class: 'ch', text: ch === ' ' ? '\u00a0' : ch });
        display.append(span);
        chars.push(span);
      }
      chars = Array.from(display.children);
      chars[0].classList.add('cur');
      wpmEl.set('0 зн/мин'); accEl.set('100%');
      sh.hideOverlay();
      ctx.api.onScore(0);
    }
    function update() {
      const v = input.value;
      if (!started && v.length) started = Date.now();
      typed = v.length;
      errors = 0;
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        c.classList.remove('ok', 'bad', 'cur');
        if (i < v.length) {
          if (v[i] === target[i]) c.classList.add('ok');
          else { c.classList.add('bad'); errors++; }
        } else if (i === v.length) c.classList.add('cur');
      }
      const sec = started ? (Date.now() - started) / 1000 : 0;
      const correct = Math.max(0, typed - errors);
      const speed = sec > 0.4 ? Math.round(correct / sec * 60) : 0;
      const acc = typed ? Math.round(correct / typed * 100) : 100;
      wpmEl.set(speed + ' зн/мин');
      accEl.set(acc + '%');
      if (v.length >= target.length && v === target) finish(correct, acc, sec);
      else score(ctx, speed);
    }
    function finish(correct, acc, sec) {
      if (finished) return;
      finished = true;
      input.disabled = true;
      const speed = Math.round(correct / Math.max(1, sec) * 60);
      const value = Math.round(speed * (acc / 100));
      const rec = setHi('typing', value);
      best.set(hi('typing'));
      burst(sh.mid, 22); sfx(rec ? 'win' : 'ok');
      sh.overlay({
        emoji: rec ? '🏆' : '⌨️', title: rec ? 'Новый рекорд!' : 'Текст напечатан',
        text: 'Скорость: ' + speed + ' зн/мин · точность: ' + acc + '% · время: ' + sec.toFixed(1) + ' с',
        actions: [
          { label: 'Ещё текст', primary: true, fn: reset },
          { label: 'Этот же', fn: () => { const t = target; reset(); target = t; } }
        ]
      });
      score(ctx, value);
    }
    input.addEventListener('input', update);
    s.on(sh.mid, 'pointerdown', () => { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } });
    reset();
    sh.btn('Другой текст', reset);
    return { restart: reset };
  }

  /* -------------------------------- 14. Огни ------------------------------- */
  function gameLights(ctx) {
    const p = ctx.params, s = ctx.s, sh = ctx.shell('g-lights');
    const N = p.size;
    const board = el('div', { class: 'g-lights-board', style: { gridTemplateColumns: 'repeat(' + N + ', 1fr)' } });
    sh.mid.append(board);
    const movesEl = sh.stat('Ходы');
    const best = sh.stat('Рекорд', hi('lightsout') || '—');
    sh.setHint('Каждое нажатие переворачивает крест. Погаси все огни.');
    ctx.api.onScore(0);

    let grid, moves, over, btns = [];
    function reset() {
      grid = new Array(N * N).fill(0);
      moves = 0; over = false;
      movesEl.set(0);
      clear(board);
      btns = [];
      for (let i = 0; i < N * N; i++) {
        const b = el('button', { class: 'g-lights-cell', type: 'button' });
        b.addEventListener('click', () => touch(i));
        board.append(b);
        btns.push(b);
      }
      // перемешиваем гарантированно решаемым способом
      let presses = 0;
      while (presses < N * 2 + 3) {
        const i = (Math.random() * N * N) | 0;
        apply(i);
        presses++;
      }
      if (!grid.some((v) => v)) apply(0);
      paint();
      sh.hideOverlay();
    }
    function apply(i) {
      const x = i % N, y = (i / N) | 0;
      const flip = (xx, yy) => { if (xx >= 0 && yy >= 0 && xx < N && yy < N) grid[yy * N + xx] ^= 1; };
      flip(x, y); flip(x - 1, y); flip(x + 1, y); flip(x, y - 1); flip(x, y + 1);
    }
    function paint() {
      btns.forEach((b, i) => b.classList.toggle('is-on', !!grid[i]));
    }
    function touch(i) {
      if (over) return;
      apply(i);
      moves++;
      movesEl.set(moves);
      sfx('step');
      paint();
      if (!grid.some((v) => v)) {
        over = true;
        const value = Math.max(0, 600 - moves * 12);
        const rec = setHi('lightsout', value);
        best.set(hi('lightsout'));
        sfx('win'); burst(sh.mid, 24);
        sh.overlay({
          emoji: rec ? '🏆' : '💡', title: rec ? 'Новый рекорд!' : 'Все огни погасли',
          text: 'Ходов: ' + moves + ' · очки: ' + value,
          actions: [{ label: 'Ещё раз', primary: true, fn: reset }]
        });
        score(ctx, value);
      }
    }
    reset();
    sh.btn('Заново', reset);
    return { restart: reset };
  }

  /* =============================== диспетчер =============================== */

  const IMPL = {
    snake: gameSnake, n2048: game2048, memory: gameMemory, reaction: gameReaction,
    breakout: gameBreakout, flappy: gameFlappy, simon: gameSimon, tictactoe: gameTicTacToe,
    mines: gameMines, stack: gameStack, aim: gameAim, stroop: gameStroop,
    typing: gameTyping, lightsout: gameLights
  };

  /**
   * Монтирует игру в контейнер.
   * @returns {{restart:Function, destroy:Function}}
   */
  function mount(item, root, api) {
    const s = scope();
    /* параметры всегда прогоняем через нормализатор: модель могла их не дать */
    let params = item && item.params ? item.params : {};
    try {
      if (APP.SPEC && APP.SPEC.normGameParams) params = APP.SPEC.normGameParams(item.game, params);
    } catch (e) { }
    const ctx = {
      item, params, root, api: api || {},
      s,
      shell: (extra) => shell(root, extra)
    };
    let inst = null;
    try {
      const impl = IMPL[item.game] || IMPL.snake;
      s.on(root, 'pointerdown', () => markKeyActive(root), true);
      inst = impl(ctx) || {};
    } catch (e) {
      if (window.console && console.warn) console.warn('game failed', item.game, e);
      inst = {
        restart() { },
        destroy() {
          clear(root);
          root.append(el('div', { class: 'g-fail', text: 'Эта игра не завелась. Нажми «Собрать заново».' }));
        }
      };
    }
    return {
      restart() { try { inst.restart && inst.restart(); } catch (e) { } },
      destroy() { try { s.dispose(); inst.destroy && inst.destroy(); } catch (e) { } clear(root); }
    };
  }

  APP.KIT = { el, clear, scope, sfx, tone, burst, toast, hi, setHi, swipe, roundRect, palette, pointer, stageCanvas, readStore, writeStore };
  APP.GAMES = { mount, IMPL };
})(typeof window !== 'undefined' ? window : globalThis);
