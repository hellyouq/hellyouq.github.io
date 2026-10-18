/* ============================================================================
 *  render.js — превращает спеку сайта в живой интерфейс: навигация, герой,
 *  разделы, карточки игр, песочница сюрприза, футер, анимации появления.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const APP = (global.APP = global.APP || {});
  const el = (tag, props, kids) => APP.KIT.el(tag, props, kids);
  const clear = (node) => APP.KIT.clear(node);

  function specIdOf(spec) {
    let h = 0;
    const meta = spec.meta || {};
    const s = (spec.title || '') + '|' + (meta.seed || '');
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return Math.abs(h).toString(36);
  }

  function resolveMode(mode) {
    if (mode === 'auto') {
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    return mode === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent2', theme.accent2);
    root.style.setProperty('--hue', String(theme.hue));
    root.style.setProperty('--hue2', String(theme.hue2));
    root.style.setProperty('--radius', theme.radius + 'px');
    root.style.setProperty('--glow', String(theme.glow));
    root.dataset.mode = resolveMode(theme.mode);
    root.dataset.font = theme.font || 'sf';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', root.dataset.mode === 'light' ? '#eaeefb' : '#07070f');
  }

  /* --------------------------- карточка игры ------------------------------- */
  function renderGameCard(item, baseApi, ctx) {
    const record = el('span', { class: 'lg-game-hi', 'data-hi': item.game, text: 'рекорд ' + (APP.KIT.hi(item.game) || '—') });
    const stage = el('div', { class: 'lg-game-stage' });
    const fullBtn = el('button', { class: 'lg-btn ghost tiny', type: 'button', text: 'Во весь экран' });
    const card = el('article', { class: 'lg-game lg-glass', 'data-game': item.game }, [
      el('header', { class: 'lg-game-head' }, [
        el('span', { class: 'lg-game-emoji', text: item.emoji }),
        el('div', { class: 'lg-game-titles' }, [
          el('h4', { text: item.name }),
          el('p', { text: item.blurb })
        ]),
        record
      ]),
      stage,
      el('footer', { class: 'lg-game-foot' }, [fullBtn])
    ]);

    const api = Object.assign({}, baseApi, {
      onScore(value, isRecord) {
        record.textContent = 'рекорд ' + (APP.KIT.hi(item.game) || '—');
        if (isRecord) {
          card.classList.add('is-record');
          record.textContent = 'рекорд ' + value + ' ✨';
          APP.KIT.burst(card, 14);
        }
      }
    });

    let inst;
    try {
      inst = APP.GAMES.mount(item, stage, api);
    } catch (e) {
      if (window.console) console.warn('game failed', item.game, e);
      APP.KIT.clear(stage);
      stage.append(el('div', { class: 'w-blank', text: 'Эта игра не завелась — остальные на месте.' }));
      return card;
    }
    ctx.instances.push(inst);

    fullBtn.addEventListener('click', () => {
      const on = card.classList.toggle('is-full');
      fullBtn.textContent = on ? 'Свернуть' : 'Во весь экран';
      document.body.classList.toggle('is-locked', on);
      APP.KIT.sfx('click');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
      if (on) APP.KIT.toast('Esc — выйти из большого экрана', 'ok');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && card.classList.contains('is-full')) fullBtn.click();
    });
    return card;
  }

  /* ------------------------------- рендер --------------------------------- */
  function mount(spec, opts) {
    opts = opts || {};
    applyTheme(spec.theme);
    APP.theme = spec.theme;
    APP.spec = spec;

    const ctx = { instances: [], timers: [] };
    const baseApi = {
      specId: specIdOf(spec),
      toast: APP.KIT.toast,
      sfx: APP.KIT.sfx,
      burst: APP.KIT.burst,
      hi: (id) => APP.KIT.hi(id),
      setHi: (id, v) => APP.KIT.setHi(id, v),
      onScore() { }
    };

    const host = document.querySelector('.lg-app');
    clear(host);

    /* ---------- фон: пузыри + зерно ---------- */
    const bg = el('div', { class: 'lg-bg', 'aria-hidden': 'true' }, [
      el('span', { class: 'lg-blob b1' }), el('span', { class: 'lg-blob b2' }),
      el('span', { class: 'lg-blob b3' }), el('span', { class: 'lg-blob b4' }),
      el('span', { class: 'lg-grain' })
    ]);
    host.append(bg);

    /* ---------- навигация ---------- */
    const navLinks = el('nav', { class: 'lg-nav-links' });
    const navBar = el('header', { class: 'lg-nav' }, [
      el('button', { class: 'lg-brand', type: 'button', title: 'Наверх' }, [
        el('span', { class: 'lg-brand-emoji', text: spec.emoji }),
        el('span', { class: 'lg-brand-text' }, [
          el('b', { text: spec.title }),
          el('i', { text: spec.tagline })
        ])
      ]),
      navLinks,
      el('div', { class: 'lg-nav-tools' }, [
        el('button', { class: 'lg-icon', type: 'button', text: '🔗', title: 'Поделиться ссылкой', onclick: () => opts.onShare && opts.onShare(spec) }),
        el('button', { class: 'lg-icon', type: 'button', text: '◐', title: 'Светлая или тёмная тема', onclick: () => { toggleMode(); } }),
        el('button', { class: 'lg-icon', type: 'button', text: APP.PREFS.muted ? '🔇' : '🔊', title: 'Звук', id: 'lg-sound' }, []),
        el('button', { class: 'lg-icon is-accent', type: 'button', text: '🎲', title: 'Собрать новый сайт', onclick: () => opts.onReroll && opts.onReroll() })
      ])
    ]);
    const soundBtn = navBar.querySelector('#lg-sound');
    soundBtn.addEventListener('click', () => {
      APP.PREFS.muted = !APP.PREFS.muted;
      APP.savePrefs();
      soundBtn.textContent = APP.PREFS.muted ? '🔇' : '🔊';
      if (!APP.PREFS.muted) APP.KIT.sfx('pop');
    });
    host.append(navBar);

    const progress = el('div', { class: 'lg-scroll-line', 'aria-hidden': 'true' });
    host.append(progress);

    const main = el('main', { class: 'lg-main' });
    const meta = spec.meta || {};

    /* ---------- герой ---------- */
    const hero = el('section', { class: 'lg-hero' }, [
      el('div', { class: 'lg-hero-bubbles', 'aria-hidden': 'true' }, [
        el('span'), el('span'), el('span')
      ]),
      el('div', { class: 'lg-hero-badge', text: spec.hero.badge }),
      el('h1', { class: 'lg-hero-title', text: spec.hero.headline }),
      el('p', { class: 'lg-hero-sub', text: spec.hero.sub }),
      el('div', { class: 'lg-hero-actions' }, [
        el('button', {
          class: 'lg-btn primary', type: 'button', text: spec.hero.cta,
          onclick: () => { scrollToSection(0); APP.KIT.sfx('click'); }
        }),
        el('button', { class: 'lg-btn', type: 'button', text: 'Собрать другой', onclick: () => opts.onReroll && opts.onReroll() })
      ]),
      el('div', { class: 'lg-hero-meta' }, [
        el('span', { text: 'собрано ' + new Date(meta.createdAt || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }),
        el('span', { text: 'модель ' + (meta.model || 'локально') }),
        meta.vibe ? el('span', { text: 'по просьбе: ' + meta.vibe }) : null
      ])
    ]);
    main.append(hero);

    /* ---------- разделы ---------- */
    const sections = spec.sections.slice();
    if (spec.customGame) {
      sections.push({ type: 'custom', title: 'Игра-сюрприз: ' + spec.customGame.name, subtitle: spec.customGame.blurb, custom: spec.customGame });
    }

    sections.forEach((sec, i) => {
      const id = 'sec-' + i;
      let title = '';
      let card = null;
      try {
        title = sec.title || APP.SPEC.sectionNavName(sec);
        const head = el('div', { class: 'lg-sec-head' }, [
          el('h2', { text: title }),
          sec.subtitle ? el('p', { text: sec.subtitle }) : null,
          sec.type === 'custom' ? el('span', { class: 'lg-chip is-accent', text: 'придумано для этого визита' }) : null
        ]);
        const body = el('div', { class: 'lg-sec-body' });
        card = el('section', { class: 'lg-section lg-reveal', id, style: { '--d': (i * 70) + 'ms' } }, [head, body]);

        if (sec.type === 'games') {
          const grid = el('div', { class: 'lg-games' });
          sec.items.forEach((item) => {
            try {
              grid.append(renderGameCard(item, baseApi, ctx));
            } catch (e) {
              if (window.console) console.warn('game card failed', item && item.game, e);
              grid.append(el('article', { class: 'lg-game lg-glass' }, [
                el('header', { class: 'lg-game-head' }, [
                  el('span', { class: 'lg-game-emoji', text: (item && item.emoji) || '🎲' }),
                  el('div', { class: 'lg-game-titles' }, [
                    el('h4', { text: (item && item.name) || 'Игра' }),
                    el('p', { text: 'Карточка не собралась — попробуй соседнюю.' })
                  ])
                ])
              ]));
            }
          });
          if (!grid.children.length) grid.append(el('div', { class: 'w-blank', text: 'Игры не собрались, зато остальное на месте.' }));
          body.append(grid);
        } else {
          try {
            const w = APP.WIDGETS.mount(sec, body, baseApi);
            if (w) ctx.instances.push(w);
          } catch (e) {
            body.append(el('div', { class: 'w-blank', text: 'Раздел не завёлся, но всё остальное работает.' }));
            if (window.console) console.warn('widget failed', sec.type, e);
          }
        }
      } catch (e) {
        if (window.console) console.warn('section failed', sec && sec.type, e);
        if (!card) card = el('section', { class: 'lg-section lg-reveal', id }, [
          el('div', { class: 'lg-sec-head' }, [el('h2', { text: title || 'Раздел' })]),
          el('div', { class: 'lg-sec-body' }, [el('div', { class: 'w-blank', text: 'Этот раздел не собрался.' })])
        ]);
      }
      main.append(card);

      if (opts.showInNav !== false) {
        const a = el('button', { class: 'lg-nav-link', type: 'button', text: title || 'Раздел' });
        a.dataset.target = id;
        a.addEventListener('click', () => { scrollToSection(i); APP.KIT.sfx('click'); });
        navLinks.append(a);
      }
    });

    /* ---------- футер ---------- */
    main.append(el('footer', { class: 'lg-footer' }, [
      el('div', { class: 'lg-footer-line', text: spec.footer }),
      el('div', { class: 'lg-footer-note', text: 'Сайт собран в браузере за один запрос: тема, тексты и игры придуманы на ходу. Обнови страницу — будет другой.' })
    ]));

    host.append(main);

    const toTop = el('button', { class: 'lg-top', type: 'button', text: '↑', title: 'Наверх' });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    host.append(toTop);

    /* ---------- поведение ---------- */
    function scrollToSection(i) {
      const node = document.getElementById('sec-' + i);
      if (!node) return;
      const y = node.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: y, behavior: APP.PREFS.reduceMotion ? 'auto' : 'smooth' });
    }
    function toggleMode() {
      const root = document.documentElement;
      const next = root.dataset.mode === 'light' ? 'dark' : 'light';
      APP.PREFS.mode = next;
      APP.savePrefs();
      root.dataset.mode = next;
      document.querySelectorAll('.lg-blob').forEach((b) => { b.style.animationName = 'none'; void b.offsetWidth; b.style.animationName = ''; });
      APP.KIT.sfx('click');
      APP.KIT.toast(next === 'light' ? 'Светлая тема' : 'Тёмная тема', 'ok');
    }

    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); reveal.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    document.querySelectorAll('.lg-reveal').forEach((n) => reveal.observe(n));

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        navLinks.querySelectorAll('.lg-nav-link').forEach((a) => a.classList.toggle('is-active', a.dataset.target === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((_, i) => { const n = document.getElementById('sec-' + i); if (n) spy.observe(n); });

    let lastScroll = 0;
    function onScroll() {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
      navBar.classList.toggle('is-scrolled', y > 24);
      toTop.classList.toggle('is-on', y > window.innerHeight * 1.2);
      lastScroll = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- лёгкий параллакс фона ---------- */
    let px = 0, py = 0, tx = 0, ty = 0, rafId = 0, running = true;
    function onPointer(e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    function loop() {
      if (!running) return;
      px += (tx - px) * 0.045;
      py += (ty - py) * 0.045;
      bg.style.transform = 'translate3d(' + (px * -14) + 'px,' + (py * -14) + 'px,0)';
      rafId = requestAnimationFrame(loop);
    }
    if (!APP.PREFS.reduceMotion) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      rafId = requestAnimationFrame(loop);
    }

    /* ---------- появление ---------- */
    requestAnimationFrame(() => {
      host.classList.add('is-ready');
      document.querySelectorAll('.lg-hero > *').forEach((n, i) => {
        n.style.animationDelay = (i * 90 + 60) + 'ms';
        n.classList.add('lg-drop');
      });
    });

    return {
      destroy() {
        running = false;
        cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onPointer);
        reveal.disconnect();
        spy.disconnect();
        ctx.instances.forEach((i) => { try { i.destroy && i.destroy(); } catch (e) { } });
        document.body.classList.remove('is-locked');
      }
    };
  }

  APP.RENDER = { mount, applyTheme, resolveMode, specIdOf };
})(typeof window !== 'undefined' ? window : globalThis);
