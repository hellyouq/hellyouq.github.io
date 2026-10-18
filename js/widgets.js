/* ============================================================================
 *  widgets.js — неигровые активности: рисование, задания, «новости», факты,
 *  цитаты, дыхание, помодоро, колесо, пианино, питомец-блоб, прогресс
 *  и песочница для мини-игры, которую придумал Gemini.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const APP = (global.APP = global.APP || {});
  const K = () => APP.KIT;

  /* -------------------------- рисование ----------------------------------- */
  function widgetCanvas(sec, root, api) {
    const kit = K();
    const colors = sec.palette.slice();
    const wrap = kit.el('div', { class: 'w-draw' });
    const bar = kit.el('div', { class: 'w-draw-bar' });
    const stage = kit.el('div', { class: 'w-draw-stage' });
    const canvas = kit.el('canvas', { class: 'w-draw-canvas' });
    stage.append(canvas);
    wrap.append(bar, stage);

    const tools = { color: colors[0], size: 10, mode: 'brush', glow: true };
    const strokes = [];
    let current = null;
    let swatchEls = [];

    colors.forEach((c, i) => {
      const sw = kit.el('button', { class: 'w-swatch' + (i === 0 ? ' is-active' : ''), type: 'button', 'aria-label': 'цвет ' + c });
      sw.style.background = c;
      sw.addEventListener('click', () => {
        tools.color = c; tools.mode = 'brush';
        swatchEls.forEach((s) => s.classList.toggle('is-active', s === sw));
        eraser.classList.remove('is-active');
        kit.sfx('click');
      });
      swatchEls.push(sw);
      bar.append(sw);
    });

    const eraser = kit.el('button', { class: 'w-tool', type: 'button', text: 'Ластик' });
    const glow = kit.el('button', { class: 'w-tool is-active', type: 'button', text: 'Свечение' });
    const sizeBtn = kit.el('button', { class: 'w-tool', type: 'button', text: 'Толщина · 10' });
    const undo = kit.el('button', { class: 'w-tool', type: 'button', text: 'Отменить' });
    const clearBtn = kit.el('button', { class: 'w-tool', type: 'button', text: 'Очистить' });
    const saveBtn = kit.el('button', { class: 'w-tool is-primary', type: 'button', text: 'Скачать PNG' });
    bar.append(eraser, glow, sizeBtn, undo, clearBtn, saveBtn);

    eraser.addEventListener('click', () => {
      tools.mode = tools.mode === 'erase' ? 'brush' : 'erase';
      eraser.classList.toggle('is-active', tools.mode === 'erase');
      swatchEls.forEach((s) => s.classList.remove('is-active'));
      kit.sfx('click');
    });
    glow.addEventListener('click', () => {
      tools.glow = !tools.glow;
      glow.classList.toggle('is-active', tools.glow);
    });
    const sizes = [4, 10, 22, 40];
    sizeBtn.addEventListener('click', () => {
      tools.size = sizes[(sizes.indexOf(tools.size) + 1) % sizes.length];
      sizeBtn.textContent = 'Толщина · ' + tools.size;
    });
    undo.addEventListener('click', () => { strokes.pop(); redraw(); kit.sfx('click'); });
    clearBtn.addEventListener('click', () => { strokes.length = 0; redraw(); kit.sfx('click'); });
    saveBtn.addEventListener('click', () => {
      try {
        const url = canvas.toDataURL('image/png');
        const a = kit.el('a', { href: url, download: 'рисунок-' + Date.now() + '.png' });
        document.body.append(a); a.click(); a.remove();
        kit.toast('Рисунок сохранён', 'ok');
      } catch (e) { kit.toast('Не получилось сохранить', 'err'); }
    });

    let dpr = 1, W = 0, H = 0;
    function fit() {
      const r = stage.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      redraw();
    }
    function ctxSetup() {
      const c = canvas.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      return c;
    }
    function strokePath(c, s) {
      const pts = s.pts;
      if (!pts.length) return;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.lineWidth = s.size;
      c.strokeStyle = s.color;
      if (s.glow && s.mode === 'brush') { c.shadowBlur = s.size * 1.3; c.shadowColor = s.color; }
      else { c.shadowBlur = 0; }
      if (pts.length === 1) {
        c.beginPath();
        c.arc(pts[0].x, pts[0].y, Math.max(0.6, s.size / 2), 0, 6.2832);
        c.fillStyle = s.color;
        c.fill();
        return;
      }
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      c.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      c.stroke();
    }
    function redraw() {
      const c = ctxSetup();
      c.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = (APP.theme && APP.theme.mode) !== 'light';
      c.fillStyle = isDark ? 'rgba(12,14,30,.35)' : 'rgba(255,255,255,.55)';
      c.fillRect(0, 0, W, H);
      for (const s of strokes) {
        if (s.mode === 'erase') {
          c.save();
          c.globalCompositeOperation = 'destination-out';
          strokePath(c, { pts: s.pts, size: s.size * 1.6, color: '#000', glow: false, mode: 'erase' });
          c.restore();
        } else strokePath(c, s);
      }
    }
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      current = { pts: [pos(e)], color: tools.color, size: tools.size, mode: tools.mode, glow: tools.glow };
      strokes.push(current);
      if (strokes.length > 400) strokes.shift();
      redraw();
      kit.sfx('step');
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!current) return;
      const p = pos(e);
      const last = current.pts[current.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 1.4) return;
      current.pts.push(p);
      redraw();
    });
    const stop = () => { current = null; };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('pointerleave', stop);

    root.append(wrap);
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    fit();

    return { destroy() { ro.disconnect(); } };
  }

  /* --------------------------- задания ------------------------------------ */
  function widgetQuests(sec, root, api) {
    const kit = K();
    const key = APP.CONFIG.STORE_KEY + '.quests.' + api.specId;
    const state = kit.readStore(key, {});
    const wrap = kit.el('div', { class: 'w-quests' });
    const head = kit.el('div', { class: 'w-quest-head' });
    const ringWrap = kit.el('div', { class: 'w-ring' });
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ring.setAttribute('viewBox', '0 0 44 44');
    ring.innerHTML = '<circle class="w-ring-bg" cx="22" cy="22" r="18"></circle><circle class="w-ring-fg" cx="22" cy="22" r="18"></circle>';
    const ringText = kit.el('b', { text: '0' });
    ringWrap.append(ring, ringText);
    const info = kit.el('div', { class: 'w-quest-info' }, [
      kit.el('strong', { text: '0 из ' + sec.items.length }),
      kit.el('span', { text: 'Собери галочки и получи опыт' })
    ]);
    head.append(ringWrap, info);
    const list = kit.el('div', { class: 'w-quest-list' });
    wrap.append(head, list);

    const total = sec.items.reduce((a, it) => a + it.reward, 0);
    const fg = ring.querySelector('.w-ring-fg');
    const circumference = 2 * Math.PI * 18;
    fg.style.strokeDasharray = circumference;

    const rows = sec.items.map((it, i) => {
      const done = !!state[i];
      const check = kit.el('button', { class: 'w-quest-check' + (done ? ' is-done' : ''), type: 'button', 'aria-label': 'отметить' });
      check.append(kit.el('span', { text: done ? '✓' : '' }));
      const row = kit.el('div', { class: 'w-quest-row' + (done ? ' is-done' : '') }, [
        check,
        kit.el('div', { class: 'w-quest-text' }, [
          kit.el('strong', { text: it.title }),
          it.desc ? kit.el('span', { text: it.desc }) : null
        ]),
        kit.el('div', { class: 'w-quest-meta' }, [
          kit.el('i', { text: it.difficulty }),
          kit.el('b', { text: '+' + it.reward })
        ])
      ]);
      check.addEventListener('click', () => {
        state[i] = !state[i];
        kit.writeStore(key, state);
        row.classList.toggle('is-done', !!state[i]);
        check.classList.toggle('is-done', !!state[i]);
        check.firstChild.textContent = state[i] ? '✓' : '';
        if (state[i]) { kit.sfx('ok'); kit.burst(row, 8); } else kit.sfx('click');
        update();
      });
      list.append(row);
      return row;
    });

    function update() {
      const done = sec.items.filter((_, i) => state[i]);
      const xp = done.reduce((a, it) => a + it.reward, 0);
      const ratio = total ? xp / total : 0;
      fg.style.strokeDashoffset = String(circumference * (1 - ratio));
      ringText.textContent = String(xp);
      info.firstChild.textContent = done.length + ' из ' + sec.items.length;
      info.lastChild.textContent = ratio >= 1
        ? 'Всё сделано — можно выдохнуть 🫧'
        : 'Осталось опыта: ' + (total - xp);
      if (ratio >= 1 && !wrap.dataset.done) {
        wrap.dataset.done = '1';
        kit.sfx('win');
        kit.burst(head, 24);
        kit.toast('Все задания выполнены!', 'ok');
      }
    }
    const reset = kit.el('button', { class: 'w-tool', type: 'button', text: 'Сбросить галочки' });
    reset.addEventListener('click', () => {
      Object.keys(state).forEach((k) => delete state[k]);
      kit.writeStore(key, state);
      rows.forEach((r) => { r.classList.remove('is-done'); r.querySelector('.w-quest-check').classList.remove('is-done'); r.querySelector('.w-quest-check').firstChild.textContent = ''; });
      update();
    });
    wrap.append(reset);
    update();
    root.append(wrap);
    return { destroy() { } };
  }

  /* ---------------------- «новости» выдуманного мира ----------------------- */
  function widgetNews(sec, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-news' });
    const note = kit.el('div', { class: 'w-news-note', text: 'Выдуманные новости выдуманного мира — совпадения приятны, но случайны.' });
    wrap.append(note);
    sec.items.forEach((it, i) => {
      const body = kit.el('p', { class: 'w-news-body', text: it.body });
      const card = kit.el('article', { class: 'w-news-card' }, [
        kit.el('div', { class: 'w-news-top' }, [
          kit.el('span', { class: 'w-chip', text: it.tag }),
          it.time ? kit.el('span', { class: 'w-news-time', text: it.time }) : null
        ]),
        kit.el('h4', { text: it.title }),
        body
      ]);
      card.style.animationDelay = (i * 70) + 'ms';
      card.addEventListener('click', () => {
        card.classList.toggle('is-open');
        body.classList.toggle('is-clamped', !card.classList.contains('is-open'));
        kit.sfx('click');
      });
      body.classList.add('is-clamped');
      wrap.append(card);
    });
    root.append(wrap);
    return { destroy() { } };
  }

  /* ------------------------------ факты ----------------------------------- */
  function widgetFacts(sec, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-facts' });
    sec.items.forEach((it) => {
      const inner = kit.el('div', { class: 'w-flip-inner' }, [
        kit.el('div', { class: 'w-flip-face w-flip-front' }, [kit.el('h4', { text: it.title }), kit.el('span', { text: 'нажми' })]),
        kit.el('div', { class: 'w-flip-face w-flip-back' }, [kit.el('p', { text: it.body })])
      ]);
      const card = kit.el('button', { class: 'w-flip', type: 'button' }, [inner]);
      card.addEventListener('click', () => { card.classList.toggle('is-open'); kit.sfx('pop'); });
      wrap.append(card);
    });
    root.append(wrap);
    return { destroy() { } };
  }

  /* ------------------------------ цитаты ---------------------------------- */
  function widgetQuotes(sec, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-quotes' });
    const textEl = kit.el('blockquote', { class: 'w-quote-text' });
    const author = kit.el('div', { class: 'w-quote-author' });
    const dots = kit.el('div', { class: 'w-dots' });
    const card = kit.el('div', { class: 'w-quote-card' }, [textEl, author, dots]);
    wrap.append(card);
    let i = 0, timer = 0;
    sec.items.forEach((_, idx) => {
      const d = kit.el('button', { class: 'w-dot', type: 'button', 'aria-label': 'цитата ' + (idx + 1) });
      d.addEventListener('click', () => { show(idx); restart(); });
      dots.append(d);
    });
    function show(idx) {
      i = (idx + sec.items.length) % sec.items.length;
      const q = sec.items[i];
      card.classList.add('is-fading');
      setTimeout(() => {
        textEl.textContent = '«' + q.text + '»';
        author.textContent = '— ' + q.author;
        card.classList.remove('is-fading');
        Array.from(dots.children).forEach((d, k) => d.classList.toggle('is-active', k === i));
      }, APP.PREFS.reduceMotion ? 0 : 420);
    }
    function restart() { clearInterval(timer); timer = setInterval(() => show(i + 1), 7000); }
    show(0); restart();
    root.append(wrap);
    return { destroy() { clearInterval(timer); } };
  }

  /* ----------------------------- дыхание ---------------------------------- */
  function widgetBreath(sec, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-breath' });
    const orb = kit.el('div', { class: 'w-breath-orb' });
    const label = kit.el('div', { class: 'w-breath-label', text: 'Готов?' });
    const counter = kit.el('div', { class: 'w-breath-count' });
    const phases = [
      { name: 'Вдох', sec: sec.inhale, scale: 1.35 },
      { name: 'Задержка', sec: sec.hold, scale: 1.35 },
      { name: 'Выдох', sec: sec.exhale, scale: 0.72 }
    ];
    wrap.append(kit.el('div', { class: 'w-breath-orb-wrap' }, [orb]), label, counter);
    const startBtn = kit.el('button', { class: 'w-tool is-primary', type: 'button', text: 'Начать' });
    wrap.append(startBtn);
    let running = false, phase = 0, cycle = 1, timer = 0;
    function apply(p) {
      const dur = p.sec;
      orb.style.transition = 'transform ' + dur + 's cubic-bezier(.42,0,.58,1)';
      orb.style.transform = 'scale(' + p.scale + ')';
      label.textContent = p.name + ' · ' + dur + ' с';
      kit.tone(p.name === 'Вдох' ? 420 : p.name === 'Выдох' ? 300 : 360, 0.5, 'sine', 0.06);
    }
    function step() {
      if (!running) return;
      apply(phases[phase]);
      counter.textContent = 'Круг ' + cycle + ' из ' + sec.cycles;
      timer = setTimeout(() => {
        phase++;
        if (phase >= phases.length) {
          phase = 0; cycle++;
          if (cycle > sec.cycles) return stop(true);
        }
        step();
      }, phases[phase].sec * 1000);
    }
    function start() {
      running = true; phase = 0; cycle = 1;
      startBtn.textContent = 'Остановить';
      step();
    }
    function stop(done) {
      running = false; clearTimeout(timer);
      orb.style.transition = 'transform 0.8s cubic-bezier(.22,1,.36,1)';
      orb.style.transform = 'scale(1)';
      startBtn.textContent = done ? 'Ещё раз' : 'Продолжить';
      label.textContent = done ? 'Готово. Как самочувствие?' : 'Пауза';
      if (done) { kit.sfx('ok'); kit.burst(wrap, 14); }
    }
    startBtn.addEventListener('click', () => { running ? stop(false) : start(); kit.sfx('click'); });
    counter.textContent = sec.cycles + ' круга · ' + (sec.inhale + sec.hold + sec.exhale) + ' с на круг';
    root.append(wrap);
    return { destroy() { clearTimeout(timer); } };
  }

  /* ----------------------------- помодоро --------------------------------- */
  function widgetPomodoro(sec, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-pomo' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.classList.add('w-pomo-ring');
    svg.innerHTML = '<circle class="w-pomo-bg" cx="60" cy="60" r="52"></circle><circle class="w-pomo-fg" cx="60" cy="60" r="52"></circle>';
    const fg = svg.querySelector('.w-pomo-fg');
    const C = 2 * Math.PI * 52;
    fg.style.strokeDasharray = C;
    const time = kit.el('div', { class: 'w-pomo-time', text: sec.focus + ':00' });
    const mode = kit.el('div', { class: 'w-pomo-mode', text: 'фокус' });
    const face = kit.el('div', { class: 'w-pomo-face' }, [svg, kit.el('div', { class: 'w-pomo-center' }, [time, mode])]);
    const stats = kit.el('div', { class: 'w-pomo-stats', text: 'Сессий: 0' });
    const startBtn = kit.el('button', { class: 'w-tool is-primary', type: 'button', text: 'Старт' });
    const resetBtn = kit.el('button', { class: 'w-tool', type: 'button', text: 'Сброс' });
    wrap.append(face, kit.el('div', { class: 'w-pomo-bar' }, [startBtn, resetBtn]), stats);

    let left = sec.focus * 60, isFocus = true, running = false, sessions = 0, timer = 0;
    function paint() {
      const total = (isFocus ? sec.focus : sec.rest) * 60;
      const m = Math.floor(Math.max(0, left) / 60), s = Math.max(0, left) % 60;
      time.textContent = m + ':' + String(s).padStart(2, '0');
      mode.textContent = isFocus ? 'фокус' : 'перерыв';
      fg.style.strokeDashoffset = String(C * (1 - Math.max(0, left) / total));
      stats.textContent = 'Сессий завершено: ' + sessions;
    }
    function tick() { if (!running) return; left--; if (left < 0) switchMode(); paint(); }
    function switchMode() {
      isFocus = !isFocus;
      if (isFocus) sessions++;
      left = (isFocus ? sec.focus : sec.rest) * 60;
      kit.sfx(isFocus ? 'ok' : 'pop');
      kit.toast(isFocus ? 'Перерыв закончился — за работу' : 'Перерыв! Отойди от экрана', 'ok');
      kit.burst(wrap, 16);
      paint();
    }
    startBtn.addEventListener('click', () => {
      running = !running;
      startBtn.textContent = running ? 'Пауза' : 'Старт';
      kit.sfx('click');
      if (running && !timer) timer = setInterval(tick, 1000);
    });
    resetBtn.addEventListener('click', () => {
      running = false; isFocus = true; left = sec.focus * 60;
      startBtn.textContent = 'Старт'; paint(); kit.sfx('click');
    });
    paint();
    root.append(wrap);
    return { destroy() { clearInterval(timer); } };
  }

  /* ------------------------------ колесо ---------------------------------- */
  function widgetWheel(sec, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-wheel' });
    const canvas = kit.el('canvas', { class: 'w-wheel-canvas' });
    const result = kit.el('div', { class: 'w-wheel-result', text: 'Крути — узнаешь' });
    const spinBtn = kit.el('button', { class: 'w-tool is-primary', type: 'button', text: 'Крутить' });
    wrap.append(canvas, result, spinBtn);
    const items = sec.items;
    const n = items.length;
    let rot = -Math.PI / 2, spinning = false, dpr = 1, R = 120;
    const colors = ['rgba(255,255,255,.24)', 'rgba(255,255,255,.10)'];
    function fit() {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.width * dpr);
      R = r.width / 2;
      draw();
    }
    function draw() {
      const c = canvas.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, canvas.width, canvas.height);
      const pal = kit.palette();
      c.save();
      c.translate(R, R);
      c.rotate(rot);
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832;
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, R - 6, a0, a1);
        c.closePath();
        const g = c.createLinearGradient(-R, -R, R, R);
        g.addColorStop(0, i % 2 ? colors[1] : colors[0]);
        g.addColorStop(1, i % 2 ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)');
        c.fillStyle = g;
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,.25)';
        c.lineWidth = 0.8;
        c.stroke();
        // текст
        c.save();
        c.rotate((a0 + a1) / 2);
        c.fillStyle = pal.ink;
        c.font = '600 ' + Math.max(9, Math.min(14, R / 9)) + 'px -apple-system, system-ui, sans-serif';
        c.textAlign = 'right';
        c.textBaseline = 'middle';
        const label = items[i].length > 22 ? items[i].slice(0, 21) + '…' : items[i];
        c.fillText(label, R - 16, 0);
        c.restore();
      }
      c.restore();
      c.beginPath();
      c.arc(R, R, R - 3, 0, 6.2832);
      c.strokeStyle = 'rgba(255,255,255,.45)';
      c.lineWidth = 1.4;
      c.stroke();
      c.beginPath();
      c.arc(R, R, 8, 0, 6.2832);
      c.fillStyle = 'rgba(255,255,255,.75)';
      c.fill();
    }
    function spin() {
      if (spinning) return;
      spinning = true;
      kit.sfx('click');
      const target = rot + 6.2832 * (3 + Math.random() * 3) + Math.random() * 6.2832;
      const from = rot, dur = 3600, t0 = performance.now();
      (function anim(now) {
        const t = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - t, 3.2);
        rot = from + (target - from) * eased;
        draw();
        if (t < 1) requestAnimationFrame(anim);
        else {
          spinning = false;
          const norm = ((-rot - Math.PI / 2) % 6.2832 + 6.2832) % 6.2832;
          const idx = Math.floor(norm / (6.2832 / n)) % n;
          result.textContent = items[idx];
          result.classList.remove('pop');
          requestAnimationFrame(() => result.classList.add('pop'));
          kit.sfx('win');
          kit.burst(wrap, 18);
        }
      })(t0);
    }
    spinBtn.addEventListener('click', spin);
    canvas.addEventListener('click', spin);
    root.append(wrap);
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    fit();
    return { destroy() { ro.disconnect(); } };
  }

  /* ------------------------------ пианино --------------------------------- */
  function widgetPiano(sec, root, api) {
    const kit = K();
    const scales = {
      calm: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25],
      bright: [329.63, 369.99, 415.3, 493.88, 554.37, 659.25, 739.99, 830.61],
      dark: [196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88]
    };
    const notes = scales[sec.mood] || scales.calm;
    const names = ['до', 'ре', 'ми', 'фа', 'соль', 'ля', 'си', 'до+'];
    const wrap = kit.el('div', { class: 'w-piano' });
    const keys = kit.el('div', { class: 'w-piano-keys' });
    wrap.append(keys);
    const idle = kit.el('div', { class: 'w-piano-idle', text: 'Нажми на стеклянные клавиши' });
    wrap.append(idle);
    notes.forEach((f, i) => {
      const key = kit.el('button', { class: 'w-piano-key', type: 'button', 'aria-label': names[i] });
      key.append(kit.el('span', { text: names[i] }));
      const press = () => {
        key.classList.add('is-down');
        setTimeout(() => key.classList.remove('is-down'), 220);
        kit.tone(f, 0.9, 'sine', 0.13);
        kit.tone(f * 2, 0.4, 'triangle', 0.03);
        idle.textContent = 'нота ' + names[i];
      };
      key.addEventListener('pointerdown', press);
      keys.append(key);
    });
    root.append(wrap);
    return { destroy() { } };
  }

  /* --------------------------- питомец-блоб ------------------------------- */
  function widgetBlob(sec, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-blob' });
    const eyes = kit.el('div', { class: 'w-blob-eyes' }, [kit.el('i'), kit.el('i')]);
    const mouth = kit.el('div', { class: 'w-blob-mouth' });
    const blob = kit.el('div', { class: 'w-blob-body' }, [eyes, mouth]);
    const hintEl = kit.el('div', { class: 'w-blob-hint', text: 'Потяни ' + sec.name + ' — он упругий' });
    const pets = kit.el('div', { class: 'w-blob-pets', text: 'Поглаживаний: 0' });
    wrap.append(blob, hintEl, pets);
    root.append(wrap);

    const s = kit.scope();
    let x = 0, y = 0, vx = 0, vy = 0, grab = false, gx = 0, gy = 0, count = 0, t = 0;
    const area = () => wrap.getBoundingClientRect();
    function loop(dt) {
      t += dt;
      const r = area();
      const bw = blob.offsetWidth || 140;
      const maxX = Math.max(0, r.width / 2 - bw / 2 - 6);
      const maxY = Math.max(0, r.height / 2 - bw / 2 - 6);
      if (grab) {
        const nx = Math.max(-maxX, Math.min(maxX, gx));
        const ny = Math.max(-maxY, Math.min(maxY, gy));
        vx = (nx - x) / Math.max(dt, 0.016) * 0.35;
        vy = (ny - y) / Math.max(dt, 0.016) * 0.35;
        x = nx; y = ny;
      } else {
        const k = 42, damp = 0.86;
        vx += -x * k * dt; vy += -y * k * dt;
        vx *= damp; vy *= damp;
        x += vx * dt; y += vy * dt;
      }
      const speed = Math.min(1, Math.hypot(vx, vy) / 700);
      const stretch = 1 + speed * 0.26;
      const squash = 1 - speed * 0.18;
      const breathe = 1 + Math.sin(t * 1.8) * 0.022;
      const angle = Math.atan2(vy, vx) * 180 / Math.PI;
      const stretchRot = speed > 0.06 ? angle : 0;
      blob.style.transform = 'translate(' + x + 'px,' + y + 'px) ' +
        'rotate(' + (stretchRot * 0.35) + 'deg) scale(' + (squash * breathe) + ',' + (stretch * breathe) + ') rotate(' + (-stretchRot * 0.35) + 'deg)';
      eyes.style.transform = 'translate(' + (x * 0.01) + 'px,' + (y * 0.01) + 'px)';
    }
    blob.addEventListener('pointerdown', (e) => {
      blob.setPointerCapture(e.pointerId);
      grab = true;
      const r = area();
      gx = e.clientX - (r.left + r.width / 2);
      gy = e.clientY - (r.top + r.height / 2);
      kit.sfx('pop');
    });
    blob.addEventListener('pointermove', (e) => {
      if (!grab) return;
      const r = area();
      gx = e.clientX - (r.left + r.width / 2);
      gy = e.clientY - (r.top + r.height / 2);
    });
    const release = () => {
      if (!grab) return;
      grab = false;
      count++;
      pets.textContent = 'Поглаживаний: ' + count;
      if (count % 5 === 0) { kit.burst(wrap, 12); kit.toast(sec.name + ' доволен 🫧', 'ok'); }
    };
    blob.addEventListener('pointerup', release);
    blob.addEventListener('pointercancel', release);
    blob.addEventListener('dblclick', () => { vy = -260; vx = (Math.random() - 0.5) * 200; kit.sfx('pop'); });
    wrap.addEventListener('click', (e) => { if (e.target === wrap) { vx += (Math.random() - 0.5) * 120; vy = -180; } });
    s.raf(loop);
    return { destroy() { s.dispose(); } };
  }

  /* ------------------------------ прогресс -------------------------------- */
  function widgetStats(sec, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-stats' });
    const records = (function () { try { return JSON.parse(localStorage.getItem(APP.CONFIG.HI_KEY) || '{}'); } catch (e) { return {}; } })();
    const games = APP.SPEC.GAMES;
    const played = games.filter((g) => records[g.id]);
    const total = played.length;
    const head = kit.el('div', { class: 'w-stats-head' }, [
      kit.el('div', { class: 'w-stats-big', text: total + ' / ' + games.length }),
      kit.el('div', { class: 'w-stats-sub', text: total ? 'игр с рекордами' : 'пока ни одной игры не сыграно' })
    ]);
    wrap.append(head);
    const grid = kit.el('div', { class: 'w-stats-grid' });
    games.forEach((g) => {
      const v = records[g.id];
      grid.append(kit.el('div', { class: 'w-stats-row' + (v ? ' is-done' : '') }, [
        kit.el('span', { class: 'w-stats-emoji', text: g.emoji }),
        kit.el('span', { class: 'w-stats-name', text: g.name }),
        kit.el('b', { text: v ? String(v) : '—' })
      ]));
    });
    wrap.append(grid);
    const clear = kit.el('button', { class: 'w-tool', type: 'button', text: 'Сбросить все рекорды' });
    clear.addEventListener('click', () => {
      try { localStorage.removeItem(APP.CONFIG.HI_KEY); } catch (e) { }
      kit.toast('Рекорды очищены', 'ok');
      document.querySelectorAll('[data-hi]').forEach((n) => { n.textContent = '—'; });
    });
    wrap.append(clear);
    root.append(wrap);
    return { destroy() { } };
  }

  /* ------------------- песочница для игры от Gemini ------------------------ */
  function widgetCustom(cg, root, api) {
    const kit = K();
    const wrap = kit.el('div', { class: 'w-custom' });
    const bar = kit.el('div', { class: 'w-custom-bar' }, [
      kit.el('span', { class: 'w-chip', text: cg.emoji + ' ' + cg.name }),
      kit.el('span', { class: 'w-custom-blurb', text: cg.blurb })
    ]);
    const tools = kit.el('div', { class: 'w-custom-tools' });
    const fullBtn = kit.el('button', { class: 'w-tool', type: 'button', text: 'Во весь экран' });
    const openBtn = kit.el('button', { class: 'w-tool', type: 'button', text: 'Открыть отдельно' });
    const reloadBtn = kit.el('button', { class: 'w-tool', type: 'button', text: 'Перезапустить' });
    tools.append(fullBtn, reloadBtn, openBtn);
    bar.append(tools);
    const frame = kit.el('iframe', {
      class: 'w-frame',
      sandbox: 'allow-scripts allow-pointer-lock',
      title: cg.name,
      loading: 'lazy'
    });
    const fallback = kit.el('div', { class: 'w-custom-fail', text: 'Игра-сюрприз не запустилась. Попробуй перезапустить или собери новый сайт.' });
    fallback.hidden = true;
    wrap.append(bar, frame, fallback);
    root.append(wrap);

    const theme = APP.theme || {};
    const styleVars = '<style>:root{--accent:' + (theme.accent || '#7c5cff') + ';--accent2:' + (theme.accent2 || '#22d3ee') +
      ';--glass:rgba(255,255,255,.12);--ink:' + ((theme.mode === 'light') ? '#101425' : '#ffffff') + '}html,body{margin:0}</style>';
    const prelude = '<scr' + 'ipt>(function(){var send=function(t,d){try{parent.postMessage(Object.assign({lg:1,type:t},d||{}),"*")}catch(e){}};' +
      'window.addEventListener("error",function(e){send("error",{m:String((e&&e.message)||"error")})});' +
      'window.addEventListener("unhandledrejection",function(){send("error",{m:"promise"})});' +
      'setTimeout(function(){send("ready")},600);})();</scr' + 'ipt>';

    function srcdoc(html) {
      const head = '<head>' + styleVars + prelude;
      if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + styleVars + prelude);
      if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => m.replace(/>$/, '>') + head.replace('<head>', '<head>'));
      return styleVars + prelude + html;
    }
    function load() {
      fallback.hidden = true;
      frame.hidden = false;
      frame.srcdoc = srcdoc(cg.html);
      alive = false;
      clearTimeout(kill);
      kill = setTimeout(() => { if (!alive) fail(); }, 4000);
    }
    let alive = false, kill = 0;
    function fail() {
      frame.hidden = true;
      fallback.hidden = false;
    }
    const onMsg = (e) => {
      if (e.source !== frame.contentWindow) return;
      const d = e.data || {};
      if (d.lg !== 1) return;
      if (d.type === 'ready') { alive = true; clearTimeout(kill); fallback.hidden = true; }
      if (d.type === 'error') { /* оставляем игру в живых: одна ошибка не повод её убивать */ }
    };
    window.addEventListener('message', onMsg);

    fullBtn.addEventListener('click', () => {
      wrap.classList.toggle('is-full');
      fullBtn.textContent = wrap.classList.contains('is-full') ? 'Обычный размер' : 'Во весь экран';
      kit.sfx('click');
    });
    reloadBtn.addEventListener('click', () => { load(); kit.sfx('click'); });
    openBtn.addEventListener('click', () => {
      try {
        const url = URL.createObjectURL(new Blob([cg.html], { type: 'text/html' }));
        window.open(url, '_blank');
      } catch (e) { kit.toast('Браузер запретил открыть', 'err'); }
    });
    load();
    return { destroy() { window.removeEventListener('message', onMsg); clearTimeout(kill); } };
  }

  /* ------------------------------ диспетчер ------------------------------- */
  const MAP = {
    canvas: (sec, root, api) => widgetCanvas(sec, root, api),
    quests: widgetQuests,
    news: widgetNews,
    facts: widgetFacts,
    quotes: widgetQuotes,
    breath: widgetBreath,
    pomodoro: widgetPomodoro,
    wheel: widgetWheel,
    piano: widgetPiano,
    blob: widgetBlob,
    stats: widgetStats
  };

  function mount(section, root, api) {
    if (section.type === 'custom') return widgetCustom(section.custom, root, api);
    const fn = MAP[section.type];
    if (!fn) {
      root.append(K().el('div', { class: 'w-blank', text: 'Пустой раздел — бывает.' }));
      return { destroy() { } };
    }
    return fn(section, root, api) || { destroy() { } };
  }

  APP.WIDGETS = { mount, widgetCustom };
})(typeof window !== 'undefined' ? window : globalThis);
