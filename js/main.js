/* ============================================================================
 *  main.js — точка входа: загрузочный экран, запрос к Gemini, монтирование
 *  сайта, история, ссылка-поделиться, настройки и горячие клавиши.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const APP = (global.APP = global.APP || {});
  const el = (tag, props, kids) => APP.KIT.el(tag, props, kids);
  const clear = (node) => APP.KIT.clear(node);

  /* ----------------------------- настройки --------------------------------- */
  const PREF_DEF = { mode: 'auto', muted: false, reduceMotion: false, vibe: '' };
  let prefs = Object.assign({}, PREF_DEF);
  try {
    const saved = JSON.parse(localStorage.getItem(APP.CONFIG.PREFS_KEY) || '{}');
    prefs = Object.assign(prefs, saved || {});
  } catch (e) { }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) prefs.reduceMotion = true;
  APP.PREFS = prefs;
  APP.savePrefs = () => { try { localStorage.setItem(APP.CONFIG.PREFS_KEY, JSON.stringify(APP.PREFS)); } catch (e) { } };

  /* ------------------------------- история --------------------------------- */
  function readHistory() {
    try { return JSON.parse(localStorage.getItem(APP.CONFIG.STORE_KEY) || '[]') || []; } catch (e) { return []; }
  }
  function pushHistory(spec) {
    try {
      const list = readHistory().filter((h) => h && h.spec && h.title !== spec.title);
      list.unshift({ title: spec.title, emoji: spec.emoji, at: Date.now(), model: spec.meta.model, spec });
      localStorage.setItem(APP.CONFIG.STORE_KEY, JSON.stringify(list.slice(0, APP.CONFIG.HISTORY_LIMIT)));
    } catch (e) { /* переполнение хранилища — не беда */ }
  }

  /* --------------------------- загрузочный экран --------------------------- */
  const bootEl = document.getElementById('lg-boot');
  const TIPS = [
    'Мыло сушит руки, а стекло — нет',
    'Каждый заход — другой сайт: тема, игры и тексты придумываются заново',
    'Внутри спрятана игра-сюрприз, её код пишется на ходу',
    'Игры можно развернуть на весь экран — кнопка в углу карточки',
    'Рекорды сохраняются в браузере, так что есть что побить',
    'Мелкий шрифт в «Fact» читается легче, если перевернуть карточку',
    'Ссылка на сайт кодирует всё содержимое — можно отправить другу',
    'Если ответ не пришёл, сайт соберётся локально и без ИИ'
  ];
  const boot = {
    bar: bootEl.querySelector('.lg-boot-bar > i'),
    stage: bootEl.querySelector('.lg-boot-stage'),
    title: bootEl.querySelector('.lg-boot-title'),
    tip: bootEl.querySelector('.lg-boot-tip'),
    chip: bootEl.querySelector('.lg-boot-chip'),
    retry: bootEl.querySelector('#lg-retry'),
    local: bootEl.querySelector('#lg-local'),
    cancel: bootEl.querySelector('#lg-cancel'),
    tipId: 0,
    show() {
      bootEl.hidden = false;
      bootEl.classList.remove('is-done', 'is-error');
      clearTimeout(boot.tipTimer);
      boot.tipTimer = setInterval(() => {
        boot.tipId = (boot.tipId + 1) % TIPS.length;
        boot.tip.textContent = TIPS[boot.tipId];
      }, 4200);
      boot.tip.textContent = TIPS[boot.tipId];
      boot.setProgress(0.04);
      boot.setStage('Соединяюсь с генератором');
      boot.title.textContent = 'Собираю сайт…';
      boot.chip.textContent = '';
      boot.chip.hidden = true;
      boot.retry.hidden = true;
      boot.local.hidden = true;
      boot.cancel.hidden = false;
    },
    hide() {
      clearInterval(boot.tipTimer);
      bootEl.classList.add('is-done');
      setTimeout(() => { bootEl.hidden = true; }, 900);
    },
    setProgress(p) { boot.bar.style.transform = 'scaleX(' + Math.max(0.02, Math.min(1, p)) + ')'; },
    setStage(text) { if (text && boot.stage.textContent !== text) boot.stage.textContent = text; },
    setTitle(title) {
      boot.chip.hidden = false;
      boot.chip.textContent = 'Название: «' + title + '»';
    },
    error(message, detail) {
      clearInterval(boot.tipTimer);
      bootEl.classList.add('is-error');
      boot.title.textContent = 'Не получилось собрать сайт';
      boot.stage.textContent = message || 'Похоже, генератор недоступен.';
      boot.tip.textContent = detail ? String(detail).slice(0, 220) : '';
      boot.retry.hidden = false;
      boot.local.hidden = false;
      boot.cancel.hidden = true;
      boot.cancel.textContent = 'Отменить';
    }
  };
  APP.BOOT = boot;

  /* ------------------------------ монтирование ----------------------------- */
  let current = null;
  function mountSpec(spec, meta) {
    if (current) { try { current.destroy(); } catch (e) { } }
    document.body.classList.remove('is-locked');
    let mounted = null;
    try {
      mounted = APP.RENDER.mount(spec, {
        onReroll: () => openPanel(),
        onShare: (s) => share(s)
      });
    } catch (e) {
      if (window.console) console.warn('mount failed', e);
      try { APP.KIT.toast('Сайт собрался частично — обнови страницу', 'err'); } catch (e2) { }
      const host = document.querySelector('.lg-app');
      if (host && !host.querySelector('.lg-main')) {
        APP.KIT.clear(host);
        host.append(APP.KIT.el('div', { class: 'lg-boot-fail lg-glass' }, [
          APP.KIT.el('h2', { text: 'Не получилось собрать страницу' }),
          APP.KIT.el('p', { text: 'Похоже, ответ генератора оказался необычным. Попробуй ещё раз — следующий сайт будет другим.' }),
          APP.KIT.el('button', {
            class: 'lg-btn primary', type: 'button', text: 'Собрать заново',
            onclick: () => generateLocal('Собрано локально, без ИИ')
          })
        ]));
      }
      current = null;
      boot.hide();
      return;
    }
    current = mounted;
    boot.hide();
    if (meta && meta.toast) APP.KIT.toast(meta.toast, meta.kind || 'ok');
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
  }

  /* -------------------------------- запуск --------------------------------- */
  let controller = null;
  async function generate(vibe) {
    if (controller) controller.abort();
    controller = new AbortController();
    boot.show();
    bootEl.classList.remove('is-error');
    const seed = String(Date.now()).slice(-8) + Math.random().toString(36).slice(2, 6);
    try {
      const res = await APP.GEMINI.generate({
        vibe: vibe === undefined ? prefs.vibe : vibe,
        seed,
        signal: controller.signal,
        onStage: (s) => boot.setStage(s),
        onProgress: (p) => boot.setProgress(p * 0.96 + 0.02),
        onTitle: (t) => boot.setTitle(t)
      });
      boot.setProgress(1);
      boot.setStage('Готово: ' + res.spec.sections.length + ' разделов, ' + (res.spec.customGame ? 'игра-сюрприз на месте' : 'без сюрприза'));
      pushHistory(res.spec);
      mountSpec(res.spec, { toast: 'Сайт собран за ' + (res.ms / 1000).toFixed(1) + ' с' });
    } catch (e) {
      if (e && e.cancelled) { boot.hide(); return; }
      if (window.console) console.warn('generation failed', e);
      boot.error('Модель не ответила: ' + (e.message || 'неизвестная ошибка'), e.tried ? e.tried.join(' · ') : '');
    }
  }
  function generateLocal(reason) {
    const spec = APP.SPEC.fallback(String(Date.now()), { vibe: prefs.vibe });
    pushHistory(spec);
    mountSpec(spec, { toast: reason || 'Собрано локально, без ИИ' });
  }

  /* ------------------------------- панель ---------------------------------- */
  let panel = null;
  function closePanel() {
    if (!panel) return;
    const p = panel;
    panel = null;
    p.classList.remove('in');
    document.body.classList.remove('is-locked');
    setTimeout(() => p.remove(), 420);
  }
  function openPanel() {
    if (panel) { closePanel(); return; }
    const vibeInput = el('input', {
      class: 'lg-input', type: 'text', placeholder: 'например: сайт про котиков-космонавтов',
      value: APP.PREFS.vibe || '', maxlength: '160'
    });
    const chips = ['аквариум', 'космос', 'чай', 'ретро-неон', 'кот', 'зима', 'пиксели', 'море', 'кухня', 'медитация'];
    const chipRow = el('div', { class: 'lg-chips' }, chips.map((c) => {
      const b = el('button', { class: 'lg-chip-btn', type: 'button', text: c });
      b.addEventListener('click', () => { vibeInput.value = c; APP.KIT.sfx('click'); });
      return b;
    }));
    const list = el('div', { class: 'lg-history' });
    const hist = readHistory();
    if (hist.length) {
      list.append(el('div', { class: 'lg-history-title', text: 'Недавние сайты' }));
      hist.forEach((h) => {
        const row = el('button', { class: 'lg-history-row', type: 'button' }, [
          el('span', { class: 'lg-history-emoji', text: h.emoji || '🫧' }),
          el('span', { class: 'lg-history-name', text: h.title }),
          el('span', { class: 'lg-history-time', text: new Date(h.at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })
        ]);
        row.addEventListener('click', () => { closePanel(); mountSpec(h.spec, { toast: 'Вернул прошлый сайт' }); });
        list.append(row);
      });
    }
    const sw = (label, key, onChange) => {
      const btn = el('button', { class: 'lg-switch' + (APP.PREFS[key] ? ' is-on' : ''), type: 'button' }, [
        el('span', { text: label }), el('i')
      ]);
      btn.addEventListener('click', () => {
        APP.PREFS[key] = !APP.PREFS[key];
        btn.classList.toggle('is-on', APP.PREFS[key]);
        APP.savePrefs();
        APP.KIT.sfx('click');
        if (onChange) onChange(APP.PREFS[key]);
      });
      return btn;
    };
    const card = el('div', { class: 'lg-modal-card lg-glass' }, [
      el('button', { class: 'lg-modal-close', type: 'button', text: '✕', onclick: closePanel }),
      el('h3', { text: 'Что собрать?' }),
      el('p', { class: 'lg-modal-sub', text: 'Напиши тему или оставь поле пустым — тогда движок выберет направление сам. Следующий сайт будет совсем другим.' }),
      vibeInput,
      chipRow,
      el('div', { class: 'lg-modal-actions' }, [
        el('button', {
          class: 'lg-btn primary', type: 'button', text: 'Собрать сайт', onclick: () => {
            APP.PREFS.vibe = vibeInput.value.trim();
            APP.savePrefs();
            closePanel();
            generate(APP.PREFS.vibe);
          }
        }),
        el('button', {
          class: 'lg-btn', type: 'button', text: 'Случайно без ИИ', onclick: () => { closePanel(); generateLocal(); }
        })
      ]),
      el('div', { class: 'lg-modal-toggles' }, [
        sw('Меньше анимаций', 'reduceMotion', (v) => document.documentElement.classList.toggle('no-motion', v)),
        sw('Без звука', 'muted')
      ]),
      list
    ]);
    const overlay = el('div', { class: 'lg-modal' }, [card]);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });
    document.body.append(overlay);
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => overlay.classList.add('in'));
    setTimeout(() => vibeInput.focus(), 260);
    panel = overlay;
  }

  /* ---------------------------- ссылка-поделиться -------------------------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => copyFallback(text));
    }
    return Promise.resolve(copyFallback(text));
  }
  function copyFallback(text) {
    try {
      const ta = el('textarea', { style: { position: 'fixed', top: '-1000px' } });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      APP.KIT.toast('Ссылка скопирована', 'ok');
    } catch (e) {
      window.prompt('Скопируй ссылку:', text);
    }
  }
  async function share(spec) {
    try {
      let hash = await APP.SPEC.encodeShare(spec);
      let note = 'Ссылка скопирована — в ней весь сайт';
      if (hash.length > APP.CONFIG.SHARE_LIMIT) {
        hash = await APP.SPEC.encodeShare(Object.assign({}, spec, { customGame: null }));
        note = 'Ссылка без игры-сюрприза: она слишком большая для адресной строки';
      }
      const url = location.origin + location.pathname + '#s=' + hash;
      APP.KIT.sfx('ok');
      await copyText(url);
      APP.KIT.toast(note, 'ok');
    } catch (e) {
      APP.KIT.toast('Не получилось собрать ссылку', 'err');
    }
  }

  /* -------------------------------- вход ----------------------------------- */
  async function start() {
    document.documentElement.dataset.mode = APP.RENDER.resolveMode(APP.PREFS.mode);
    document.documentElement.classList.toggle('no-motion', !!APP.PREFS.reduceMotion);

    const params = new URLSearchParams(location.search);
    const hash = location.hash || '';

    if (hash.indexOf('#s=') === 0) {
      const spec = await APP.SPEC.decodeShare(hash.slice(3));
      if (spec) { mountSpec(spec, { toast: 'Открыт присланный сайт' }); return; }
      APP.KIT.toast('Ссылка повреждена — соберу новый сайт', 'err');
    }
    generate(params.get('vibe') || prefs.vibe || '');
  }

  /* ------------------------------ обработчики ------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (panel) return closePanel();
    const full = document.querySelector('.lg-game.is-full');
    if (full) {
      const btn = full.querySelector('.lg-game-foot .lg-btn');
      if (btn) btn.click();
    }
  });
  document.addEventListener('visibilitychange', () => { /* игры сами уважают document.hidden */ });

  const retryBtn = document.getElementById('lg-retry');
  if (retryBtn) retryBtn.addEventListener('click', () => generate(APP.PREFS.vibe || ''));
  const localBtn = document.getElementById('lg-local');
  if (localBtn) localBtn.addEventListener('click', () => generateLocal('Собрано локально: интернет не понадобился'));
  const cancelBtn = document.getElementById('lg-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => { if (controller) controller.abort(); boot.hide(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  APP.UI = { openPanel, closePanel, share, generate, generateLocal };
})(typeof window !== 'undefined' ? window : globalThis);
